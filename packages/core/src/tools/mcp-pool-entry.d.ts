/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, MCPServerConfig } from '../config/config.js';
import {
  MCPServerStatus,
  type DiscoveredMCPPrompt,
  type DiscoveredMCPResource,
  type McpClient,
} from './mcp-client.js';
import type { DiscoveredMCPTool } from './mcp-tool.js';
import { type McpTransportKind } from './mcp-pool-key.js';
import {
  type ConnectionId,
  type PoolEntryState,
  type PoolEvent,
} from './mcp-pool-events.js';
import type { SessionMcpView } from './session-mcp-view.js';
/**
 * Per-pool-entry tuning. Operators override defaults via the wrapping
 * `McpTransportPool` constructor; daemon CLI flags map there.
 */
export interface PoolEntryOptions {
  /** Grace period after last subscriber detach before close. Default 30s. */
  drainDelayMs: number;
  /**
   * Hard cap on idle time, started at first idle and NEVER reset by
   * acquire/release flap. Defense against thrashing clients. Default 5min.
   */
  maxIdleMs: number;
  /** Reconnect attempt cap before transitioning to `failed`. Default 3 for stdio/ws, 5 for http/sse. */
  maxReconnectAttempts: number;
  /** Reconnect delay strategy. */
  reconnectStrategy:
    | {
        kind: 'fixed';
        delayMs: number;
      }
    | {
        kind: 'exponential';
        baseMs: number;
        capMs: number;
      };
}
/**
 * Pool entry defaults by transport family. See reconnect backoff
 * in the design doc.
 */
export declare function defaultPoolEntryOptions(
  transport: McpTransportKind,
): PoolEntryOptions;
/**
 * Handle returned to acquirers. Holds a session reference and the
 * subscription seat; callers `release()` to detach. Emits the same
 * `PoolEvent` discriminated union as the parent entry, but scoped
 * to the acquiring session (subscribers only see events from this
 * entry, not other pool entries).
 */
export interface PooledConnection {
  readonly id: ConnectionId;
  /** Stable transport identity; unlike `id`, this is stable for unpooled handles. */
  readonly transportId: ConnectionId;
  readonly serverName: string;
  readonly entryIndex: number;
  readonly client: McpClient;
  /** Current canonical tool snapshot. Re-issued on `toolsChanged`. */
  readonly toolsSnapshot: readonly DiscoveredMCPTool[];
  /** Current canonical prompt snapshot. Re-issued on `promptsChanged`. */
  readonly promptsSnapshot: readonly DiscoveredMCPPrompt[];
  /** Current canonical resource snapshot. Re-issued on `resourcesChanged`. */
  readonly resourcesSnapshot: readonly DiscoveredMCPResource[];
  /** Re-project per-session metadata against the current snapshots. */
  updateConfig(cfg: MCPServerConfig): void;
  on(event: 'event', listener: (e: PoolEvent) => void): this;
  off(event: 'event', listener: (e: PoolEvent) => void): this;
  /** Release this session's reference; pool starts drain when refs=0. */
  release(): void;
}
/**
 * Internal pool-entry record. Created once per `ConnectionId`,
 * holds the shared `McpClient` + its tool/prompt snapshots + ref
 * accounting + reconnect state.
 *
 * Lifecycle: `spawning` → `active` ⇄ (`active` ↔ reconnect via
 * disconnect/connect) → (`active` → `draining` on last detach,
 * `draining` → `active` on attach OR `draining` → `closed` on timer).
 *
 * Restart: external `restart()` triggers a manual disconnect+connect
 * cycle, bumping `generation` and re-emitting snapshots.
 */
