/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Event-bus for the daemon's per-session NDJSON stream.
 *
 * Design notes (from issue #3803 §04 / threat-model):
 *   - Each event carries a monotonic `id` (per session) so the SSE
 *     `Last-Event-ID` reconnect protocol can pick up where the client left
 *     off. Backed by a bounded ring of recent events for replay.
 *   - Subscribers use bounded async queues. A slow subscriber that blows
 *     past its queue limit is sent a final `client_evicted` event and
 *     closed; this keeps a stuck client from holding the daemon hostage
 *     (per the resource-exhaustion entry in the threat-model summary).
 *   - The bus is push-based; consumers iterate the returned AsyncIterable.
 *     Aborting the supplied AbortSignal closes the iterator promptly.
 */
export declare const EVENT_SCHEMA_VERSION: 1;
/** A single frame published on the bus. */
export interface BridgeEvent {
    /**
     * Monotonic per-session id, starting at 1. Absent on synthetic
     * terminal frames (e.g. `client_evicted`) so they don't burn a slot
     * in the sequence other subscribers observe — the gap would be
     * visible on the live stream and the resume ring wouldn't have the
     * skipped id either, silently breaking contiguity.
     */
    id?: number;
    /** Schema version; bumped on breaking frame changes. */
    v: typeof EVENT_SCHEMA_VERSION;
    /** Frame type: `session_update`, `client_evicted`, or daemon-pushed events. */
    type: string;
    /** Frame payload — opaque JSON. */
    data: unknown;
    /**
     * Identifier of the client that triggered the event, when known. Used by
     * fan-out consumers to suppress echoes of their own actions.
     */
    originatorClientId?: string;
}
export interface SubscribeOptions {
    /**
     * Resume from after this event id. Events with `id <= lastEventId` are
     * skipped (already delivered); newer events still buffered in the ring
     * are replayed before live events flow.
     */
    lastEventId?: number;
    /** Aborts the subscription cleanly. */
    signal?: AbortSignal;
    /**
     * Per-subscriber backlog cap. When exceeded the subscriber is evicted
     * with a final `client_evicted` event. Defaults to 256.
     */
    maxQueued?: number;
}
/**
 * Default replay-ring depth per session. Sized for a 5-second
 * reconnect window over a chatty turn — a single long-running prompt
 * can emit hundreds of frames (test plan reports 13 for a short
 * turn, real workloads can be 10× that or more once tool-call /
 * thought streams pile up). 1000 was the original default and could
 * be exhausted by a moderate turn before the client reconnected;
 * 8000 matches the target set in #3803 §02 for chatty Stage 1
 * sessions, with ~30–60× headroom over a typical-but-busy turn at
 * the cost of a few hundred KB of RAM per session. Operators can
 * override per-daemon via `qwen serve --event-ring-size <n>`.
 */
export declare const DEFAULT_RING_SIZE = 8000;
/**
 * Thrown by `EventBus.subscribe()` when the per-bus subscriber cap
 * has been reached. The SSE route catches this and surfaces a
 * `stream_error` frame so rejected clients see a readable failure
 * rather than a silent empty stream.
 */
export declare class SubscriberLimitExceededError extends Error {
    readonly limit: number;
    constructor(limit: number);
}
export declare class EventBus {
    private readonly ringSize;
    private readonly maxSubscribers;
    private nextId;
    private readonly ring;
    private readonly subs;
    private closed;
    constructor(ringSize?: number, maxSubscribers?: number);
    /** Most recent id ever assigned by `publish`. 0 if no events published. */
    get lastEventId(): number;
    /** Snapshot of the live subscriber count. */
    get subscriberCount(): number;
    /**
     * Publish an event to the bus. Returns the constructed `BridgeEvent`
     * (with `id` + `v` assigned) on success, or `undefined` when the
     * bus is closed.
     *
     * **Never throws** (BX9_p contract). Closing the bus mid-publish
     * is the only abnormal path and is handled as a return-undefined
     * no-op; subscriber-enqueue failures are caught internally and
     * translated to per-subscriber eviction. Call sites can rely on
     * this — the historical `try { publish(...) } catch {}` blocks in
     * `httpAcpBridge.ts` are defense-in-depth, not load-bearing, and
     * may be removed in a future cleanup pass without changing
     * behavior. Don't add new try/catch wrappers around `publish()`.
     */
    publish(input: Omit<BridgeEvent, 'id' | 'v'>): BridgeEvent | undefined;
    /**
     * Note: registration is synchronous — by the time `subscribe()` returns,
     * the subscriber is already attached and will receive any subsequent
     * `publish()` even if the consumer hasn't started iterating yet. (A
     * generator-style implementation would defer registration to the first
     * `next()` call, which races with publishes that happen before the
     * consumer's first await.)
     *
     * The returned iterator is NOT safe to drive from concurrent callers —
     * two simultaneous `.next()` calls would race for the same event from
     * the underlying queue. Daemon usage is sequential (`for await ... of`
     * inside the SSE route), so this is safe in production. Callers that
     * fan an iterator out to multiple consumers must serialize themselves.
     */
    subscribe(opts?: SubscribeOptions): AsyncIterable<BridgeEvent>;
    /** Close all live subscribers and prevent further `publish`/`subscribe`. */
    close(): void;
}
