/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { spawn } from 'node:child_process';
import * as os from 'node:os';
import { Readable, Writable } from 'node:stream';
import { getHeapStatistics } from 'node:v8';
import { CLIENT_METHODS } from '@agentclientprotocol/sdk';
// The SDK does not export its runtime validators from the package root.
/* eslint-disable import/no-internal-modules */
import { zCreateTerminalRequest, zKillTerminalCommandRequest, zReadTextFileRequest, zReleaseTerminalRequest, zRequestPermissionRequest, zSessionNotification, zTerminalOutputRequest, zWaitForTerminalExitRequest, zWriteTextFileRequest, } from '@agentclientprotocol/sdk/dist/schema/zod.gen.js';
import { redactLogCredentials } from './logRedaction.js';
import { NdJsonQueueLimitError, ndJsonStream, validateNdJsonStreamLimits, } from './ndJsonStream.js';
import { MissingCliEntryError } from './status.js';
import { EXTERNAL_TOOL_GUARD_TOKEN_ENV } from './externalToolGuard.js';
import { ProcessRegistry } from './process-registry.js';
let cachedMemoryArgs;
export const DAEMON_ACP_NDJSON_LIMITS = Object.freeze({
    maxFrameBytes: 64 * 1024 * 1024,
    maxQueuedMessages: 256,
    maxQueuedBytes: 64 * 1024 * 1024,
});
const daemonClientParamValidators = new Map([
    [CLIENT_METHODS.fs_read_text_file, zReadTextFileRequest],
    [CLIENT_METHODS.fs_write_text_file, zWriteTextFileRequest],
    [CLIENT_METHODS.session_request_permission, zRequestPermissionRequest],
    [CLIENT_METHODS.session_update, zSessionNotification],
    [CLIENT_METHODS.terminal_create, zCreateTerminalRequest],
    [CLIENT_METHODS.terminal_kill, zKillTerminalCommandRequest],
    [CLIENT_METHODS.terminal_output, zTerminalOutputRequest],
    [CLIENT_METHODS.terminal_release, zReleaseTerminalRequest],
    [CLIENT_METHODS.terminal_wait_for_exit, zWaitForTerminalExitRequest],
]);
function validateDaemonInboundMessage(message) {
    if (!('method' in message))
        return true;
    const validator = daemonClientParamValidators.get(message.method);
    return !validator || validator.safeParse(message.params).success;
}
class PreparedResponseBudget {
    limits;
    objectCharges = new WeakMap();
    primitiveCharges = new Map();
    retainedCount = 0;
    retainedBytes = 0;
    closed = false;
    constructor(limits) {
        this.limits = limits;
    }
    reserve(value) {
        if (this.closed)
            return;
        const availableBytes = Math.max(0, this.limits.maxQueuedBytes - this.retainedBytes);
        const envelopeBytes = Math.min(2_048, this.limits.maxQueuedBytes);
        const charge = envelopeBytes +
            estimatePreparedResponseBytes(value, Math.max(0, availableBytes - envelopeBytes));
        if (this.retainedCount >= this.limits.maxQueuedMessages ||
            charge > availableBytes) {
            throw new NdJsonQueueLimitError(this.limits.maxQueuedMessages, this.limits.maxQueuedBytes, charge, availableBytes);
        }
        const charges = this.getCharges(value, true);
        charges.push(charge);
        this.retainedCount++;
        this.retainedBytes += charge;
    }
    releaseMessage(message) {
        if (!isPlainRecord(message) ||
            Object.hasOwn(message, 'method') ||
            !Object.hasOwn(message, 'id')) {
            return;
        }
        const value = Object.hasOwn(message, 'result')
            ? message['result']
            : message['error'];
        const charges = this.getCharges(value, false);
        if (!charges)
            return;
        const charge = charges.shift();
        if (charge === undefined)
            return;
        if (charges.length === 0 && !isObjectValue(value)) {
            this.primitiveCharges.delete(value);
        }
        this.retainedCount--;
        this.retainedBytes -= charge;
    }
    close() {
        this.closed = true;
        this.objectCharges = new WeakMap();
        this.primitiveCharges.clear();
        this.retainedCount = 0;
        this.retainedBytes = 0;
    }
    getCharges(value, create) {
        const charges = isObjectValue(value)
            ? this.objectCharges.get(value)
            : this.primitiveCharges.get(value);
        if (charges || !create)
            return charges;
        const created = [];
        if (isObjectValue(value)) {
            this.objectCharges.set(value, created);
        }
        else {
            this.primitiveCharges.set(value, created);
        }
        return created;
    }
}
class OutboundOperationBudget {
    limits;
    retainedCount = 0;
    retainedBytes = 0;
    generation = 0;
    closed = false;
    constructor(limits) {
        this.limits = limits;
    }
    reserve(value) {
        if (this.closed)
            return () => { };
        const availableBytes = Math.max(0, this.limits.maxQueuedBytes - this.retainedBytes);
        const envelopeBytes = Math.min(2_048, this.limits.maxQueuedBytes);
        const charge = envelopeBytes +
            estimatePreparedResponseBytes(value, Math.max(0, availableBytes - envelopeBytes));
        if (this.retainedCount >= this.limits.maxQueuedMessages ||
            charge > availableBytes) {
            throw new NdJsonQueueLimitError(this.limits.maxQueuedMessages, this.limits.maxQueuedBytes, charge, availableBytes);
        }
        this.retainedCount++;
        this.retainedBytes += charge;
        const generation = this.generation;
        let active = true;
        return () => {
            if (!active)
                return;
            active = false;
            if (this.closed || this.generation !== generation)
                return;
            this.retainedCount--;
            this.retainedBytes -= charge;
        };
    }
    close() {
        this.closed = true;
        this.generation++;
        this.retainedCount = 0;
        this.retainedBytes = 0;
    }
}
function* enumerableOwnKeys(value) {
    for (const key in value) {
        if (Object.hasOwn(value, key))
            yield key;
    }
}
function estimatePreparedResponseBytes(value, limitBytes) {
    let bytes = 0;
    const stack = [{ kind: 'value', value }];
    const seen = new WeakSet();
    while (stack.length > 0) {
        const frame = stack.pop();
        if (frame.kind === 'array') {
            if (frame.index >= frame.value.length)
                continue;
            if (frame.index > 0)
                bytes++;
            if (bytes > limitBytes)
                return limitBytes + 1;
            const descriptor = Object.getOwnPropertyDescriptor(frame.value, String(frame.index));
            if (descriptor?.get || descriptor?.set)
                return limitBytes + 1;
            stack.push({ ...frame, index: frame.index + 1 });
            stack.push({ kind: 'value', value: descriptor?.value });
            continue;
        }
        if (frame.kind === 'record') {
            const next = frame.keys.next();
            if (next.done)
                continue;
            const descriptor = Object.getOwnPropertyDescriptor(frame.value, next.value);
            if (!descriptor || descriptor.get || descriptor.set) {
                return limitBytes + 1;
            }
            bytes += (frame.first ? 0 : 1) + Buffer.byteLength(next.value) + 3;
            if (bytes > limitBytes)
                return limitBytes + 1;
            stack.push({ ...frame, first: false });
            stack.push({ kind: 'value', value: descriptor.value });
            continue;
        }
        const current = frame.value;
        if (current === null) {
            bytes += 4;
        }
        else if (current === undefined) {
            bytes += 4;
        }
        else if (typeof current === 'string') {
            bytes += Buffer.byteLength(current) + 2;
        }
        else if (typeof current === 'number') {
            bytes += 24;
        }
        else if (typeof current === 'boolean') {
            bytes += 5;
        }
        else if (Array.isArray(current)) {
            if (seen.has(current) || Object.hasOwn(current, 'toJSON')) {
                return limitBytes + 1;
            }
            seen.add(current);
            bytes += 2;
            stack.push({ kind: 'array', value: current, index: 0 });
        }
        else if (isPlainRecord(current)) {
            if (seen.has(current) || Object.hasOwn(current, 'toJSON')) {
                return limitBytes + 1;
            }
            seen.add(current);
            bytes += 2;
            stack.push({
                kind: 'record',
                value: current,
                keys: enumerableOwnKeys(current),
                first: true,
            });
        }
        else {
            return limitBytes + 1;
        }
        if (bytes > limitBytes)
            return limitBytes + 1;
    }
    return Math.max(1, bytes);
}
function isObjectValue(value) {
    return typeof value === 'object' && value !== null;
}
function isPlainRecord(value) {
    if (!isObjectValue(value) || Array.isArray(value))
        return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
export function getAcpMemoryArgs() {
    if (cachedMemoryArgs)
        return cachedMemoryArgs;
    const constrainedMemory = process
        .constrainedMemory;
    const constrained = typeof constrainedMemory === 'function' ? constrainedMemory() : 0;
    const totalBytes = constrained && constrained > 0 ? constrained : os.totalmem();
    const totalMB = Math.floor(totalBytes / (1024 * 1024));
    const targetMB = Math.min(Math.floor(totalMB * 0.5), 16_384);
    const currentLimitMB = Math.floor(getHeapStatistics().heap_size_limit / (1024 * 1024));
    cachedMemoryArgs = [
        ...(targetMB > currentLimitMB ? [`--max-old-space-size=${targetMB}`] : []),
        '--expose-gc',
    ];
    return cachedMemoryArgs;
}
/**
 * Creates a stateful forwarder that buffers incoming chunks, splits on
 * newlines, writes each complete line to `process.stderr` with a prefix,
 * and optionally invokes `onDiagnosticLine` for external consumers (e.g.
 * the daemon log file writer).
 *
 * Cap behavior: if the unterminated buffer exceeds 64 KiB the excess is
 * force-flushed with a `[truncated]` marker — same memory-bounding
 * behavior as before the extraction.
 */
export function createStderrForwarder(opts) {
    const { prefix, onDiagnosticLine } = opts;
    const STDERR_LINE_CAP_CHARS = 64 * 1024;
    let buf = '';
    const flush = (line) => {
        if (line.length > 0) {
            const safe = redactLogCredentials(line);
            process.stderr.write(prefix + safe + '\n');
            if (onDiagnosticLine)
                onDiagnosticLine(prefix + safe, 'warn');
        }
    };
    return {
        onData(chunk) {
            buf += chunk;
            let nl = buf.indexOf('\n');
            while (nl !== -1) {
                flush(buf.slice(0, nl));
                buf = buf.slice(nl + 1);
                nl = buf.indexOf('\n');
            }
            // Force-flush the unterminated tail if it's grown past the cap
            // — keeps memory bounded against a `\n`-less stderr storm.
            while (buf.length > STDERR_LINE_CAP_CHARS) {
                const truncated = redactLogCredentials(buf.slice(0, STDERR_LINE_CAP_CHARS)) +
                    ' [truncated]';
                process.stderr.write(prefix + truncated + '\n');
                if (onDiagnosticLine)
                    onDiagnosticLine(prefix + truncated, 'warn');
                buf = buf.slice(STDERR_LINE_CAP_CHARS);
            }
        },
        onEnd() {
            if (buf.length > 0)
                flush(buf);
        },
    };
}
/**
 * Creates a `ChannelFactory` that spawns `qwen --acp` child processes.
 * Accepts an optional `onDiagnosticLine` callback that receives every
 * child-stderr line (already prefixed) so callers can tee to a log file
 * or structured logger without intercepting process.stderr globally.
 *
 * `defaultSpawnChannelFactory` below is `createSpawnChannelFactory()` —
 * no options, same behavior as before this refactor.
 */
export function createSpawnChannelFactory(options = {}) {
    if (options.pipeLimits)
        validateNdJsonStreamLimits(options.pipeLimits);
    const processRegistry = options.processRegistry ?? new ProcessRegistry();
    return async (workspaceCwd, childEnvOverrides) => {
        const sourceEnv = options.sourceEnv ?? process.env;
        const cliEntry = sourceEnv['QWEN_CLI_ENTRY'] || process.argv[1];
        if (!cliEntry) {
            throw new MissingCliEntryError();
        }
        const childEnv = scrubChildEnv(sourceEnv, SCRUBBED_CHILD_ENV_KEYS, childEnvOverrides);
        childEnv['QWEN_CODE_NO_RELAUNCH'] = 'true';
        // Marks the child as daemon-spawned so its ACP channel fallback reports
        // channel=daemon in usage statistics (see cli/src/config/acp-channel-fallback.ts).
        childEnv['QWEN_CODE_SERVE'] = '1';
        const execArgs = process.execArgv.filter((a) => !/^--inspect(-brk)?($|=)/.test(a));
        // Reserve BEFORE deciding: the reservation is what makes this spawn
        // visible to any other spawn racing it, so the count below includes this
        // child and two concurrent spawns cannot both be told they are alone.
        const reservation = processRegistry.reserve();
        let child;
        // Everything between `reserve()` and `attach()` belongs inside this try.
        // `childHeapPolicy` is a public `createSpawnChannelFactory` option, so an
        // externally supplied `decide()` can throw; outside the try that would
        // reject the spawn while leaving the reservation held forever, inflating
        // `committedProcessCount` for every later spawn.
        try {
            // Observation only: the policy is asked what it *would* decide so the
            // refusal count is real, but nothing here acts on the answer — no
            // derived ceiling reaches the child and no spawn is refused.
            options.childHeapPolicy?.decide(processRegistry.committedProcessCount);
            const memoryArgs = getAcpMemoryArgs();
            child = spawn(process.execPath, [
                ...execArgs,
                ...memoryArgs,
                cliEntry,
                '--acp',
                ...(options.extraArgs ?? []),
            ], {
                cwd: workspaceCwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: childEnv,
            });
        }
        catch (error) {
            reservation.cancel();
            throw error;
        }
        const trackedChild = reservation.attach(child);
        // Forward child stderr to the daemon's stderr line-by-line, with a
        // `[serve pid=… cwd=…]` prefix on each line so operators can
        // correlate stack traces back to the spawning request.
        if (child.stderr) {
            const prefix = `[serve pid=${child.pid} cwd=${workspaceCwd}] `;
            const forwarder = createStderrForwarder({
                prefix,
                onDiagnosticLine: options.onDiagnosticLine,
            });
            child.stderr.setEncoding('utf8');
            child.stderr.on('data', forwarder.onData);
            child.stderr.on('end', forwarder.onEnd);
            child.stderr.on('error', () => {
                // Don't crash the daemon if the pipe breaks; the child is
                // already gone or about to be.
            });
        }
        if (!child.stdin || !child.stdout) {
            trackedChild.killSync();
            throw new Error('Spawned ACP child has no stdin/stdout — cannot establish NDJSON channel.');
        }
        const writable = Writable.toWeb(child.stdin);
        const readable = Readable.toWeb(child.stdout);
        const preparedResponses = options.pipeLimits
            ? new PreparedResponseBudget(options.pipeLimits)
            : undefined;
        const outboundOperations = options.pipeLimits
            ? new OutboundOperationBudget(options.pipeLimits)
            : undefined;
        let reportTransportFailure;
        let transportFailureReported = false;
        const transportFailed = options.pipeLimits
            ? new Promise((resolve) => {
                reportTransportFailure = resolve;
            })
            : undefined;
        const failTransport = options.pipeLimits
            ? (error) => {
                if (transportFailureReported)
                    return;
                transportFailureReported = true;
                reportTransportFailure?.(error);
                reportTransportFailure = undefined;
                preparedResponses?.close();
                outboundOperations?.close();
                child.stdout?.destroy();
                child.stdin?.destroy();
                void trackedChild.terminate().catch(() => { });
                options.pipeHooks?.onTransportError?.(error);
            }
            : undefined;
        const pipeHooks = options.pipeLimits
            ? {
                ...options.pipeHooks,
                onMessageObserved: (observation) => {
                    if (observation.direction === 'sent') {
                        preparedResponses?.releaseMessage(observation.message);
                    }
                    options.pipeHooks?.onMessageObserved?.(observation);
                },
                onTransportError: failTransport,
            }
            : options.pipeHooks;
        const stream = ndJsonStream(writable, readable, pipeHooks, options.pipeLimits, options.pipeLimits ? validateDaemonInboundMessage : undefined, options.pipeLimits !== undefined);
        return {
            stream,
            ...(transportFailed ? { transportFailed } : {}),
            ...(failTransport && options.pipeLimits
                ? {
                    transportGuard: {
                        maxActiveHandlers: options.pipeLimits.maxQueuedMessages,
                        maxActiveHandlerBytes: options.pipeLimits.maxQueuedBytes,
                        reserveOutboundOperation: (value) => {
                            try {
                                return outboundOperations?.reserve(value) ?? (() => { });
                            }
                            catch (error) {
                                failTransport(error);
                                throw error;
                            }
                        },
                        reservePreparedResponse: (value) => {
                            try {
                                preparedResponses?.reserve(value);
                            }
                            catch (error) {
                                failTransport(error);
                                throw error;
                            }
                        },
                        fail: failTransport,
                    },
                }
                : {}),
            kill: () => trackedChild.terminate(),
            killSync: () => trackedChild.killSync(),
            exited: trackedChild.exited,
        };
    };
}
/**
 * Default channel factory: spawn the current Node executable running this
 * CLI's entry script in `--acp` mode. `process.argv[1]` resolves to the qwen
 * entry script when launched via the `qwen` bin shim.
 *
 * Note on `cwd`: CodeQL flags the `workspaceCwd` flow into `spawn({cwd})`
 * as an "uncontrolled data used in path expression" finding. That's the
 * Stage 1 trust model speaking — the caller (a token-authenticated HTTP
 * client) is treated as an extension of the operator. The agent already
 * runs as the same UID with shell-tool access, so restricting the spawn
 * cwd to a sandbox here would be theatre. Stage 4+ remote-sandbox swaps
 * this factory for a sandbox-aware variant; see the remote-sandbox plan.
 *
 * Lifted from `cli/src/serve/httpAcpBridge.ts` to `@qwen-code/acp-bridge`
 * so `channels/base/AcpBridge.ts` and the VSCode IDE
 * companion can share one spawn implementation instead of each
 * reimplementing the child lifecycle (the current divergence noted in
 * `channel.ts`'s top-of-file comment).
 *
 * Preserved as `createSpawnChannelFactory()` (no options) for backward
 * compat. Use `createSpawnChannelFactory({ onDiagnosticLine })` to also
 * tee child stderr lines through an external callback.
 */
export const defaultSpawnChannelFactory = createSpawnChannelFactory();
/**
 * Environment variables stripped from the spawned `qwen --acp` child's
 * environment. Everything else is passed through — see the
 * threat-model rationale at the call site in `defaultSpawnChannelFactory`.
 *
 * `QWEN_SERVER_TOKEN`: the daemon's own bearer token, which the agent
 * doesn't need (it speaks to the daemon over stdio, not HTTP). Leaving
 * it in the child's env would let prompt injection turn the agent into
 * an authenticated client of its own daemon — an escalation the agent
 * doesn't otherwise have.
 *
 * `QWEN_CODE_SIMPLE`: an invocation-level bare-mode override. Letting a
 * daemon or IDE environment leak it into per-session `qwen --acp`
 * children silently disables skills in those children.
 *
 * `QWEN_CODE_EXTERNAL_TOOL_GUARD_TOKEN`: daemon-local credential for the
 * loopback Guard provider. The ACP child reaches the daemon over its private
 * channel and never needs this token.
 *
 * **WARNING**: this denylist is correct *only because the agent
 * already has unrestricted shell-tool access* — anything in the env
 * is reachable via `~/.bashrc`/`~/.aws/credentials`/etc. anyway.
 * Any future mode that **removes** shell-tool access (e.g. a
 * sandbox-locked agent variant) MUST switch this back to an
 * allowlist OR significantly expand the denylist to cover common
 * provider/CI/cloud secret prefixes (`OPENAI_*`, `ANTHROPIC_*`,
 * `AWS_*`, `GITHUB_TOKEN`, `CI_*`, `*_API_KEY`, `*_SECRET`, …).
 * See the remote-sandbox plan for Stage 4+.
 *
 * Defined at module scope so the Set is allocated once at load.
 */
const SCRUBBED_CHILD_ENV_KEYS = new Set([
    'QWEN_SERVER_TOKEN',
    'QWEN_CODE_SIMPLE',
    EXTERNAL_TOOL_GUARD_TOKEN_ENV,
]);
/**
 * Build the env passed to the `qwen --acp` child. Pure function, exported
 * for unit-test access (the surrounding `defaultSpawnChannelFactory` is
 * unit-test-hostile because it actually spawns Node). Behavior:
 *
 *   1. Start from a shallow clone of `source` (no aliasing into the
 *      daemon's `process.env`).
 *   2. Delete every key listed in `scrubbed` (the daemon-internal
 *      child-env denylist; see the rationale on the constant).
 *   3. Apply `overrides` per-handle. `undefined` value deletes the key
 *      (lets an embedded caller scrub a stale inherited var without
 *      mutating the daemon's global `process.env`). Anything else
 *      assigns. **`overrides` CANNOT re-introduce a scrubbed key** —
 *      defense-in-depth so an operator passing
 *      `{ QWEN_SERVER_TOKEN: 'x' }` in overrides can't smuggle the
 *      daemon's bearer token back into the child.
 *
 * Used by `defaultSpawnChannelFactory` above. The split mirrors the
 * "scrub" comment block's structure 1:1; behavior is byte-identical to
 * the pre-extraction inline implementation.
 */
export function scrubChildEnv(source, scrubbed, overrides) {
    const childEnv = { ...source };
    for (const key of scrubbed) {
        delete childEnv[key];
    }
    if (overrides) {
        for (const [key, value] of Object.entries(overrides)) {
            if (scrubbed.has(key))
                continue;
            if (value === undefined) {
                delete childEnv[key];
            }
            else {
                childEnv[key] = value;
            }
        }
    }
    return childEnv;
}
//# sourceMappingURL=spawnChannel.js.map