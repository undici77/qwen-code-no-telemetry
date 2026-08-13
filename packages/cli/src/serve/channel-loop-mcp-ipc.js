/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomUUID } from 'node:crypto';
export const CHANNEL_LOOP_MCP_IPC_TIMEOUT_MS = 30_000;
export const MAX_CHANNEL_LOOP_MCP_IN_FLIGHT = 64;
const MAX_IPC_ID_LENGTH = 128;
const MAX_SESSION_ID_LENGTH = 512;
const MAX_ERROR_LENGTH = 512;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isBoundedString(value, maxLength) {
    return (typeof value === 'string' && value.length > 0 && value.length <= maxLength);
}
function isBaseMessage(value) {
    return isRecord(value) && isBoundedString(value['id'], MAX_IPC_ID_LENGTH);
}
export function isChannelLoopMcpControlMessage(value) {
    return (isBaseMessage(value) &&
        (value['type'] === 'channel_loop_mcp_register' ||
            value['type'] === 'channel_loop_mcp_unregister') &&
        isBoundedString(value['sessionId'], MAX_SESSION_ID_LENGTH));
}
export function isChannelLoopMcpControlResultMessage(value) {
    return (isBaseMessage(value) &&
        value['type'] === 'channel_loop_mcp_control_result' &&
        typeof value['ok'] === 'boolean' &&
        (value['error'] === undefined ||
            isBoundedString(value['error'], MAX_ERROR_LENGTH)));
}
export function isChannelLoopMcpRequestMessage(value) {
    return (isBaseMessage(value) &&
        value['type'] === 'channel_loop_mcp_message' &&
        isBoundedString(value['sessionId'], MAX_SESSION_ID_LENGTH) &&
        isRecord(value['payload']));
}
export function isChannelLoopMcpResultMessage(value) {
    return (isBaseMessage(value) &&
        value['type'] === 'channel_loop_mcp_result' &&
        typeof value['ok'] === 'boolean' &&
        (value['payload'] === undefined || isRecord(value['payload'])) &&
        (value['error'] === undefined ||
            isBoundedString(value['error'], MAX_ERROR_LENGTH)));
}
export function createChannelLoopMcpRequest(sessionId, payload) {
    if (!isBoundedString(sessionId, MAX_SESSION_ID_LENGTH)) {
        throw new Error('Invalid channel loop MCP session id.');
    }
    if (!isRecord(payload)) {
        throw new Error('Invalid channel loop MCP payload.');
    }
    return {
        type: 'channel_loop_mcp_message',
        id: randomUUID(),
        sessionId,
        payload,
    };
}
export class ChannelLoopMcpWorkerHost {
    send;
    handlers = new Map();
    pending = new Map();
    disposed = false;
    constructor(send) {
        this.send = send;
    }
    async register(sessionId, handler) {
        this.handlers.set(sessionId, handler);
        try {
            await this.sendControl('channel_loop_mcp_register', sessionId);
        }
        catch (error) {
            if (this.handlers.get(sessionId) === handler) {
                this.handlers.delete(sessionId);
            }
            throw error;
        }
    }
    async unregister(sessionId) {
        this.handlers.delete(sessionId);
        await this.sendControl('channel_loop_mcp_unregister', sessionId);
    }
    handleMessage(value) {
        if (isChannelLoopMcpControlResultMessage(value)) {
            const pending = this.pending.get(value.id);
            if (!pending)
                return true;
            this.pending.delete(value.id);
            clearTimeout(pending.timer);
            if (value.ok)
                pending.resolve();
            else
                pending.reject(new Error(value.error ?? 'Channel loop MCP failed.'));
            return true;
        }
        if (!isChannelLoopMcpRequestMessage(value))
            return false;
        void this.handleRequest(value);
        return true;
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.handlers.clear();
        for (const pending of this.pending.values()) {
            clearTimeout(pending.timer);
            pending.reject(new Error('Channel loop MCP IPC closed.'));
        }
        this.pending.clear();
    }
    sendControl(type, sessionId) {
        if (this.disposed) {
            return Promise.reject(new Error('Channel loop MCP IPC is closed.'));
        }
        if (!isBoundedString(sessionId, MAX_SESSION_ID_LENGTH)) {
            return Promise.reject(new Error('Invalid channel loop MCP session id.'));
        }
        if (this.pending.size >= MAX_CHANNEL_LOOP_MCP_IN_FLIGHT) {
            return Promise.reject(new Error('Channel loop MCP IPC queue is full.'));
        }
        const id = randomUUID();
        const message = { type, id, sessionId };
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error('Channel loop MCP IPC timed out.'));
            }, CHANNEL_LOOP_MCP_IPC_TIMEOUT_MS);
            timer.unref();
            this.pending.set(id, { resolve, reject, timer });
            try {
                this.send(message, (error) => {
                    if (!error)
                        return;
                    const pending = this.pending.get(id);
                    if (!pending)
                        return;
                    this.pending.delete(id);
                    clearTimeout(pending.timer);
                    pending.reject(new Error('Channel loop MCP IPC send failed.'));
                });
            }
            catch {
                const pending = this.pending.get(id);
                if (!pending)
                    return;
                this.pending.delete(id);
                clearTimeout(pending.timer);
                pending.reject(new Error('Channel loop MCP IPC send failed.'));
            }
        });
    }
    async handleRequest(message) {
        const handler = this.handlers.get(message.sessionId);
        if (!handler) {
            this.sendResult(message.id, {
                ok: false,
                error: 'No channel loop MCP handler for this session.',
            });
            return;
        }
        try {
            const payload = await handler(message.payload);
            this.sendResult(message.id, {
                ok: true,
                payload: payload ?? { jsonrpc: '2.0', id: 0, result: {} },
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error
                ? error.message.slice(0, MAX_ERROR_LENGTH)
                : 'Channel loop MCP request failed.';
            this.sendResult(message.id, {
                ok: false,
                error: errorMessage || 'Channel loop MCP request failed.',
            });
        }
    }
    sendResult(id, result) {
        try {
            this.send({
                type: 'channel_loop_mcp_result',
                id,
                ...result,
            });
        }
        catch {
            // The parent request owns the timeout when IPC is already closed.
        }
    }
}
//# sourceMappingURL=channel-loop-mcp-ipc.js.map