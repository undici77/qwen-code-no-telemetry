/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { attachAgentViewSupervisorTerminal, callAgentViewSupervisor, requestAgentViewSupervisor, subscribeAgentViewSupervisor, } from './supervisor-client.js';
import { AGENT_VIEW_PROTOCOL_VERSION } from './protocol.js';
import { createAgentViewSupervisorHandler, getAgentViewSupervisorSocketPath, } from './supervisor-process.js';
import { createAgentViewSupervisorServer } from './supervisor-server.js';
import { getAgentViewStorePaths, readAgentViewSupervisor, writeAgentViewSupervisor, } from './supervisor-store.js';
import { buildCurrentQwenCliArgv } from './current-cli-argv.js';
export const INTERNAL_AGENT_VIEW_SUPERVISOR_ARG = '--internal-agent-view-supervisor';
const SUPERVISOR_READY_RETRIES = 600;
const SUPERVISOR_READY_DELAY_MS = 50;
const SUPERVISOR_MAINTENANCE_INTERVAL_MS = 5000;
const LONG_AGENT_VIEW_OPERATION_TIMEOUT_MS = 30_000;
export async function ensureAgentViewSupervisor(options = {}) {
    const socketPath = getAgentViewSupervisorSocketPath({
        ...(options.globalDir ? { globalDir: options.globalDir } : {}),
    });
    if (await canReachSupervisor(socketPath, options)) {
        return createSupervisorHandle(socketPath, undefined, await readSupervisorAuthToken(options));
    }
    return withSupervisorStartLock(options, socketPath, async () => {
        if (await canReachSupervisor(socketPath, options)) {
            return createSupervisorHandle(socketPath, undefined, await readSupervisorAuthToken(options));
        }
        const startedProcess = (options.spawnProcess ?? defaultSpawnSupervisor)([
            INTERNAL_AGENT_VIEW_SUPERVISOR_ARG,
        ]);
        startedProcess.unref?.();
        await waitForSpawnedSupervisorReady(startedProcess, socketPath, options);
        return createSupervisorHandle(socketPath, startedProcess, await readSupervisorAuthToken(options));
    });
}
export async function connectExistingAgentViewSupervisor(options = {}) {
    const socketPath = getAgentViewSupervisorSocketPath({
        ...(options.globalDir ? { globalDir: options.globalDir } : {}),
    });
    if (!(await canReachSupervisor(socketPath, options))) {
        return undefined;
    }
    return createSupervisorHandle(socketPath, undefined, await readSupervisorAuthToken(options));
}
export async function runAgentViewSupervisor(options = {}) {
    const socketPath = getAgentViewSupervisorSocketPath({
        ...(options.globalDir ? { globalDir: options.globalDir } : {}),
    });
    const authToken = randomUUID();
    const startedAt = new Date().toISOString();
    let closeRequested = false;
    const handler = createAgentViewSupervisorHandler({
        ...(options.globalDir ? { globalDir: options.globalDir } : {}),
        ...(options.hibernationPolicy
            ? { hibernationPolicy: options.hibernationPolicy }
            : {}),
        onShutdown: () => {
            closeRequested = true;
            setImmediate(() => {
                void Promise.resolve(server.close()).catch(() => { });
            });
        },
    });
    const server = createAgentViewSupervisorServer(handler, {
        socketPath,
        authToken,
    });
    await server.listen();
    await writeAgentViewSupervisor({
        schemaVersion: 1,
        pid: process.pid,
        socketPath,
        authToken,
        startedAt,
        updatedAt: new Date().toISOString(),
        protocolVersion: AGENT_VIEW_PROTOCOL_VERSION,
    }, options);
    await new Promise((resolve) => {
        const maintenanceInterval = setInterval(() => {
            void handler.tickIdleHibernation().catch(() => { });
        }, options.maintenanceIntervalMs ?? SUPERVISOR_MAINTENANCE_INTERVAL_MS);
        const onSigterm = () => {
            clearInterval(maintenanceInterval);
            clearInterval(closeInterval);
            void server
                .close()
                .catch(() => { })
                .finally(resolve);
        };
        const onSigint = () => {
            clearInterval(maintenanceInterval);
            clearInterval(closeInterval);
            void server
                .close()
                .catch(() => { })
                .finally(resolve);
        };
        const closeInterval = setInterval(() => {
            if (closeRequested) {
                clearInterval(maintenanceInterval);
                clearInterval(closeInterval);
                process.off('SIGTERM', onSigterm);
                process.off('SIGINT', onSigint);
                resolve();
            }
        }, 25);
        process.once('SIGTERM', onSigterm);
        process.once('SIGINT', onSigint);
    });
    await fs
        .unlink(getAgentViewStorePaths({
        ...(options.globalDir ? { globalDir: options.globalDir } : {}),
    }).supervisorPath)
        .catch(() => { });
}
function createSupervisorHandle(socketPath, startedProcess, authToken) {
    const authOptions = authToken ? { authToken } : undefined;
    return {
        socketPath,
        ...(startedProcess ? { startedProcess } : {}),
        status: () => callAgentViewSupervisor(socketPath, 'status', undefined, authOptions),
        list: (cwd) => callAgentViewSupervisor(socketPath, 'list', cwd ? { cwd } : undefined, authOptions),
        subscribe: (onEvent, onError) => subscribeAgentViewSupervisor(socketPath, onEvent, {
            ...authOptions,
            ...(onError ? { onError } : {}),
        }),
        dispatch: (prompt, cwd) => callAgentViewSupervisor(socketPath, 'dispatch', { prompt, cwd }, {
            ...authOptions,
            timeoutMs: LONG_AGENT_VIEW_OPERATION_TIMEOUT_MS,
        }),
        adopt: (params) => callAgentViewSupervisor(socketPath, 'adopt', params, {
            ...authOptions,
            timeoutMs: LONG_AGENT_VIEW_OPERATION_TIMEOUT_MS,
        }),
        attach: (sessionId) => attachAgentViewSupervisorTerminal(socketPath, sessionId, authOptions),
        peek: (sessionId) => callAgentViewSupervisor(socketPath, 'peek', { sessionId }, authOptions),
        send: (sessionId, text) => callAgentViewSupervisor(socketPath, 'send', { sessionId, text }, authOptions),
        answer: (sessionId, text) => callAgentViewSupervisor(socketPath, 'answer', { sessionId, text }, authOptions),
        logs: (sessionId) => callAgentViewSupervisor(socketPath, 'logs', { sessionId }, authOptions),
        stop: (sessionId) => callAgentViewSupervisor(socketPath, 'stop', { sessionId }, authOptions),
        kill: (sessionId) => callAgentViewSupervisor(socketPath, 'kill', { sessionId }, authOptions),
        respawn: (sessionId) => callAgentViewSupervisor(socketPath, 'respawn', sessionId ? { sessionId } : { all: true }, {
            ...authOptions,
            timeoutMs: LONG_AGENT_VIEW_OPERATION_TIMEOUT_MS,
        }),
        remove: (sessionId) => callAgentViewSupervisor(socketPath, 'remove', { sessionId }, authOptions),
        pin: (sessionId, pinned) => callAgentViewSupervisor(socketPath, 'pin', pinned === undefined ? { sessionId } : { sessionId, pinned }, authOptions),
        rename: (sessionId, displayName) => callAgentViewSupervisor(socketPath, 'rename', {
            sessionId,
            displayName,
        }, authOptions),
        shutdown: (keepWorkers) => callAgentViewSupervisor(socketPath, 'shutdown', keepWorkers === undefined ? undefined : { keepWorkers }, authOptions),
    };
}
async function waitForSpawnedSupervisorReady(startedProcess, socketPath, options) {
    const waitAbort = new AbortController();
    let cleanup = () => { };
    const startupFailure = new Promise((_, reject) => {
        const fail = (error) => {
            cleanup();
            reject(error);
        };
        const onExit = (code, signal) => {
            fail(new Error(formatSupervisorStartupExit(code, signal)));
        };
        cleanup = () => {
            startedProcess.off?.('error', fail);
            startedProcess.off?.('exit', onExit);
        };
        startedProcess.once?.('error', fail);
        startedProcess.once?.('exit', onExit);
    });
    try {
        await Promise.race([
            waitForSupervisor(socketPath, options, waitAbort.signal),
            startupFailure,
        ]);
    }
    finally {
        waitAbort.abort();
        cleanup();
    }
}
function formatSupervisorStartupExit(code, signal) {
    if (signal) {
        return `Agent View supervisor exited before becoming ready with signal ${signal}.`;
    }
    return `Agent View supervisor exited before becoming ready with code ${code ?? 'unknown'}.`;
}
async function withSupervisorStartLock(options, socketPath, startSupervisor, allowStaleLockCleanup = true) {
    const lockPath = getSupervisorStartLockPath(options);
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    try {
        await fs.mkdir(lockPath);
    }
    catch (error) {
        if (!isAlreadyExistsError(error))
            throw error;
        try {
            await waitForSupervisor(socketPath, options);
            return createSupervisorHandle(socketPath, undefined, await readSupervisorAuthToken(options));
        }
        catch (waitError) {
            if (!allowStaleLockCleanup)
                throw waitError;
            await fs.rm(lockPath, { recursive: true, force: true });
            return withSupervisorStartLock(options, socketPath, startSupervisor, false);
        }
    }
    try {
        return await startSupervisor();
    }
    finally {
        await fs.rm(lockPath, { recursive: true, force: true });
    }
}
function getSupervisorStartLockPath(options) {
    return path.join(getAgentViewStorePaths({
        ...(options.globalDir ? { globalDir: options.globalDir } : {}),
    }).daemonDir, 'supervisor.lock');
}
function isAlreadyExistsError(error) {
    return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}
