/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface SessionReplaySnapshot {
  compactedTurns: BridgeEvent[];
  liveJournal: BridgeEvent[];
  lastEventId: number;
  /**
   * Present (and `true`) once the compaction engine threw during
   * `ingest`/`seedReplayEvents` for this bus. The snapshot may be
   * silently missing events from that point on; consumers should
   * prefer a full transcript reload over trusting it.
   */
  degraded?: true;
}
export interface CompactionEngine {
  /**
   * `byteLength` is the serialized size the bus already computed for the
   * event (publish's eager sizing gate) so implementations that track
   * byte budgets don't have to re-stringify. Optional — seeding paths
   * and older callers may omit it and implementations self-compute.
   */
  ingest(event: BridgeEvent, byteLength?: number): void;
  seedReplayEvents(events: BridgeEvent[]): void;
  snapshot(): SessionReplaySnapshot;
  close(): void;
}
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
   * Identifier of the admitted prompt that produced this event, when the
   * event belongs to a specific turn.
   */
  promptId?: string;
  /**
   * Envelope metadata shared by SSE and load/replay responses.
   */
  _meta?: Record<string, unknown>;
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
  /**
   * Bus epoch token the consumer's `lastEventId` was minted under. When
   * provided and it doesn't match this bus's `epoch`, the cursor belongs
   * to a dead epoch (daemon restart rebuilt the bus) and a full resync is
   * forced regardless of the numeric heuristic below.
   */
  epoch?: string;
  /** Aborts the subscription cleanly. */
  signal?: AbortSignal;
  /**
   * Per-subscriber backlog cap. When exceeded the subscriber is evicted
   * with a final `client_evicted` event. Defaults to 256.
   */
  maxQueued?: number;
  /**
   * Receives low-frequency, per-subscriber queue diagnostics. Return `true`
   * after emitting the human-facing diagnostic; `false` (or a throw) keeps the
   * EventBus legacy stderr fallback.
   */
  onSubscriberDiagnostic?: (
    diagnostic: EventBusSubscriberDiagnostic,
  ) => boolean;
}
export interface EventBusSlowClientWarningData {
  queueSize: number;
  maxQueued: number;
  lastEventId: number;
  queuedBytes: number;
  maxQueuedBytes: number;
  threshold: QueueWarningThreshold;
  triggerEventType: string;
  triggerEventBytes: number;
}
export interface EventBusClientEvictedData {
  reason: 'queue_overflow' | 'queue_bytes_overflow';
  droppedAfter: number;
  queueSize: number;
  maxQueued: number;
  queuedBytes: number;
  maxQueuedBytes: number;
  eventBytes?: number;
  triggerEventType: string;
  triggerEventBytes: number;
}
export type EventBusSubscriberDiagnostic =
  | {
      type: 'slow_client_warning';
      data: EventBusSlowClientWarningData;
    }
  | {
      type: 'client_evicted';
      data: EventBusClientEvictedData;
    };
export interface EventBusOptions {
  maxQueuedBytes?: number;
  /**
   * Total serialized-byte budget for the `Last-Event-ID` replay burst a
   * single `subscribe()` may force-push (DAEMON-011). Replay frames bypass
   * the per-subscriber live caps by design (dropping them would break the
   * resume contract), so without this bound a reconnect against a large
   * ring materializes the whole backlog into the queue at once — up to
   * `maxSubscribers` times under concurrent reconnects. When the budget
   * runs out mid-replay the remaining frames are dropped and the consumer
   * gets a `state_resync_required` (`reason: 'replay_budget_exceeded'`)
   * telling it to recover via `loadSession`. NOT named `maxReplayBytes`:
   * that name is taken by the compaction engine's compacted-window budget
   * and both appear in the same `createSessionEventBus` construction.
   */
  replayBudgetBytes?: number;
  /**
   * Invoked once, on the FIRST compaction failure (`ingest` /
   * `seedReplayEvents` throw). The bus itself doesn't know its session,
   * so the creator injects context-aware diagnostics here. Subsequent
   * failures only keep the degraded flag set, silently.
   */
  onCompactionError?: (err: unknown) => void;
}
export declare const DEFAULT_MAX_QUEUED_BYTES: number;
export declare const DEFAULT_REPLAY_BUDGET_BYTES: number;
/**
 * Default replay-ring depth per session. Sized for a 5-second
 * reconnect window over a chatty turn — a single long-running prompt
 * can emit hundreds of frames (test plan reports 13 for a short
 * turn, real workloads can be 10× that or more once tool-call /
 * thought streams pile up). 1000 was the original default and could
 * be exhausted by a moderate turn before the client reconnected;
 * 8000 matches the target set for chatty Stage 1
 * sessions, with ~30–60× headroom over a typical-but-busy turn at
 * the cost of a few hundred KB of RAM per session. Operators can
 * override per-daemon via `qwen serve --event-ring-size <n>`.
 */
export declare const DEFAULT_RING_SIZE = 8000;
export declare function serializedBridgeEventByteLength(
  event: BridgeEvent,
): number | undefined;
export declare function logEventSizingFailed(type: string): void;
export type QueueWarningThreshold = 'frames' | 'bytes' | 'frames_and_bytes';
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
  private readonly compactionEngine?;
  private nextId;
  /**
   * Identity token for this bus instance. Regenerated on every construction
   * (daemon restart / bus rebuild), never persisted — a cursor minted under
   * a different epoch is provably stale no matter its numeric value.
   */
  readonly epoch: string;
  private compactionDegraded;
  private readonly onCompactionError?;
  private readonly ring;
  private readonly subs;
  private readonly maxQueuedBytes;
  private readonly replayBudgetBytes;
  private closed;
  constructor(
    ringSize?: number,
    maxSubscribers?: number,
    compactionEngine?: CompactionEngine | undefined,
    opts?: EventBusOptions,
  );
  snapshotReplay(): SessionReplaySnapshot | undefined;
  private markCompactionDegraded;
  /** Most recent id ever assigned by `publish`. 0 if no events published. */
  get lastEventId(): number;
  /** Snapshot of the live subscriber count. */
  get subscriberCount(): number;
  seedReplayEvents(inputs: Array<Omit<BridgeEvent, 'id' | 'v'>>): BridgeEvent[];
  /**
   * Publish an event to the bus. Returns the constructed `BridgeEvent`
   * (with `id` + `v` assigned) on success, or `undefined` when the
   * bus is closed.
   *
   * **Never throws** (never-throws contract). Closing the bus mid-publish
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