export declare class PoolEntry {
  readonly id: ConnectionId;
  readonly serverName: string;
  readonly entryIndex: number;
  private readonly cfg;
  readonly client: McpClient;
  private readonly cliConfig;
  private readonly opts;
  private readonly onClosed;
  private readonly aggregateStatusByName;
  private localStatus;
  private state;
  private _generation;
  readonly refs: Set<string>;
  private subscribers;
  private subscriberHandles;
  toolsSnapshot: DiscoveredMCPTool[];
  promptsSnapshot: DiscoveredMCPPrompt[];
  resourcesSnapshot: DiscoveredMCPResource[];
  private drainTimer?;
  private maxIdleTimer?;
  private firstIdleAt?;
  private restartInFlight?;
  /**
   * set
   * SYNCHRONOUSLY at the top of `doRestart` (before any side effects).
   * Distinct from `restartInFlight` which only becomes truthy AFTER
   * `doRestart()` returns its Promise — the status listener
   * fires synchronously inside `client.disconnect()`'s
   * `updateMCPServerStatus` call (via `sweepAndDisconnect`), which
   * happens BEFORE `restart()`'s `this.restartInFlight = ...` assignment.
   * Without this flag the listener would trip the 'failed'
   * transition mid-restart, aborting the restart at the state guard.
   */
  private restartInProgress;
  /**
   * Pool-wide event emitter for entry-scoped events. Each
   * `PooledConnection` registers a single listener that forwards
   * to the subscriber's callback list.
   */
  private readonly emitter;
  /**
   * status change
   * listener registered against the module-level `serverStatuses`
   * registry. McpClient.onerror flips the GLOBAL map to DISCONNECTED
   * on transport drop, but pool's `aggregateStatusByName` reads each
   * entry's `localStatus` and "any-CONNECTED-wins" overwrites
   * back. Without this listener, a transport drop would leave
   * `localStatus = CONNECTED` permanently while the actual transport
   * is dead, and snapshot consumers see lying status.
   *
   * Stored so `forceShutdown` can detach to avoid leaking listeners
   * on the module-level array across entry recreate.
   */
  private statusChangeListener?;
  /**
   * Re-entry guard: when our own `updateGlobalStatus` writes to the
   * module-level map, the status-change listener will fire back at
   * us. Skip those echoes (we already know our localStatus).
   */
  private suppressNextStatusEcho;
  /** Transport identity captured at spawn, separate from unpooled lifecycle id. */
  readonly transportId: ConnectionId;
  /**
   * @param id Lifecycle identity. Pooled entries use `name::fingerprint`;
   *   unpooled entries use a unique `name::unpooled-N` value.
   * @param serverName Server name as advertised in `MCPServerConfig`.
   * @param entryIndex Opaque, monotonic-within-name-group index for
   *   status-route exposure. Stable across reconnect / drain
   *   grace; only changes when an entry is fully closed and a new
   *   one created for the same name.
   * @param cfg Original config used to create the entry (read-only
   *   from `PoolEntry`'s perspective; pool may create a new entry
   *   with a different cfg → different fingerprint → different id).
   * @param client Connected `McpClient` (caller has already called
   *   `client.connect()`).
   * @param cliConfig For `client.discoverAndReturn(cliConfig)` calls;
   *   pool injects the bootstrap-session config (which provides the
   *   workspace / trust context; per-session filtering happens later
   *   in `SessionMcpView`).
   * @param opts Entry-scoped tuning (drain, max idle, reconnect).
   * @param onClosed Pool-level callback fired when this entry
   *   transitions to `closed` so the pool can drop it from its map.
   */
  constructor(
    id: ConnectionId,
    serverName: string,
    entryIndex: number,
    cfg: MCPServerConfig,
    client: McpClient,
    cliConfig: Config,
    opts: PoolEntryOptions,
    onClosed: (id: ConnectionId) => void,
    aggregateStatusByName: (name: string) => MCPServerStatus,
  );
  get generation(): number;
  get currentState(): PoolEntryState;
  /**
   * Transport family classification for snapshot consumers (e.g.
   * `subprocessCount` in `pool.getSnapshot()`). Exposed as a getter
   * instead of letting callers read `entry.cfg` so secrets in `cfg`
   * (env API keys, header auth tokens, OAuth fields) stay
   * encapsulated.
   */
  get transportKind(): McpTransportKind;
  /**
   * public terminal-
   * state probe. Lets callers short-circuit before invoking
   * `markActive` / `attach` when a concurrent `forceShutdown` has
   * already torn the entry down (e.g. an unpooled connect/discover
   * window racing `releaseSession`).
   */
  isTerminated(): boolean;
  /**
   * Mark the initial spawn complete. Caller (pool) must call this
   * after constructing the entry, performing the initial discovery,
   * and seeding `toolsSnapshot` / `promptsSnapshot`.
   */
  markActive(
    initialTools: DiscoveredMCPTool[],
    initialPrompts: DiscoveredMCPPrompt[],
    initialResources: DiscoveredMCPResource[],
  ): void;
  /**
   * Attach a session subscriber. Returns the `PooledConnection`
   * handle for the caller to interact with (events, release).
   *
   * Snapshot replay : immediately invokes
   * `view.applyTools` / `view.applyPrompts` with the current
   * snapshots so the new subscriber doesn't miss state captured
   * between in-flight discover completion and this attach.
   *
   * Cancels drain timer (entry is no longer idle).
   */
  attach(
    sessionId: string,
    view: SessionMcpView,
    opts?: {
      skipReplay?: boolean;
      release?: () => void;
    },
  ): PooledConnection;
  /**
   * Refresh one attached session's metadata without reconnecting the shared
   * transport. The view owns filtering and per-session tool decoration; the
   * entry remains the single source of truth for discovery snapshots.
   */
  updateSessionConfig(sessionId: string, cfg: MCPServerConfig): void;
  /**
   * Detach a session subscriber. Tears down the subscriber's
   * registrations via `view.teardown()` and removes the ref.
   * Caller (pool) starts the drain timer when `refs.size === 0`.
   */
  detach(sessionId: string): void;
  /**
   * Start the grace-period drain timer. Cancelled by subsequent
   * `attach()`. Fires `forceShutdown()` on expiry.
   */
  startDrainTimer(delayMs: number): void;
  cancelDrainTimer(): void;
  /**
   * Force shutdown of this entry. Disconnects the client (caller is
   * responsible for descendant pid sweep BEFORE calling this — see
   * commit 3's `pid-descendants` integration in
   * `McpTransportPool.shutdownEntry`).
   *
   * Idempotent: repeated calls no-op once state === `closed` or
   * `failed`.
   */
  forceShutdown(reason: 'drain_timer' | 'max_idle' | 'manual'): Promise<void>;
  /**
   * shared sweep +
   * disconnect helper used by `forceShutdown` AND `doRestart` (both
   * pre-call and failure path). Pre-fix the same try/catch pair was
   * duplicated 3 ways with different log levels — drift target.
   *
   * Order matters: descendant pids SIGTERMed BEFORE
   * `client.disconnect()` so wrapper grandchildren (`npx`, `uvx`,
   * `pnpm dlx`) get killed before their parent's transport closes.
   * Best-effort throughout: per-pid failures tolerated by
   * `sigtermPids`'s ESRCH-tolerant loop; pid lookup returns
   * undefined for remote transports / already-exited stdio children.
   *
   * Log levels: pid-sweep failure at `warn`
   * (operator should investigate orphan-process pressure);
   * disconnect failure at `error` (a stuck disconnect is rarer and
   * usually indicates a transport bug worth surfacing). Pre-
   * `doRestart` had logged both at `debug` — production
   * observability gap that masked PID exhaustion.
   *
   * now returns a `SweepResult` so the
   * silent-drop fire-and-forget caller (which `void`-discards the
   * promise and would otherwise lose the orphan-process-pressure
   * signal entirely) can chain a structured warn log when either pid
   * sweep threw or `sigtermPids` partially signaled. The `forceShutdown`
   * and `doRestart` callers continue to ignore the return value (their
   * caller-side `await` discards it) — those paths already carry rich
   * error signals via their own catches and don't need the extra
   * surface. The internal log lines stay unchanged for backward
   * compat with existing log-tail tooling.
   */
  private sweepAndDisconnect;
  /**
   * Manual restart: disconnect + reconnect + re-discover. Coalesces
   * concurrent calls into a single in-flight promise so the restart
   * route and a parallel health-monitor reconnect can't race.
   */
  restart(): Promise<void>;
  private doRestart;
  private doRestartInner;
  /**
   * Fire an event to all subscribers. Stays inside the entry's
   * EventEmitter so `PooledConnection.on('event', cb)` and
   * `removeListener` work correctly.
   *
   * iterate listeners
   * with per-listener try/catch instead of delegating to
   * `EventEmitter.emit` directly. Pre-fix a synchronous throw from
   * one session's listener (e.g. session A's view triggered an
   * exception) crashed the emit call — siblings B, C never received
   * the event. In `forceShutdown`'s emit-then-disconnect sequence
   * (line 449), one buggy listener could prevent subprocess
   * cleanup, budget slot release, and entry eviction for ALL
   * sessions sharing the entry. Now per-listener errors log to
   * debug and the iteration continues to the next listener.
   */
  emit(event: PoolEvent): void;
  internalOn(listener: (e: PoolEvent) => void): void;
  internalOff(listener: (e: PoolEvent) => void): void;
  /**
   * Write the aggregated status (`any-CONNECTED-wins` across entries
   * with same `serverName`) into the process-global
   * `serverStatuses` Map. Pool delegates the aggregation function
   * because only the pool can see sibling entries.
   */
  private updateGlobalStatus;
  /** Local status for the pool's aggregator. Not part of public API. */
  getLocalStatus(): MCPServerStatus;
}
