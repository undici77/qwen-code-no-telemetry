/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Reusable helpers for `qwen serve` daemon tests:
 *
 *   - `spawnDaemon` lifts the inline `beforeAll` boot pattern from
 *     `qwen-serve-routes.test.ts` / `qwen-serve-streaming.test.ts` into one
 *     place so test files don't reimplement port-0 wait + token + workspace
 *     pinning + SIGTERM teardown.
 *   - `getRssMB` / `startRssPolling` sample the daemon process's RSS via
 *     `ps -o rss=`. POSIX-only (no Windows). Used to capture the RSS curve
 *     across session counts.
 *   - `countDescendants` walks the daemon's process tree via `pgrep -P`
 *     (matches the existing inline pattern at
 *     `qwen-serve-streaming.test.ts:144`, with optional filtered subtree
 *     matching). Used to surface the P1 "MCP child × session"
 *     amplification before the M2 shared-pool fix.
 *   - `percentiles` is a dependency-free p50/p90/p99 calculator for the
 *     prompt-latency suite.
 *   - `consumeSseEvents` drives the daemon's SSE stream at a configurable
 *     rate so the SSE backpressure tests can observe `client_evicted`.
 *
 * Skip-on-Windows is the caller's responsibility: at the top of every test
 * file that imports this harness, gate with
 * `if (process.platform === 'win32') describe.skip(...)`. The harness
 * functions assume `ps` and `pgrep` are present.
 */
import { spawn, execFileSync, } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DaemonClient } from '@qwen-code/sdk';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * Default workspace and CLI binary resolution mirrors the existing
 * `qwen-serve-routes.test.ts` constants so callers that copy/paste between
 * test files don't see drift.
 */
export const DEFAULT_REPO_ROOT = path.resolve(__dirname, '../..');
export const DEFAULT_TOKEN = 'integration-test-token';
export const DEFAULT_CLI_BIN = process.env['TEST_CLI_PATH'] ??
    path.resolve(__dirname, '../../packages/cli/dist/index.js');
const LISTENING_RE = /listening on http:\/\/127\.0\.0\.1:(\d+)/;
const DISPOSE_GRACE_MS = 5_000;
const MATCHED_DESCENDANT_DEPTH = 4;
export async function spawnDaemon(opts = {}) {
    const workspaceCwd = opts.workspaceCwd ?? DEFAULT_REPO_ROOT;
    const token = opts.token ?? DEFAULT_TOKEN;
    const cliBin = opts.cliBin ?? DEFAULT_CLI_BIN;
    const bootTimeoutMs = opts.bootTimeoutMs ?? 10_000;
    const extraArgs = opts.extraArgs ?? [];
    const args = [
        cliBin,
        'serve',
        '--port',
        '0',
        '--token',
        token,
        '--hostname',
        '127.0.0.1',
        '--workspace',
        workspaceCwd,
        ...extraArgs,
    ];
    const daemon = spawn(process.execPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, ...opts.env },
    });
    const stdoutBuf = { value: '' };
    const stderrBuf = { value: '' };
    daemon.stdout?.on('data', (chunk) => {
        stdoutBuf.value += chunk.toString();
    });
    daemon.stderr?.on('data', (chunk) => {
        stderrBuf.value += chunk.toString();
    });
    // Parse the listening port from stdout. Mirrors the pattern in
    // qwen-serve-routes.test.ts: capture the timer handle so a successful
    // resolution clears it (an un-cleared 10s timer leaks past the spawn
    // promise and shows up as flaky test timeouts on slow CI).
    const port = await new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            daemon.stdout?.off('data', onData);
            daemon.off('exit', onExit);
            clearTimeout(bootTimer);
        };
        const fail = (err, kill = false) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            if (kill && daemon.exitCode === null) {
                daemon.kill('SIGTERM');
            }
            reject(err);
        };
        const bootTimer = setTimeout(() => {
            fail(new Error(`daemon boot timeout after ${bootTimeoutMs}ms:\n` +
                `stdout=${stdoutBuf.value}\nstderr=${stderrBuf.value}`), true);
        }, bootTimeoutMs);
        const onData = (_chunk) => {
            const m = stdoutBuf.value.match(LISTENING_RE);
            if (m) {
                if (settled)
                    return;
                settled = true;
                cleanup();
                resolve(Number(m[1]));
            }
        };
        const onExit = (code) => {
            fail(new Error(`daemon exited with ${code} before listening:\n` +
                `stdout=${stdoutBuf.value}\nstderr=${stderrBuf.value}`));
        };
        daemon.stdout.on('data', onData);
        daemon.once('exit', onExit);
    });
    const base = `http://127.0.0.1:${port}`;
    const client = new DaemonClient({ baseUrl: base, token });
    const dispose = async () => {
        if (daemon.exitCode !== null)
            return;
        daemon.kill('SIGTERM');
        await new Promise((resolve) => {
            const t = setTimeout(() => {
                // Force kill if SIGTERM didn't take in time. We don't await
                // exit again — the OS will clean up either way and a 5s
                // hang here multiplies into 5s × N tests on flaky machines.
                try {
                    daemon.kill('SIGKILL');
                }
                catch {
                    /* already gone */
                }
                resolve();
            }, DISPOSE_GRACE_MS);
            daemon.once('exit', () => {
                clearTimeout(t);
                resolve();
            });
        });
    };
    return {
        client,
        daemon,
        port,
        base,
        workspaceCwd,
        token,
        stdoutBuf,
        stderrBuf,
        dispose,
    };
}
/**
 * Write a `.qwen/settings.json` into `workspaceCwd` so the daemon picks up
 * `mcpServers` (and any other settings) at boot. Caller is responsible for
 * cleaning up the temp dir if they created one. Returns the absolute
 * settings file path for visibility in test output.
 */
