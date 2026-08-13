/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { writeStderrLine } from '../../utils/stdioHelpers.js';
export class WsStream {
    ws;
    onClose;
    onHeartbeat;
    kind = 'ws';
    writeChain = Promise.resolve();
    _closed = false;
    heartbeat;
    constructor(ws, onClose, onHeartbeat) {
        this.ws = ws;
        this.onClose = onClose;
        this.onHeartbeat = onHeartbeat;
        ws.on('close', () => this.close());
        ws.on('error', (err) => {
            writeStderrLine(`qwen serve: /acp WS error: ${err instanceof Error ? err.message : String(err)}`);
            this.close();
        });
        let alive = true;
        ws.on('pong', () => {
            alive = true;
        });
        this.heartbeat = setInterval(() => {
            if (this._closed)
                return;
            if (!alive) {
                this.close();
                return;
            }
            alive = false;
            try {
                this.onHeartbeat?.();
            }
            catch {
                /* swallow — heartbeat callback must not crash the interval */
            }
            try {
                this.ws.ping();
            }
            catch {
                /* socket may be gone */
            }
        }, 15_000);
        this.heartbeat.unref();
    }
    // `_id` (bus event id) is accepted for `TransportStream` parity but ignored:
    // WebSocket is a stateful connection with no SSE `Last-Event-ID` replay
    // (matches `AcpWsTransport.supportsReplay = false`).
    send(message, _id) {
        const data = JSON.stringify(message);
        const next = this.writeChain.then(() => new Promise((resolve, reject) => {
            if (this._closed) {
                resolve();
                return;
            }
            this.ws.send(data, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }));
        this.writeChain = next.catch((err) => {
            if (!this._closed) {
                writeStderrLine(`qwen serve: /acp WS write failed: ${err instanceof Error ? err.message : String(err)}`);
                this.close();
            }
        });
        return this.writeChain;
    }
    get isClosed() {
        return this._closed;
    }
    close() {
        if (this._closed)
            return;
        this._closed = true;
        if (this.heartbeat)
            clearInterval(this.heartbeat);
        try {
            if (this.ws.readyState === this.ws.OPEN)
                this.ws.close(1000);
        }
        catch {
            /* socket gone */
        }
        try {
            this.onClose?.();
        }
        catch (err) {
            writeStderrLine(`qwen serve: /acp WS onClose threw: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
}
//# sourceMappingURL=ws-stream.js.map