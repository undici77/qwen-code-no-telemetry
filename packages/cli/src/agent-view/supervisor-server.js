/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as net from 'node:net';
import * as path from 'node:path';
import { AGENT_VIEW_PROTOCOL_VERSION } from './protocol.js';
const MAX_SUPERVISOR_REQUEST_LINE_BYTES = 1024 * 1024;
export function createAgentViewSupervisorServer(handler, options) {
    const sockets = new Set();
    const server = net.createServer((socket) => {
        sockets.add(socket);
        socket.once('close', () => sockets.delete(socket));
        socket.on('error', () => { });
        let buffer = Buffer.alloc(0);
        socket.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
            if (buffer.byteLength > MAX_SUPERVISOR_REQUEST_LINE_BYTES) {
                socket.destroy();
                return;
            }
            const newline = buffer.indexOf(0x0a);
            if (newline === -1)
                return;
            const line = buffer.subarray(0, newline).toString('utf8');
            const remaining = buffer.subarray(newline + 1);
            socket.pause();
            void respondToLine(line, handler, socket, options.authToken, options.authorizeSideband, remaining);
        });
    });
    return {
        socketPath: options.socketPath,
        async listen() {
            await prepareSocketPath(options.socketPath);
            await new Promise((resolve, reject) => {
                server.once('error', reject);
                server.listen(options.socketPath, () => {
                    server.off('error', reject);
                    server.on('error', () => { });
                    if (isWindowsPipePath(options.socketPath)) {
                        resolve();
                        return;
                    }
                    fs.chmod(options.socketPath, 0o600).then(resolve, (error) => {
                        server.close(() => reject(error));
                    });
                });
            });
        },
        async close() {
            await new Promise((resolve, reject) => {
                for (const socket of sockets) {
                    socket.destroy();
                }
                if (!server.listening) {
                    resolve();
                    return;
                }
                server.close((error) => (error ? reject(error) : resolve()));
            });
            await removeSocketPath(options.socketPath);
        },
    };
}
export async function handleAgentViewSupervisorRequest(request, handler, authToken, authorizeSideband) {
    if (!isRecord(request) || typeof request['id'] !== 'string') {
        return errorResponse('', 'invalid_request', 'Invalid supervisor request.');
    }
    if (!isCompatibleProtocolRequest(request)) {
        return errorResponse(request['id'], 'incompatible_protocol', `Unsupported Agent View protocol version ${String(request['protocolVersion'])}. Expected ${AGENT_VIEW_PROTOCOL_VERSION}.`);
    }
    const op = request['op'];
    if (!isSupervisorOperation(op)) {
        return errorResponse(request['id'], 'invalid_request', 'Unknown supervisor operation.');
    }
    if (!(await isAuthorizedSupervisorRequest(request, authToken, authorizeSideband))) {
        return errorResponse(request['id'], 'unauthorized', 'Agent View supervisor authentication failed.');
    }
    if (op === 'attachStream') {
        return errorResponse(request['id'], 'not_implemented', 'Agent View attachStream requires a streaming socket.');
    }
    if (op === 'subscribe') {
        return errorResponse(request['id'], 'not_implemented', 'Agent View subscribe requires a streaming socket.');
    }
    try {
        const params = parseSupervisorParams(op, request['params']);
        if (!handler[op]) {
            return errorResponse(request['id'], 'not_implemented', `Agent View ${op} is not implemented yet.`);
        }
        const method = handler[op];
        const result = await method?.call(handler, params);
        return {
            id: request['id'],
            ok: true,
            result,
        };
    }
    catch (error) {
        return errorResponse(request['id'], 'internal_error', error instanceof Error ? error.message : 'Supervisor request failed.');
    }
}
async function respondToLine(line, handler, socket, authToken, authorizeSideband, remaining) {
    const request = parseRequestLine(line);
    if (request &&
        request.op === 'attachStream' &&
        typeof handler.attachStream === 'function') {
        await handleStreamingOp(request, socket, authToken, remaining, 'attachStream', handler.attachStream.bind(handler), 'Attach stream failed.');
        return;
    }
    if (request &&
        request.op === 'subscribe' &&
        typeof handler.subscribe === 'function') {
        await handleStreamingOp(request, socket, authToken, remaining, 'subscribe', handler.subscribe.bind(handler), 'Subscribe failed.');
        return;
    }
    let response;
    try {
        response = await handleAgentViewSupervisorRequest(request ?? JSON.parse(line), handler, authToken, authorizeSideband);
    }
    catch {
        response = errorResponse('', 'invalid_json', 'Invalid JSON request.');
    }
    let payload;
    try {
        payload = JSON.stringify(response);
    }
    catch {
        payload = JSON.stringify(errorResponse(response.id, 'internal_error', 'Response serialization failed.'));
    }
    socket.end(`${payload}\n`);
}
async function handleStreamingOp(request, socket, authToken, remaining, op, method, fallbackErrorMessage) {
    if (!isCompatibleParsedRequest(request)) {
        socket.end(`${JSON.stringify(errorResponse(request.id, 'incompatible_protocol', `Unsupported Agent View protocol version ${String(request.protocolVersion)}. Expected ${AGENT_VIEW_PROTOCOL_VERSION}.`))}\n`);
        return;
    }
    if (!isAuthorizedParsedRequest(request, authToken)) {
        socket.end(`${JSON.stringify(errorResponse(request.id, 'unauthorized', 'Agent View supervisor authentication failed.'))}\n`);
        return;
    }
    socket.removeAllListeners('data');
    if (remaining.byteLength > 0) {
        // Preserve terminal bytes that arrived in the same packet as the request.
        socket.unshift(remaining);
    }
    // Leave the socket paused; the handler resumes it once its data listener is
    // attached. Resuming here would drop bytes for a handler that awaits first.
    try {
        await method(parseSupervisorParams(op, request.params), socket, request.id);
    }
    catch (error) {
        socket.end(`${JSON.stringify(errorResponse(request.id, 'internal_error', error instanceof Error ? error.message : fallbackErrorMessage))}\n`);
    }
}
async function prepareSocketPath(socketPath) {
    if (isWindowsPipePath(socketPath))
        return;
    const socketDir = path.dirname(socketPath);
    await fs.mkdir(socketDir, { recursive: true, mode: 0o700 });
    if (!(await socketPathExists(socketPath)))
        return;
    if (await canConnect(socketPath)) {
        const error = new Error(`Agent View supervisor socket is already in use: ${socketPath}`);
        error.code = 'EADDRINUSE';
        throw error;
    }
    await removeSocketPath(socketPath);
}
async function removeSocketPath(socketPath) {
    if (isWindowsPipePath(socketPath))
        return;
    try {
        await fs.unlink(socketPath);
    }
    catch (error) {
        if (!isNodeError(error) || error.code !== 'ENOENT') {
            throw error;
        }
    }
}
function errorResponse(id, code, message) {
    return {
        id,
        ok: false,
        error: { code, message },
    };
}
function parseSupervisorParams(_op, params) {
    return (isRecord(params) ? params : undefined);
}
function isSupervisorOperation(value) {
    return (value === 'status' ||
        value === 'list' ||
        value === 'subscribe' ||
        value === 'shutdown' ||
        value === 'dispatch' ||
        value === 'adopt' ||
        value === 'workerEvent' ||
        value === 'workerControl' ||
        value === 'attachStream' ||
        value === 'resize' ||
        value === 'peek' ||
        value === 'send' ||
        value === 'answer' ||
        value === 'logs' ||
        value === 'stop' ||
        value === 'kill' ||
        value === 'respawn' ||
        value === 'remove' ||
        value === 'pin' ||
        value === 'rename');
}
function parseRequestLine(line) {
    try {
        const parsed = JSON.parse(line);
        if (!isRecord(parsed) || typeof parsed['id'] !== 'string') {
            return undefined;
        }
        return {
            id: parsed['id'],
            ...(typeof parsed['protocolVersion'] === 'number'
                ? { protocolVersion: parsed['protocolVersion'] }
                : {}),
            op: typeof parsed['op'] === 'string' ? parsed['op'] : '',
            ...(typeof parsed['authToken'] === 'string'
                ? { authToken: parsed['authToken'] }
                : {}),
            ...(isRecord(parsed['params']) ? { params: parsed['params'] } : {}),
        };
    }
    catch {
        return undefined;
    }
}
function isWindowsPipePath(socketPath) {
    return socketPath.startsWith('\\\\.\\pipe\\');
}
async function socketPathExists(socketPath) {
    try {
        // lstat (not stat) so a symlink at a shared-dir path is seen as the link
        // itself rather than its target.
        await fs.lstat(socketPath);
        return true;
    }
    catch (error) {
        if (isNodeError(error) && error.code === 'ENOENT')
            return false;
        throw error;
    }
}
async function canConnect(socketPath) {
    return new Promise((resolve) => {
        const socket = net.createConnection(socketPath);
        let settled = false;
        function finish(result) {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeout);
            socket.removeAllListeners();
            socket.destroy();
            resolve(result);
        }
        socket.once('connect', () => finish(true));
        socket.once('error', () => finish(false));
        const timeout = setTimeout(() => finish(false), 250);
    });
}
function isCompatibleProtocolRequest(request) {
    return (request['protocolVersion'] === undefined ||
        request['protocolVersion'] === AGENT_VIEW_PROTOCOL_VERSION);
}
function isCompatibleParsedRequest(request) {
    return (request.protocolVersion === undefined ||
        request.protocolVersion === AGENT_VIEW_PROTOCOL_VERSION);
}
async function isAuthorizedSupervisorRequest(request, authToken, authorizeSideband) {
    const op = request['op'];
    if (isWorkerSidebandOperation(op)) {
        // Fail closed: sideband ops carry prompt text and approval outcomes, so
        // reject them until a per-session token validator is registered.
        if (!authorizeSideband)
            return false;
        return authorizeSideband(op, isRecord(request['params']) ? request['params'] : undefined);
    }
    if (!authToken)
        return true;
    return request['authToken'] === authToken;
}
function isAuthorizedParsedRequest(request, authToken) {
    if (!authToken)
        return true;
    return request.authToken === authToken;
}
function isWorkerSidebandOperation(op) {
    return op === 'workerEvent' || op === 'workerControl';
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isNodeError(error) {
    return error instanceof Error && 'code' in error;
}
//# sourceMappingURL=supervisor-server.js.map