export function writeWorkspaceSettings(workspaceCwd, settings) {
    const settingsDir = path.join(workspaceCwd, '.qwen');
    fs.mkdirSync(settingsDir, { recursive: true });
    const settingsPath = path.join(settingsDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return settingsPath;
}
/**
 * One-shot RSS read via `ps -o rss= -p <pid>`. Returns megabytes (rounded
 * to 1 decimal). Returns NaN if the process is gone or `ps` errored — call
 * sites should treat NaN as "skip this sample" rather than fail loudly.
 */
export function getRssMB(pid) {
    const psOpts = {
        encoding: 'utf8',
        timeout: 2_000,
        stdio: ['ignore', 'pipe', 'ignore'],
    };
    try {
        const out = execFileSync('ps', ['-o', 'rss=', '-p', String(pid)], psOpts);
        const kb = parseInt(out.trim(), 10);
        if (!Number.isFinite(kb) || kb <= 0)
            return NaN;
        return Math.round((kb / 1024) * 10) / 10;
    }
    catch {
        return NaN;
    }
}
export function startRssPolling(pid, intervalMs = 100) {
    const startedAt = Date.now();
    const samples = [];
    let droppedSamples = 0;
    const tick = () => {
        const rssMB = getRssMB(pid);
        if (!Number.isNaN(rssMB)) {
            samples.push({ tMs: Date.now() - startedAt, rssMB });
        }
        else {
            droppedSamples++;
        }
    };
    // Capture an immediate sample so a short window still has data.
    tick();
    const handle = setInterval(tick, intervalMs);
    // unref so the test process can exit without waiting for the timer.
    handle.unref?.();
    return {
        samples,
        get droppedSamples() {
            return droppedSamples;
        },
        stop: () => clearInterval(handle),
    };
}
export function countDescendants(daemonPid, pgrepOpts = {}) {
    const acpFilter = pgrepOpts.acpFilter ?? 'qwen.*--acp';
    const acpChildren = pgrepChildren(daemonPid, acpFilter);
    const mcpGrandchildren = [];
    for (const acpPid of acpChildren) {
        if (pgrepOpts.mcpFilter) {
            mcpGrandchildren.push(...pgrepMatchingDescendants(acpPid, pgrepOpts.mcpFilter, MATCHED_DESCENDANT_DEPTH));
        }
        else {
            mcpGrandchildren.push(...pgrepChildren(acpPid));
        }
    }
    return {
        acpChildren,
        mcpGrandchildren,
        total: acpChildren.length + mcpGrandchildren.length,
    };
}
function pgrepChildren(parentPid, fullCmdFilter) {
    const args = ['-P', String(parentPid)];
    if (fullCmdFilter) {
        args.unshift('-f');
        args.push(fullCmdFilter);
    }
    try {
        const out = execFileSync('pgrep', args, {
            encoding: 'utf8',
            timeout: 2_000,
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        return out
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => parseInt(line, 10))
            .filter((n) => Number.isFinite(n) && n > 0);
    }
    catch (err) {
        const error = err;
        // pgrep returns non-zero when no processes match; that's a normal
        // "0 children" outcome, not an error.
        if (error.status === 1) {
            return [];
        }
        if (error.code === 'ENOENT') {
            throw new Error('pgrep is required for daemon descendant counting');
        }
        if (error.signal === 'SIGTERM') {
            throw new Error(`pgrep timed out while listing children of ${parentPid}`);
        }
        const detail = error instanceof Error && error.message ? `: ${error.message}` : '';
        throw new Error(`pgrep failed while listing children of ${parentPid}${detail}`);
    }
}
function pgrepMatchingDescendants(parentPid, fullCmdFilter, maxDepth) {
    const matches = new Set();
    const visit = (pid, depth) => {
        if (depth <= 0)
            return;
        for (const match of pgrepChildren(pid, fullCmdFilter)) {
            matches.add(match);
        }
        for (const child of pgrepChildren(pid)) {
            visit(child, depth - 1);
        }
    };
    visit(parentPid, maxDepth);
    return [...matches];
}
export function percentiles(values) {
    if (values.length === 0) {
        return {
            count: 0,
            p50: NaN,
            p90: NaN,
            p99: NaN,
            mean: NaN,
            min: NaN,
            max: NaN,
        };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const pick = (p) => sorted[Math.min(n - 1, Math.ceil((p / 100) * n) - 1)];
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    return {
        count: n,
        p50: pick(50),
        p90: pick(90),
        p99: pick(99),
        mean: sum / n,
        min: sorted[0],
        max: sorted[n - 1],
    };
}
export async function consumeSseEvents(client, sessionId, opts = {}) {
    const maxEvents = opts.maxEvents ?? Number.POSITIVE_INFINITY;
    const consumerDelayMs = opts.consumerDelayMs ?? 0;
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const startedAt = Date.now();
    let received = 0;
    let evictedAt;
    let evictionReason;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    timer.unref?.();
    // Fold caller signal in if provided.
    const callerSignal = opts.subscribe?.signal;
    if (callerSignal) {
        callerSignal.addEventListener('abort', () => ac.abort(), { once: true });
    }
    try {
        for await (const ev of client.subscribeEvents(sessionId, {
            ...opts.subscribe,
            signal: ac.signal,
        })) {
            received++;
            if (ev.type === 'client_evicted') {
                evictedAt = ev.id;
                const data = ev.data;
                evictionReason = data?.reason;
                break;
            }
            if (received >= maxEvents)
                break;
            if (consumerDelayMs > 0) {
                await sleep(consumerDelayMs);
            }
        }
    }
    catch (err) {
        // Aborted on purpose (timeout or caller) — fall through and return
        // what we collected. Re-throw anything else.
        if (!(err instanceof Error) ||
            (err.name !== 'AbortError' && !/abort/i.test(err.message))) {
            throw err;
        }
    }
    finally {
        clearTimeout(timer);
    }
    return {
        received,
        evictedAt,
        evictionReason,
        elapsedMs: Date.now() - startedAt,
    };
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=_daemon-harness.js.map