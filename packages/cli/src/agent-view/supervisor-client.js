/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as net from 'node:net';
import { AGENT_VIEW_PROTOCOL_VERSION } from './protocol.js';
import { bridgeAgentViewTerminal } from './terminal-bridge.js';
export class AgentViewSupervisorClientError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'AgentViewSupervisorClientError';
    }
}
export async function requestAgentViewSupervisor(socketPath, request, options = {}) {
    const timeoutMs = options.timeoutMs ?? 5000;
    const requestWithProtocol = {
        ...request,
        protocolVersion: request.protocolVersion ?? AGENT_VIEW_PROTOCOL_VERSION,
    };
    if (options.authToken && requestWithProtocol.authToken === undefined) {
        requestWithProtocol.authToken = options.authToken;
    }
    return new Promise((resolve, reject) => {
        const socket = net.createConnection(socketPath);
        let buffer = '';
        let settled = false;
        const timeout = setTimeout(() => {
            finish(undefined, new AgentViewSupervisorClientError('Timed out waiting for Agent View supervisor response.', 'timeout'));
            socket.destroy();
        }, timeoutMs);
        const finish = (response, error) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeout);
            socket.removeAllListeners();
            if (error) {
                reject(error);
            }
            else {
                resolve(response);
            }
        };
        socket.setEncoding('utf8');
        socket.on('connect', () => {
            socket.write(`${JSON.stringify(requestWithProtocol)}\n`);
        });
        socket.on('data', (chunk) => {
            buffer += chunk;
            const newline = buffer.indexOf('\n');
            if (newline === -1)
                return;
            const line = buffer.slice(0, newline);
            try {
                finish(parseSupervisorResponse(line));
            }
            catch (error) {
                finish(undefined, error);
            }
            finally {
                socket.end();
            }
        });
        socket.on('error', (error) => finish(undefined, error));
        socket.on('end', () => {
            finish(undefined, new AgentViewSupervisorClientError('Agent View supervisor closed before sending a response.', 'closed'));
        });
    });
}
export async function callAgentViewSupervisor(socketPath, op, ...args) {
    const params = args[0];
    const options = args[1];
    const response = await requestAgentViewSupervisor(socketPath, {
        id: createRequestId(),
        op,
        ...(params ? { params } : {}),
    }, options);
    if (response.ok)
        return response.result;
    throw new AgentViewSupervisorClientError(response.error.message, response.error.code);
}
export async function attachAgentViewSupervisorTerminal(socketPath, sessionId, options = {}) {
    const socket = net.createConnection(socketPath);
    const stdin = options.stdin ?? process.stdin;
    const stdout = options.stdout ?? process.stdout;
    const request = {
        id: createRequestId(),
        protocolVersion: AGENT_VIEW_PROTOCOL_VERSION,
        ...(options.authToken ? { authToken: options.authToken } : {}),
        op: 'attachStream',
        params: { sessionId },
    };
    try {
        const { response, leftover } = await openAttachStream(socket, request, {
            timeoutMs: options.timeoutMs ?? 30_000,
        });
        if (!response.ok) {
            throw new AgentViewSupervisorClientError(response.error.message, response.error.code);
        }
        const controller = new AbortController();
        socket.once('close', () => controller.abort());
        socket.on('error', () => { });
        if (leftover.length > 0) {
            socket.pause();
            await writeToWritable(stdout, leftover);
        }
        const restoreRawMode = setRawMode(stdin, options.rawMode ?? true);
        try {
            return await bridgeAgentViewTerminal({
                stdin,
                stdout,
                pty: {
                    write(data) {
                        socket.write(data);
                    },
                    onData(callback) {
                        socket.on('data', callback);
                        socket.resume();
                        return {
                            dispose: () => {
                                socket.off('data', callback);
                            },
                        };
                    },
                    pause() {
                        socket.pause();
                    },
                    resume() {
                        socket.resume();
                    },
                    resize: (size) => {
                        void callAgentViewSupervisor(socketPath, 'resize', {
                            sessionId,
                            columns: size.columns,
                            rows: size.rows,
                        }, options.authToken ? { authToken: options.authToken } : undefined).catch(() => { });
                    },
                },
                detachSignal: controller.signal,
                onResize: createResizeSource(stdout),
            });
        }
        finally {
            restoreRawMode();
        }
    }
    finally {
        socket.destroy();
    }
}
export function subscribeAgentViewSupervisor(socketPath, onEvent, options = {}) {
    const socket = net.createConnection(socketPath);
    let buffer = '';
    let subscribed = false;
    let disposed = false;
    let errorNotified = false;
    const request = {
        id: createRequestId(),
        protocolVersion: AGENT_VIEW_PROTOCOL_VERSION,
        ...(options.authToken ? { authToken: options.authToken } : {}),
        op: 'subscribe',
    };
    const handshakeTimeout = setTimeout(() => {
        notifySubscriptionError(new AgentViewSupervisorClientError('Timed out waiting for Agent View subscription handshake.', 'timeout'));
        socket.destroy();
    }, options.timeoutMs ?? 5000);
    socket.setEncoding('utf8');
    socket.on('connect', () => {
        socket.write(`${JSON.stringify(request)}\n`);
    });
    socket.on('data', (chunk) => {
        buffer += chunk;
        while (true) {
            const newline = buffer.indexOf('\n');
            if (newline === -1)
                return;
            const line = buffer.slice(0, newline);
            buffer = buffer.slice(newline + 1);
            if (!line)
                continue;
            if (!subscribed) {
                let response;
                try {
                    response = parseSupervisorResponse(line);
                }
                catch (parseError) {
                    notifySubscriptionError(new AgentViewSupervisorClientError(`Invalid subscription response: ${parseError instanceof Error ? parseError.message : String(parseError)}`, 'invalid_response'));
                    socket.destroy();
                    return;
                }
                if (!response.ok) {
                    notifySubscriptionError(new AgentViewSupervisorClientError(response.error.message, response.error.code));
                    socket.destroy();
                    return;
                }
                subscribed = true;
                clearTimeout(handshakeTimeout);
                continue;
            }
            let event;
            try {
                event = parseSupervisorEvent(line);
            }
            catch {
                continue;
            }
            if (event) {
                try {
                    onEvent(event);
                }
                catch {
                    // Keep malformed subscribers from crashing the socket reader.
                }
            }
        }
    });
    socket.on('error', (error) => notifySubscriptionError(error));
    socket.on('close', () => {
        clearTimeout(handshakeTimeout);
        notifySubscriptionError(new AgentViewSupervisorClientError('Agent View supervisor subscription closed.', 'closed'));
    });
    return {
        dispose() {
            disposed = true;
            clearTimeout(handshakeTimeout);
            socket.destroy();
        },
    };
    function notifySubscriptionError(error) {
        if (disposed || errorNotified)
            return;
        errorNotified = true;
        options.onError?.(error);
    }
}
function createRequestId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function openAttachStream(socket, request, options = {}) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let settled = false;
        const timeout = setTimeout(() => {
            finishWithError(new AgentViewSupervisorClientError('Timed out waiting for Agent View attach response.', 'timeout'));
            socket.destroy();
        }, options.timeoutMs ?? 30_000);
        timeout.unref?.();
        const finish = (result, error) => {
            if (settled)
                return;
            settled = true;
            socket.off('connect', onConnect);
            socket.off('data', onData);
            socket.off('error', onError);
            socket.off('end', onEnd);
            clearTimeout(timeout);
            if (error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        };
        const onConnect = () => {
            socket.write(`${JSON.stringify(request)}\n`);
        };
        const onData = (chunk) => {
            chunks.push(chunk);
            const buffer = Buffer.concat(chunks);
            const newline = buffer.indexOf(10);
            if (newline === -1)
                return;
            try {
                finish({
                    response: parseSupervisorResponse(buffer.subarray(0, newline).toString('utf8')),
                    leftover: buffer.subarray(newline + 1),
                });
            }
            catch (error) {
                finishWithError(error);
            }
        };
        const onError = (error) => {
            finishWithError(error);
        };
        const onEnd = () => {
            finishWithError(new AgentViewSupervisorClientError('Agent View supervisor closed before attach handshake.', 'closed'));
        };
        const finishWithError = (error) => {
            finish({
                response: {
                    id: request.id,
                    ok: false,
                    error: { code: 'error', message: error.message },
                },
                leftover: Buffer.alloc(0),
            }, error);
        };
        socket.on('connect', onConnect);
        socket.on('data', onData);
        socket.on('error', onError);
        socket.on('end', onEnd);
    });
}
function setRawMode(stdin, enabled) {
    const maybeTty = stdin;
    if (!enabled ||
        !maybeTty.isTTY ||
        typeof maybeTty.setRawMode !== 'function') {
        return () => { };
    }
    maybeTty.setRawMode(true);
    return () => maybeTty.setRawMode?.(false);
}
function createResizeSource(stdout) {
    const maybeTty = stdout;
    if (typeof maybeTty.on !== 'function' || typeof maybeTty.off !== 'function') {
        return undefined;
    }
    return (callback) => {
        const emitSize = () => {
            const columns = maybeTty.columns;
            const rows = maybeTty.rows;
            if (Number.isInteger(columns) && Number.isInteger(rows)) {
                callback({ columns: columns, rows: rows });
            }
        };
        maybeTty.on?.('resize', emitSize);
        emitSize();
        return {
            dispose: () => {
                maybeTty.off?.('resize', emitSize);
            },
        };
    };
}
function writeToWritable(stdout, data) {
    return new Promise((resolve, reject) => {
        stdout.write(data, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
function parseSupervisorResponse(line) {
    const parsed = JSON.parse(line);
    if (!isRecord(parsed) || typeof parsed['id'] !== 'string') {
        throw new AgentViewSupervisorClientError('Invalid Agent View supervisor response.', 'invalid_response');
    }
    if (parsed['ok'] === true) {
        return {
            id: parsed['id'],
            ok: true,
            result: parsed['result'],
        };
    }
    if (parsed['ok'] === false &&
        isRecord(parsed['error']) &&
        typeof parsed['error']['code'] === 'string' &&
        typeof parsed['error']['message'] === 'string') {
        return {
            id: parsed['id'],
            ok: false,
            error: {
                code: parsed['error']['code'],
                message: parsed['error']['message'],
            },
        };
    }
    throw new AgentViewSupervisorClientError('Invalid Agent View supervisor response.', 'invalid_response');
}
function parseSupervisorEvent(line) {
    const parsed = JSON.parse(line);
    if (!isRecord(parsed) || parsed['type'] !== 'changed')
        return undefined;
    const at = typeof parsed['at'] === 'string' ? parsed['at'] : undefined;
    if (!at)
        return undefined;
    return { type: 'changed', at };
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=supervisor-client.js.map