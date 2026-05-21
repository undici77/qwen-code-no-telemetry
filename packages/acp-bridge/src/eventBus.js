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
export const EVENT_SCHEMA_VERSION = 1;
const DEFAULT_MAX_QUEUED = 256;
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
export const DEFAULT_RING_SIZE = 8000;
/**
 * Fraction of `maxQueued` at which a `slow_client_warning` synthetic
 * frame is force-pushed to the at-risk subscriber. The warning fires
 * ONCE per overflow episode (tracked via `sub.warned`); the queue
 * must drain below `WARN_RESET_RATIO * maxQueued` before another
 * warning can fire — small hysteresis prevents flap-near-threshold
 * spam when a subscriber oscillates around 75% full.
 */
const WARN_THRESHOLD_RATIO = 0.75;
/** See `WARN_THRESHOLD_RATIO` doc. */
const WARN_RESET_RATIO = 0.375;
/**
 * Per-bus subscriber cap. With per-subscriber `maxQueued` defaulting to
 * 256 frames, 64 concurrent subscribers caps the per-session subscriber
 * memory at ~64 × 256 = 16k queued frames (worst case). Keeps a single
 * session from being opened thousands of times by an attacker to amplify
 * each `publish()` (which is O(N) over subscribers) into a CPU/memory
 * DoS. Daemon's HTTP listener also wants `server.maxConnections`
 * configured at the listener level — see `runQwenServe.ts`.
 */
const DEFAULT_MAX_SUBSCRIBERS = 64;
/**
 * Thrown by `EventBus.subscribe()` when the per-bus subscriber cap
 * has been reached. The SSE route catches this and surfaces a
 * `stream_error` frame so rejected clients see a readable failure
 * rather than a silent empty stream.
 */