async function canReachSupervisor(socketPath, options) {
    try {
        const response = await requestStatus(socketPath, 250, await readSupervisorAuthToken(options));
        return response.ok;
    }
    catch {
        return false;
    }
}
async function waitForSupervisor(socketPath, options, signal) {
    const deadlineMs = Date.now() + SUPERVISOR_READY_RETRIES * SUPERVISOR_READY_DELAY_MS;
    while (Date.now() < deadlineMs) {
        if (signal?.aborted) {
            throw new Error('Agent View supervisor startup was cancelled.');
        }
        if (await canReachSupervisor(socketPath, options))
            return;
        if (signal?.aborted) {
            throw new Error('Agent View supervisor startup was cancelled.');
        }
        await delay(SUPERVISOR_READY_DELAY_MS);
    }
    throw new Error('Agent View supervisor did not become ready.');
}
function requestStatus(socketPath, timeoutMs, authToken) {
    return requestAgentViewSupervisor(socketPath, {
        id: randomUUID(),
        op: 'status',
    }, { timeoutMs, ...(authToken ? { authToken } : {}) });
}
async function readSupervisorAuthToken(options) {
    return (await readAgentViewSupervisor({
        ...(options.globalDir ? { globalDir: options.globalDir } : {}),
    }))?.authToken;
}
function defaultSpawnSupervisor(args) {
    const argv = buildCurrentQwenCliArgv(args);
    return spawn(argv[0], argv.slice(1), {
        detached: true,
        stdio: 'ignore',
        env: {
            ...process.env,
            QWEN_CODE_NO_RELAUNCH: '1',
        },
    });
}
async function delay(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=supervisor-runner.js.map