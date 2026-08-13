/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { writeStderrLine } from '../../utils/stdioHelpers.js';
/**
 * A long-lived Server-Sent-Events writer for the ACP-over-HTTP transport.
 *
 * Unlike the REST `/session/:id/events` stream (qwen event envelopes), the
 * ACP transport carries raw JSON-RPC 2.0 objects as the SSE `data:` payload
 * — one object per frame. The RFD keeps these streams open for the life of
 * the connection/session, so the writer must:
 *   - serialize writes through a single chain (heartbeat can't interleave),
 *   - respect backpressure (`res.write` → false ⇒ await `drain`),
 *   - emit periodic comment heartbeats to keep NAT/proxies alive.
 *
 * This mirrors the battle-tested pattern in `server.ts`'s SSE handler,
 * including the optional ring-buffer `id:` sequencing that drives
 * `Last-Event-ID` resume (see `docs/design/daemon-acp-http/sse-resumable-stream.md`).
 */
export class SseStream {
    res;
    onClose;
    onHeartbeat;
    kind = 'sse';
    writeChain = Promise.resolve();
    heartbeat;
    closed = false;
    cleanupFn;
    constructor(res, onClose, 
    /**
     * Fired on each heartbeat tick while the stream is open. Used to mark the
     * connection active so a long-running prompt that emits no intermediate
     * frames for >30 min isn't reaped by the idle-TTL sweep.
     */
    onHeartbeat) {
        this.res = res;
        this.onClose = onClose;
        this.onHeartbeat = onHeartbeat;
    }
    /** Write SSE headers + retry hint and start the heartbeat. */
    open() {
        this.res.status(200);
        this.res.setHeader('Content-Type', 'text/event-stream');
        this.res.setHeader('Cache-Control', 'no-cache, no-transform');
        this.res.setHeader('Connection', 'keep-alive');
        this.res.setHeader('X-Accel-Buffering', 'no');
        this.res.flushHeaders();
        void this.writeRaw('retry: 3000\n\n');
        this.heartbeat = setInterval(() => {
            if (this.closed)
                return;
            this.onHeartbeat?.();
            void this.writeRaw(': hb\n\n');
        }, 15_000);
        this.heartbeat.unref();
        this.cleanupFn = () => this.close();
        this.res.req.on('close', this.cleanupFn);
        this.res.on('error', this.cleanupFn);
    }
    /**
     * Serialize a JSON-RPC message as one SSE frame. When `id` is supplied
     * (a bus event id) prepend an `id:` line so an EventSource/SSE client
     * tracks it and resends it as `Last-Event-ID` on reconnect — the resume
     * cursor for ring replay. Omitted for JSON-RPC responses and synthetic
     * terminal frames (no bus id), matching REST `formatSseFrame`.
     */
    send(message, id) {
        const idLine = id !== undefined ? `id: ${id}\n` : '';
        return this.writeRaw(`${idLine}data: ${JSON.stringify(message)}\n\n`);
    }
    get isClosed() {
        return this.closed;
    }
    close() {
        if (this.closed)
            return;
        this.closed = true;
        if (this.heartbeat)
            clearInterval(this.heartbeat);
        if (this.cleanupFn) {
            this.res.req.off('close', this.cleanupFn);
            this.res.off('error', this.cleanupFn);
            this.cleanupFn = undefined;
        }
        try {
            if (!this.res.writableEnded)
                this.res.end();
        }
        catch {
            // socket already gone — nothing to flush
        }
        // Guard `onClose`: `close()` can run inside a socket `'error'`/`'close'`
        // event handler, and a throwing callback there would escape into Node's
        // emitter stack (potential crash). Swallow + log instead.
        try {
            this.onClose?.();
        }
        catch (err) {
            writeStderrLine(`qwen serve: /acp SSE onClose threw: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    writeRaw(chunk) {
        const next = this.writeChain.then(() => this.doWrite(chunk));
        // The stream OWNS write-failure handling: callers fire-and-forget
        // (`void stream.send(...)`), so a broken socket would otherwise leave a
        // zombie stream (heartbeats firing, no events delivered, no log). On the
        // first failure, log once and close so the subscription tears down.
        this.writeChain = next.catch((err) => {
            if (!this.closed) {
                writeStderrLine(`qwen serve: /acp SSE write failed, closing stream: ${err instanceof Error ? err.message : String(err)}`);
                this.close();
            }
            return undefined;
        });
        return next;
    }
    doWrite(chunk) {
        return new Promise((resolve, reject) => {
            if (this.closed || this.res.writableEnded) {
                resolve();
                return;
            }
            let ok;
            try {
                ok = this.res.write(chunk);
            }
            catch (err) {
                reject(err);
                return;
            }
            if (ok) {
                resolve();
                return;
            }
            const cleanup = () => {
                this.res.off('drain', onDrain);
                this.res.off('close', onCloseEv);
                this.res.off('error', onErrorEv);
            };
            const onDrain = () => {
                cleanup();
                resolve();
            };
            const onCloseEv = () => {
                cleanup();
                resolve();
            };
            const onErrorEv = (err) => {
                cleanup();
                reject(err);
            };
            this.res.once('drain', onDrain);
            this.res.once('close', onCloseEv);
            this.res.once('error', onErrorEv);
        });
    }
}
//# sourceMappingURL=sse-stream.js.map