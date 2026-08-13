/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Benchmark-only helpers extracted from `qwen-daemon-vs-cli-benchmark.test.ts`.
 *
 * These functions wrap `/usr/bin/time` to capture OS-level resource metrics
 * (peak RSS, CPU time, context switches, page faults, hardware counters)
 * for both CLI cold-start and daemon lifecycle measurements. POSIX only —
 * `/usr/bin/time -l` on macOS, `/usr/bin/time -v` on Linux.
 *
 * Also provides `measureProcessTreeRss` which walks the daemon process tree
 * via the harness's `getRssMB` / `countDescendants` to produce a breakdown
 * of daemon + ACP child + MCP grandchildren RSS.
 */
import { spawn, execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { DaemonClient } from '@qwen-code/sdk';
import { getRssMB, countDescendants, sleep, DEFAULT_CLI_BIN, DEFAULT_TOKEN, LISTENING_LINE_RE, } from './_daemon-harness.js';
const IS_DARWIN = process.platform === 'darwin';
// ---------------------------------------------------------------------------
// parseTimeOutput
// ---------------------------------------------------------------------------
export function parseTimeOutput(stderr) {
    const metrics = {
        peakRssMB: null,
        userTimeMs: null,
        sysTimeMs: null,
        voluntaryCtxSwitches: null,
        involuntaryCtxSwitches: null,
        pageFaults: null,
        pageReclaims: null,
        instructionsRetired: null,
        cyclesElapsed: null,
    };
    if (IS_DARWIN) {
        const timeLineMatch = stderr.match(/(\d+\.\d+)\s+real\s+(\d+\.\d+)\s+user\s+(\d+\.\d+)\s+sys/);
        if (timeLineMatch) {
            metrics.userTimeMs = Math.round(Number(timeLineMatch[2]) * 1000);
            metrics.sysTimeMs = Math.round(Number(timeLineMatch[3]) * 1000);
        }
        const rssMatch = stderr.match(/(\d+)\s+maximum resident set size/);
        if (rssMatch)
            metrics.peakRssMB =
                Math.round((Number(rssMatch[1]) / 1024 / 1024) * 10) / 10;
        const volCtx = stderr.match(/(\d+)\s+voluntary context switches/);
        if (volCtx)
            metrics.voluntaryCtxSwitches = Number(volCtx[1]);
        const involCtx = stderr.match(/(\d+)\s+involuntary context switches/);
        if (involCtx)
            metrics.involuntaryCtxSwitches = Number(involCtx[1]);
        const pageFaults = stderr.match(/(\d+)\s+page faults/);
        if (pageFaults)
            metrics.pageFaults = Number(pageFaults[1]);
        const pageReclaims = stderr.match(/(\d+)\s+page reclaims/);
        if (pageReclaims)
            metrics.pageReclaims = Number(pageReclaims[1]);
        const instructions = stderr.match(/(\d+)\s+instructions retired/);
        if (instructions)
            metrics.instructionsRetired = Number(instructions[1]);
        const cycles = stderr.match(/(\d+)\s+cycles elapsed/);
        if (cycles)
            metrics.cyclesElapsed = Number(cycles[1]);
    }
    else {
        const userTime = stderr.match(/User time.*?:\s*(\d+\.\d+)/);
        if (userTime)
            metrics.userTimeMs = Math.round(Number(userTime[1]) * 1000);
        const sysTime = stderr.match(/System time.*?:\s*(\d+\.\d+)/);
        if (sysTime)
            metrics.sysTimeMs = Math.round(Number(sysTime[1]) * 1000);
        const rss = stderr.match(/Maximum resident set size.*?:\s*(\d+)/);
        if (rss)
            metrics.peakRssMB = Math.round((Number(rss[1]) / 1024) * 10) / 10;
        const volCtx = stderr.match(/Voluntary context switches.*?:\s*(\d+)/);
        if (volCtx)
            metrics.voluntaryCtxSwitches = Number(volCtx[1]);
        const involCtx = stderr.match(/Involuntary context switches.*?:\s*(\d+)/);
        if (involCtx)
            metrics.involuntaryCtxSwitches = Number(involCtx[1]);
        const majorFaults = stderr.match(/Major.*?page faults.*?:\s*(\d+)/);
        if (majorFaults)
            metrics.pageFaults = Number(majorFaults[1]);
        const minorFaults = stderr.match(/Minor.*?page faults.*?:\s*(\d+)/);
        if (minorFaults)
            metrics.pageReclaims = Number(minorFaults[1]);
    }
    return metrics;
}
// ---------------------------------------------------------------------------
// spawnCliWithTime
// ---------------------------------------------------------------------------
export function spawnCliWithTime(args, opts) {
    const cliBin = DEFAULT_CLI_BIN;
    return new Promise((resolve) => {
        const t0 = performance.now();
        const timeArgs = IS_DARWIN ? ['-l'] : ['-v'];
        const child = spawn('/usr/bin/time', [...timeArgs, process.execPath, cliBin, ...args], {
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: opts?.cwd,
            env: opts?.env ? { ...process.env, ...opts.env } : undefined,
        });
        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', (c) => {
            stdout += c.toString();
        });
        child.stderr?.on('data', (c) => {
            stderr += c.toString();
        });
        child.once('exit', (code) => {
            const wallClockMs = performance.now() - t0;
            const metrics = parseTimeOutput(stderr);
            resolve({ wallClockMs, exitCode: code, stdout, stderr, ...metrics });
        });
    });
}
// ---------------------------------------------------------------------------
// measureProcessTreeRss
// ---------------------------------------------------------------------------
export function measureProcessTreeRss(daemonPid) {
    const daemonRss = getRssMB(daemonPid);
    const desc = countDescendants(daemonPid);
    let acpChildRss = 0;
    for (const pid of desc.acpChildren) {
        const rss = getRssMB(pid);
        if (!Number.isNaN(rss))
            acpChildRss += rss;
    }
    let mcpChildrenRss = 0;
    for (const pid of desc.mcpGrandchildren) {
        const rss = getRssMB(pid);
        if (!Number.isNaN(rss))
            mcpChildrenRss += rss;
    }
    const safeDaemonRss = Number.isNaN(daemonRss) ? 0 : daemonRss;
    return {
        daemonRssMB: safeDaemonRss,
        acpChildRssMB: acpChildRss,
        mcpChildrenRssMB: mcpChildrenRss,
        totalRssMB: safeDaemonRss + acpChildRss + mcpChildrenRss,
    };
}
// ---------------------------------------------------------------------------
// measureCliStartupWithProfiler
// ---------------------------------------------------------------------------
export async function measureCliStartupWithProfiler(opts) {
    const perfDir = path.join(os.homedir(), '.qwen', 'startup-perf');
    const beforeFiles = new Set();
    try {
        for (const f of fs.readdirSync(perfDir))
            beforeFiles.add(f);
    }
    catch {
        /* dir might not exist yet */
    }
    const result = await spawnCliWithTime(['-p', 'x', '--output-format', 'text'], {
        cwd: opts?.cwd,
        env: {
            QWEN_CODE_PROFILE_STARTUP: '1',
            QWEN_CODE_PROFILE_STARTUP_OUTER: '1',
        },
    });
    const profileData = {
        moduleLoadMs: null,
        configInitMs: null,
        mcpSettledMs: null,
        fullStartupMs: null,
        wallClockMs: result.wallClockMs,
        peakRssMB: result.peakRssMB,
    };
    try {
        const afterFiles = fs.readdirSync(perfDir);
        const newFile = afterFiles.find((f) => !beforeFiles.has(f));
        if (newFile) {
            const report = JSON.parse(fs.readFileSync(path.join(perfDir, newFile), 'utf-8'));
            const dp = report.derivedPhases ?? {};
            profileData.moduleLoadMs = report.processUptimeAtT0Ms ?? null;
            profileData.configInitMs = dp.config_initialize_dur ?? null;
            profileData.mcpSettledMs = dp.mcp_all_settled ?? null;
            profileData.fullStartupMs =
                report.processUptimeAtT0Ms != null && report.totalMs != null
                    ? Math.round((report.processUptimeAtT0Ms + report.totalMs) * 10) / 10
                    : null;
            try {
                fs.unlinkSync(path.join(perfDir, newFile));
            }
            catch {
                /* best-effort */
            }
        }
    }
    catch {
        /* profiler output not available — fall back to wall-clock only */
    }
    return profileData;
}
// ---------------------------------------------------------------------------
// spawnDaemonWithTime
// ---------------------------------------------------------------------------
export async function spawnDaemonWithTime(opts = {}) {
    const token = opts.token ?? DEFAULT_TOKEN;
    const cliBin = opts.cliBin ?? DEFAULT_CLI_BIN;
    const bootTimeoutMs = opts.bootTimeoutMs ?? 10_000;
    const extraArgs = opts.extraArgs ?? [];
    const daemonArgs = [
        cliBin,
        'serve',
        '--port',
        '0',
        '--token',
        token,
        '--hostname',
        '127.0.0.1',
        '--workspace',
        opts.workspaceCwd ?? process.cwd(),
        ...extraArgs,
    ];
    const timeArgs = IS_DARWIN ? ['-l'] : ['-v'];
    const child = spawn('/usr/bin/time', [...timeArgs, process.execPath, ...daemonArgs], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, ...opts.env },
    });
    const stdoutBuf = { value: '' };
    const stderrBuf = { value: '' };
    child.stdout?.on('data', (chunk) => {
        stdoutBuf.value += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
        stderrBuf.value += chunk.toString();
    });
    const port = await new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            child.stdout?.off('data', onData);
            child.off('exit', onExit);
            clearTimeout(bootTimer);
        };
        const fail = (err, kill = false) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            if (kill && child.exitCode === null)
                child.kill('SIGTERM');
            reject(err);
        };
        const bootTimer = setTimeout(() => {
            fail(new Error(`daemon boot timeout after ${bootTimeoutMs}ms:\n` +
                `stdout=${stdoutBuf.value}\nstderr=${stderrBuf.value}`), true);
        }, bootTimeoutMs);
        const onData = () => {
            const matchedPort = stdoutBuf.value.match(LISTENING_LINE_RE)?.groups?.['port'];
            if (!matchedPort || settled)
                return;
            settled = true;
            cleanup();
            resolve(Number(matchedPort));
        };
        const onExit = (code) => {
            fail(new Error(`daemon exited with ${code} before listening:\n` +
                `stdout=${stdoutBuf.value}\nstderr=${stderrBuf.value}`));
        };
        child.stdout.on('data', onData);
        child.once('exit', onExit);
    });
    const base = `http://127.0.0.1:${port}`;
    const client = new DaemonClient({ baseUrl: base, token });
    const dispose = async () => {
        if (child.exitCode !== null)
            return;
        try {
            const innerPids = execFileSync('pgrep', ['-P', String(child.pid)], {
                encoding: 'utf8',
                timeout: 2_000,
                stdio: ['ignore', 'pipe', 'ignore'],
            })
                .trim()
                .split('\n')
                .filter(Boolean)
                .map(Number);
            for (const pid of innerPids) {
                try {
                    process.kill(pid, 'SIGTERM');
                }
                catch {
                    /* already gone */
                }
            }
        }
        catch {
            child.kill('SIGTERM');
        }
        await new Promise((resolve) => {
            const t = setTimeout(() => {
                try {
                    child.kill('SIGKILL');
                }
                catch {
                    /* gone */
                }
                resolve();
            }, 8_000);
            child.once('exit', () => {
                clearTimeout(t);
                resolve();
            });
        });
        await sleep(200);
    };
    const getResourceMetrics = () => parseTimeOutput(stderrBuf.value);
    return {
        client,
        daemon: child,
        port,
        base,
        workspaceCwd: opts.workspaceCwd ?? process.cwd(),
        token,
        stdoutBuf,
        stderrBuf,
        dispose,
        getResourceMetrics,
    };
}
//# sourceMappingURL=_daemon-benchmark-helpers.js.map