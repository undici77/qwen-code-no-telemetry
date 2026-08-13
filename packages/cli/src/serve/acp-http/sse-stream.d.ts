/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Response } from 'express';
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
export declare class SseStream {
    private readonly res;
    private readonly onClose?;
    /**
     * Fired on each heartbeat tick while the stream is open. Used to mark the
     * connection active so a long-running prompt that emits no intermediate
     * frames for >30 min isn't reaped by the idle-TTL sweep.
     */
    private readonly onHeartbeat?;
    readonly kind: "sse";
    private writeChain;
    private heartbeat;
    private closed;
    private cleanupFn;
    constructor(res: Response, onClose?: (() => void) | undefined, 
    /**
     * Fired on each heartbeat tick while the stream is open. Used to mark the
     * connection active so a long-running prompt that emits no intermediate
     * frames for >30 min isn't reaped by the idle-TTL sweep.
     */
    onHeartbeat?: (() => void) | undefined);
    /** Write SSE headers + retry hint and start the heartbeat. */
    open(): void;
    /**
     * Serialize a JSON-RPC message as one SSE frame. When `id` is supplied
     * (a bus event id) prepend an `id:` line so an EventSource/SSE client
     * tracks it and resends it as `Last-Event-ID` on reconnect — the resume
     * cursor for ring replay. Omitted for JSON-RPC responses and synthetic
     * terminal frames (no bus id), matching REST `formatSseFrame`.
     */
    send(message: unknown, id?: number): Promise<void>;
    get isClosed(): boolean;
    close(): void;
    private writeRaw;
    private doWrite;
}