export class SubscriberLimitExceededError extends Error {
    limit;
    constructor(limit) {
        super(`EventBus subscriber limit reached (${limit})`);
        this.name = 'SubscriberLimitExceededError';
        this.limit = limit;
    }
}
// FIXME(stage-1.5, chiga0 finding 2):
// `EventBus` is currently private to the SSE route handler. Stage 1.5
// should lift it to a top-level building block (likely
// `packages/event-bus`) so other agent-exposing surfaces
// (`channels/`, `dualOutput/`, `remoteInput/`, future TUI co-host
// and WebSocket transports) subscribe through the same bus instead
// of running parallel event streams. The `BridgeEvent` shape is
// already close to what's needed; what's missing is the bus being
// publicly addressable. Reference:
// https://github.com/QwenLM/qwen-code/pull/3889#issuecomment-4427773706
export class EventBus {
    ringSize;
    maxSubscribers;
    nextId = 1;
    ring = [];
    subs = new Set();
    closed = false;
    constructor(ringSize = DEFAULT_RING_SIZE, maxSubscribers = DEFAULT_MAX_SUBSCRIBERS) {
        this.ringSize = ringSize;
        this.maxSubscribers = maxSubscribers;
    }
    /** Most recent id ever assigned by `publish`. 0 if no events published. */
    get lastEventId() {
        return this.nextId - 1;
    }
    /** Snapshot of the live subscriber count. */
    get subscriberCount() {
        return this.subs.size;
    }
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
    publish(input) {
        // Publishing against a closed bus is a no-op rather than a throw.
        // The shutdown path closes per-session buses *before* awaiting
        // `channel.kill()`, which leaves a small window where the agent can
        // still emit a `sessionUpdate` notification or fire a
        // `requestPermission`. Throwing here would force every call site to
        // wrap publish in try/catch — and would corrupt state in
        // `BridgeClient.requestPermission`, where the daemon-wide pending
        // map mutation runs *before* the publish (see executor in
        // `httpAcpBridge.ts`). Returning undefined keeps callers
        // straightforward; nobody can observe a frame nobody can subscribe
        // to anyway.
        if (this.closed)
            return undefined;
        const event = {
            id: this.nextId++,
            v: EVENT_SCHEMA_VERSION,
            ...input,
        };
        this.ring.push(event);
        // Eviction-by-shift is O(n) once the ring is full. At the current
        // default `ringSize=8000` (#3803 §02) the per-publish shift work
        // measures in low milliseconds on chatty sessions — still well
        // below per-frame latency budgets. A circular-buffer refactor
        // would push it to O(1) but adds index bookkeeping; deferred until
        // profiling actually flags it, or the operator bumps
        // `--event-ring-size` to an order of magnitude larger.
        if (this.ring.length > this.ringSize)
            this.ring.shift();
        // Snapshot the subscribers so an in-loop `this.subs.delete(sub)`
        // (the new immediate-eviction cleanup below) doesn't mutate the
        // Set we're iterating.
        for (const sub of Array.from(this.subs)) {
            if (sub.evicted)
                continue;
            if (!sub.queue.push(event)) {
                sub.evicted = true;
                // Synthetic terminal frame: NO `id` field. Otherwise it would
                // burn a slot in the per-session monotonic sequence (`nextId++`)
                // visible to every OTHER subscriber as a gap (3 → 5, missing 4).
                // Healthy subscribers would see the gap on the live stream and
                // on `Last-Event-ID: 3` resume the ring has no record of 4
                // either — silently broken contiguity contradicts the
                // `BridgeEvent.id` doc-comment. Same pattern as `stream_error`
                // in server.ts; `formatSseFrame` omits the `id:` line when
                // `id` is absent.
                const evictionFrame = {
                    v: EVENT_SCHEMA_VERSION,
                    type: 'client_evicted',
                    data: { reason: 'queue_overflow', droppedAfter: event.id },
                };
                // Force-push the eviction frame; close immediately after so the
                // consumer iterator unwinds with a final synthetic event.
                sub.queue.forcePush(evictionFrame);
                sub.queue.close();
                // BmJT1: dispose the subscription cleanly. `sub.dispose()`
                // both removes from `this.subs` AND detaches the
                // AbortSignal listener that `subscribe()` registered. Pre-
                // fix the eviction path only did `this.subs.delete(sub)`,
                // leaving the abort listener attached against the stalled
                // consumer's signal — the queue + sub closures were
                // retained until the AbortSignal itself went out of scope.
                // Under attack (thousands of stalled SSE clients) this
                // amplified into significant heap retention.
                sub.dispose();
                continue;
            }
            // Backpressure warning: synthetic `slow_client_warning` frame to
            // the at-risk subscriber when its live backlog crosses
            // `WARN_THRESHOLD_RATIO`. Fires ONCE per overflow episode (the
            // `warned` flag clears only after `WARN_RESET_RATIO` hysteresis
            // drain). Like `client_evicted` the frame carries no `id` — it
            // is private to this subscriber and must not burn a sequence
            // slot the replay ring would otherwise be missing for other
            // healthy subscribers. Force-push so the warning bypasses the
            // exact backlog cap that triggered it.
            //
            // Ordering: `forcePush` appends to the queue's back. Pushing to
            // the FRONT was considered to maximize lead-time, but (a) the
            // forward-position invariant in `BoundedAsyncQueue.next()`'s
            // `forcedInBuf` accounting is sized for "replay at front, live
            // at back" — mid-stream front-insertion would mis-count the
            // live backlog cap; and (b) when a consumer is actively
            // `await`ing `next()`, `forcePush`'s `resolvers.shift()`
            // shortcut delivers the warning immediately without ever
            // touching `buf`. The back-of-queue case only matters for
            // stalled consumers — and a stalled consumer can't drain
            // regardless of warning position, so the ordering is
            // informational by the time they finally pull it.
            //
            // The `warnThreshold` / `warnResetThreshold` are pre-computed
            // at `subscribe()` time so the per-publish hot path is one
            // integer compare per subscriber (after the `!warned`
            // short-circuit collapses warm-state checks to a single
            // boolean read).
            const liveSize = sub.queue.size;
            if (!sub.warned && liveSize >= sub.warnThreshold) {
                sub.warned = true;
                const warningFrame = {
                    v: EVENT_SCHEMA_VERSION,
                    type: 'slow_client_warning',
                    data: {
                        queueSize: liveSize,
                        maxQueued: sub.maxQueued,
                        // `event.id` is always defined here — the just-published
                        // `event` is constructed at the top of `publish()` with
                        // `id: this.nextId++`. No `??` fallback needed.
                        lastEventId: event.id,
                    },
                };
                sub.queue.forcePush(warningFrame);
            }
            else if (sub.warned && liveSize <= sub.warnResetThreshold) {
                // Hysteresis: subscriber recovered well below the warn line,
                // re-arm so a future lag spike produces a fresh warning.
                sub.warned = false;
            }
        }
        return event;
    }
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
    subscribe(opts = {}) {
        if (this.closed) {
            return emptyAsyncIterable();
        }
        // Per-bus subscriber cap: refuse rather than admit a subscriber
        // that would push us past the limit. An accepted-but-immediately-
        // evicted alternative would still pay the `BoundedAsyncQueue`
        // allocation + the per-publish iteration cost. Throw a typed
        // error so the SSE route can surface a `stream_error` frame to
        // the rejected client (rather than returning an empty iterable
        // that closes silently — that left oncall blind to "some
        // clients get events, some don't" under load).
        if (this.subs.size >= this.maxSubscribers) {
            throw new SubscriberLimitExceededError(this.maxSubscribers);
        }
        const maxQueued = opts.maxQueued ?? DEFAULT_MAX_QUEUED;
        const queue = new BoundedAsyncQueue(maxQueued);
        // `dispose` is assigned below (mutable so the closure can reference
        // `sub.dispose`); placeholder no-op covers the brief window between
        // `subs.add(sub)` and the real assignment so an absurdly fast
        // `publish() → forcePush → close → dispose()` race can't crash.
        const sub = {
            queue,
            evicted: false,
            maxQueued,
            warnThreshold: WARN_THRESHOLD_RATIO * maxQueued,
            warnResetThreshold: WARN_RESET_RATIO * maxQueued,
            warned: false,
            dispose: () => { },
        };
        this.subs.add(sub);
        if (opts.lastEventId !== undefined) {
            // Force-push replay frames so they bypass the per-subscriber size
            // cap. The cap protects against a slow live consumer; replay is
            // already historical and silently dropping it would undermine the
            // `Last-Event-ID` resume contract (the consumer would think they
            // caught up). If the gap really is enormous, the queue will be
            // primed with a long backlog the consumer drains at its own pace.
            for (const e of this.ring) {
                // The ring only ever contains live events (publish() always
                // assigns an id before pushing to ring), so `e.id` is never
                // undefined here — but the type system can't see that since
                // BridgeEvent.id is optional for synthetic terminal frames.
                // Guard explicitly to keep narrow typing without runtime cost.
                if (e.id !== undefined && e.id > opts.lastEventId) {
                    queue.forcePush(e);
                }
            }
        }
        let disposed = false;
        const dispose = () => {
            if (disposed)
                return;
            disposed = true;
            this.subs.delete(sub);
            opts.signal?.removeEventListener('abort', onAbort);
        };
        sub.dispose = dispose;
        // Abort tears the subscription down immediately, even if the consumer
        // never iterates again — without this the entry would linger in
        // `this.subs` until somebody called `next()`/`return()`. Idempotent
        // through `disposed`, so a double-abort or race with `return()` is
        // safe.
        //
        // `{ drain: false }` so the consumer doesn't keep yielding
        // already-queued events after the abort — the subscribe doc says
        // abort closes the iterator "promptly". Draining first contradicts
        // that contract and adds post-abort work to the SSE route (each
        // drained event ends up serialized over a socket nobody is
        // listening to). The eviction path keeps default (drain=true) so
        // the synthetic `client_evicted` terminal frame still reaches the
        // consumer.
        const onAbort = () => {
            queue.close({ drain: false });
            dispose();
        };
        if (opts.signal) {
            if (opts.signal.aborted) {
                onAbort();
            }
            else {
                opts.signal.addEventListener('abort', onAbort, { once: true });
            }
        }
        return {
            [Symbol.asyncIterator]: () => ({
                async next() {
                    const r = await queue.next();
                    if (r.done)
                        dispose();
                    return r;
                },
                async return() {
                    queue.close();
                    dispose();
                    return { value: undefined, done: true };
                },
            }),
        };
    }
    /** Close all live subscribers and prevent further `publish`/`subscribe`. */
    close() {
        if (this.closed)
            return;
        this.closed = true;
        for (const sub of this.subs)
            sub.queue.close();
        this.subs.clear();
    }
}
function emptyAsyncIterable() {
    return {
        [Symbol.asyncIterator]: () => ({
            async next() {
                return { value: undefined, done: true };
            },
        }),
    };
}
class BoundedAsyncQueue {
    maxSize;
    buf = [];
    resolvers = [];
    closed = false;
    /**
     * O(1) snapshot of how many LIVE (non-forced) entries are in `buf`.
     * Maintained directly by `push()`/`next()`: any time a forced entry
     * is added or removed `liveCount` is untouched; any time a live entry
     * is added or removed `liveCount` moves with it. Replaces the
     * position-dependent `forcedInBuf` heuristic — `liveCount` is correct
     * no matter where in the queue the forced entries are.
     */
    liveCount = 0;
    constructor(maxSize) {
        this.maxSize = maxSize;
    }
    /**
     * Number of LIVE (non-force-pushed) items currently waiting in the
     * buffer. Backpressure decisions in `EventBus.publish()` (the
     * `slow_client_warning` threshold) read this value.
     */
    get size() {
        return this.liveCount;
    }
    /** Returns true if accepted, false if dropped due to overflow. */
    push(value) {
        if (this.closed)
            return false;
        const r = this.resolvers.shift();
        if (r) {
            r({ value, done: false });
            return true;
        }
        // Cap is on the LIVE backlog only.
        if (this.liveCount >= this.maxSize)
            return false;
        this.buf.push({ value, forced: false });
        this.liveCount += 1;
        return true;
    }
    /** Bypasses the size cap. Used for replay frames, eviction terminal,
     * and slow-client warnings. */
    forcePush(value) {
        if (this.closed)
            return;
        const r = this.resolvers.shift();
        if (r) {
            r({ value, done: false });
            return;
        }
        this.buf.push({ value, forced: true });
    }
    /**
     * Mark the queue closed. By default `next()` continues to drain
     * any items already in `buf` before returning `done: true` —
     * that's what the eviction path relies on (the synthetic
     * `client_evicted` frame is force-pushed THEN close is called,
     * and we want the consumer to see the terminal frame before the
     * iterator unwinds).
     *
     * Pass `{ drain: false }` to drop buffered items immediately
     * (the AbortSignal-driven unsubscribe path uses this — the
     * subscribe docstring says abort should close the iterator
     * promptly, but draining hundreds of queued events first
     * contradicts that and adds post-abort work to the SSE route).
     */
    close(opts = {}) {
        if (this.closed)
            return;
        this.closed = true;
        if (opts.drain === false) {
            // Truncate the buffer so subsequent `next()` calls see the
            // closed sentinel immediately.
            this.buf.length = 0;
            this.liveCount = 0;
        }
        while (this.resolvers.length > 0) {
            this.resolvers.shift()({
                value: undefined,
                done: true,
            });
        }
    }
    next() {
        // Length check first — `buf.shift() !== undefined` would mis-handle a
        // queue whose element type legitimately includes `undefined`. The bus
        // never pushes undefined today, but the queue is generic.
        if (this.buf.length > 0) {
            const entry = this.buf.shift();
            if (!entry.forced)
                this.liveCount -= 1;
            return Promise.resolve({ value: entry.value, done: false });
        }
        if (this.closed) {
            return Promise.resolve({
                value: undefined,
                done: true,
            });
        }
        return new Promise((resolve) => this.resolvers.push(resolve));
    }
}
//# sourceMappingURL=eventBus.js.map