/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, MCPServerConfig } from '../config/config.js';
import type { ToolRegistry } from './tool-registry.js';
import { MCPDiscoveryState, MCPServerStatus } from './mcp-client.js';
import type { SendSdkMcpMessage } from './mcp-client.js';
import type { EventEmitter } from 'node:events';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
export declare const RUNTIME_MCP_IF_ABSENT_CONFIG_FLAG = "__qwenRuntimeMcpIfAbsent";
/**
 * Configuration for MCP health monitoring
 */
export interface MCPHealthMonitorConfig {
    /** Health check interval in milliseconds (default: 30000ms) */
    checkIntervalMs: number;
    /** Number of consecutive failures before marking as disconnected (default: 3) */
    maxConsecutiveFailures: number;
    /** Enable automatic reconnection (default: true) */
    autoReconnect: boolean;
    /** Delay before reconnection attempt in milliseconds (default: 5000ms) */
    reconnectDelayMs: number;
}
/**
 * Upper threshold of the dual-threshold hysteresis used by both the
 * snapshot-based budget cell (v1) and the push-event state
 * machine. When `reservedSlots.size / clientBudget` crosses
 * this fraction upward, a `budget_warning` event fires and the
 * armed-state flips to "fired"; the next fire requires the ratio to
 * drop below `MCP_BUDGET_REARM_FRACTION` first.
 *
 * Picked 0.75 to mirror `slow_client_warning`
 * (`eventBus.ts:WARN_THRESHOLD_RATIO`) — same rationale: "warning"
 * fires before "error" with enough headroom for the operator to act.
 */
export declare const MCP_BUDGET_WARN_FRACTION: 0.75;
/**
 * Lower threshold for the hysteresis state machine. After a
 * warning fires, the ratio must drop below this fraction before the
 * state machine re-arms — so a server that flaps just above 0.75
 * doesn't produce a flood of identical warnings. Mirrors
 * `eventBus.ts:WARN_RESET_RATIO` (0.375 = half of the warn fraction).
 */
export declare const MCP_BUDGET_REARM_FRACTION: 0.375;
/**
 * Budget enforcement mode for MCP client guardrails.
 *
 * `off` — no accounting-driven enforcement (default when no budget is
 *   configured). `getMcpClientAccounting()` still works as pure
 *   observability; slot reservation is a no-op.
 * `warn` — measure-only. Reserved slots track the configured set even
 *   beyond the budget so operators see `liveCount > budget` in the
 *   snapshot. No connect is refused. Snapshot consumers render a
 *   warning cell when `liveCount >= 0.75 * budget`.
 * `enforce` — hard cap. Connects beyond the budget are refused, the
 *   per-server cell shows `errorKind: 'budget_exhausted'`, and the
 *   server name lands in `refusedServerNames`. Refusal is deterministic
 *   by `Object.entries(servers)` declaration order.
 */
export type McpBudgetMode = 'enforce' | 'warn' | 'off';
export interface McpBudgetConfig {
    /**
     * Cap on live MCP clients **per ACP session** (v1; R4 review
     * scope correction — see `acpAgent.newSessionConfig` constructs a
     * fresh `Config`/`McpClientManager` per session, so each session
     * enforces its own copy of the cap independently).
     * shared MCP pool will graduate this to per-workspace.
     * `undefined` = unlimited.
     */
    clientBudget?: number;
    /** Behavior at and above the cap. `off` when `clientBudget` is undefined. */
    budgetMode: McpBudgetMode;
    /**
     * optional callback invoked by the manager when a budget
     * threshold is crossed (`'budget_warning'`) or one or more servers
     * are refused during a discovery pass (`'refused_batch'`). The
     * manager stays decoupled from ACP wire types — the callback is
     * provided by `acpAgent.newSessionConfig` and translates each event
     * into a `connection.extNotification(...)` call carrying the
     * sessionId. Absent in `off` mode (state machine is dormant).
     */
    onBudgetEvent?: (event: McpBudgetEvent) => void;
}
/**
 * One refused-server entry in a `'refused_batch'` event payload.
 * `transport` is the family resolved at refusal time via `mcpTransportOf`;
 * `reason` is `'budget_exhausted'` until additional refusal causes are
 * defined.
 */
export interface McpRefusedServer {
    name: string;
    transport: McpTransportKind;
    reason: 'budget_exhausted';
}
/**
 * Discriminated union of guardrail events emitted to `onBudgetEvent`.
 *
 * - `budget_warning` fires on the upward crossing of
 *   `reservedSlots.size / clientBudget >= MCP_BUDGET_WARN_FRACTION`,
 *   then re-arms only after the ratio drops below
 *   `MCP_BUDGET_REARM_FRACTION`. Carries both `liveCount` (CONNECTED
 *   clients) and `reservedCount` (configured-set, including in-flight
 *   reservations) so SDK consumers can render either lens.
 * - `refused_batch` fires once per `discoverAllMcpTools*` pass when
 *   `lastRefusedServerNames.length > 0`, OR as a length-1 batch on the
 *   `readResource` lazy-spawn refusal path. `mode` is the literal
 *   `'enforce'` because `warn` mode never refuses.
 */
export type McpBudgetEvent = {
    kind: 'budget_warning';
    liveCount: number;
    reservedCount: number;
    budget: number;
    thresholdRatio: typeof MCP_BUDGET_WARN_FRACTION;
    mode: 'warn' | 'enforce';
} | {
    kind: 'refused_batch';
    refusedServers: McpRefusedServer[];
    budget: number;
    liveCount: number;
    reservedCount: number;
    mode: 'enforce';
};
/** Transport family per `MCPServerConfig`. `unknown` covers misconfigured entries. */
export type McpTransportKind = 'stdio' | 'sse' | 'http' | 'websocket' | 'sdk' | 'unknown';
/**
 * Snapshot of the manager's live + reserved MCP state. The daemon's
 * read-only `GET /workspace/mcp` route fans this out via the ACP
 * `qwen/status/workspace/mcp` ext-method. `subprocessCount` is the
 * value `pgrep -P` baseline harness can validate against.
 */
export interface McpClientAccounting {
    /** Live (`MCPServerStatus.CONNECTED`) client count, all transports. */
    total: number;
    /** Live client count split by transport family. */
    byTransport: Record<McpTransportKind, number>;
    /** stdio + websocket — the only transports that spawn an OS process. */
    subprocessCount: number;
    /** Server names currently holding a budget slot (in or over the cap). */
    reservedSlots: string[];
    /** Server names refused during the most recent `discoverAllMcpTools*` pass. */
    refusedServerNames: string[];
}
/**
 * Thrown by `readResource` lazy-spawn path when the live count is
 * already at `clientBudget` and `budgetMode === 'enforce'`. Discovery-
 * time refusals don't throw (they're recorded in `refusedServerNames`
 * and reported via the snapshot), because the discovery loop is
 * best-effort and a thrown error would cancel sibling connects.
 */
export declare class BudgetExhaustedError extends Error {
    readonly serverName: string;
    readonly budget: number;
    /**
     * Number of slots currently reserved (== `reservedSlots.size` at the
     * time of the refusal). renamed
     * from `liveCount` because `reservedSlots` tracks reserved server
     * NAMES, not `MCPServerStatus.CONNECTED` clients — a reserved-but-
     * disconnected server still consumes a slot, and that's the
     * accurate quantity blocking this new server from getting in.
     * `getMcpClientAccounting().total` would have been the genuine
     * "live" count and is a different number.
     */
    readonly reservedCount: number;
    constructor(serverName: string, budget: number, reservedCount: number);
}
/**
 * Map an `MCPServerConfig` to its transport family. Aligned with the
 * detection order in `mcp-client.ts:createTransport` (sdk → httpUrl
 * → url → command) with ONE forward-looking exception: `tcp` is
 * mapped here to `websocket` matching the field's declared intent on
 * `MCPServerConfig`, but `createTransport` does NOT yet construct a
 * websocket transport. A config carrying both `tcp` and `command`
 * is labeled `websocket` in the accounting snapshot while the real
 * connection fires through the `command` path as `stdio`. The
 * `subprocessCount = stdio + websocket` arithmetic is therefore
 * accurate-by-vacancy today (no real websocket subprocesses exist
 * yet) and will need revisiting if a websocket transport ships.
 * This is a future core decision: (a) implement WS in
 * createTransport vs (b) drop `tcp` from `MCPServerConfig` + both
 * mappers.
 *
 * `sdk` is checked first because `SDK_MCP_SERVER_FIELDS` may coexist
 * with a placeholder `command` — without the sdk-first order, an
 * in-process SDK server would mis-report as `stdio`.
 */
export declare function mcpTransportOf(config: MCPServerConfig): McpTransportKind;
/**
 * options bag for
 * `McpClientManager` construction, replacing the prior 5 trailing
 * positional parameters (`eventEmitter`, `sendSdkMcpMessage`,
 * `healthConfig`, `budgetConfig`, `pool`). Pre-fix every test site
 * threaded 4 explicit `undefined`s to reach the trailing `pool` arg
 * the fixed positions also blocked future option additions without
 * re-ordering. The options-object form lets each caller name only the
 * fields it cares about and keeps the constructor signature stable
 * across future additions (e.g. when the health-monitor wire-up
 * lands a new `reconnectStrategy` knob).
 */
export interface McpClientManagerOptions {
    eventEmitter?: EventEmitter;
    sendSdkMcpMessage?: SendSdkMcpMessage;
    healthConfig?: Partial<MCPHealthMonitorConfig>;
    budgetConfig?: McpBudgetConfig;
    pool?: import('./mcp-transport-pool.js').McpTransportPool;
}
/**
 * Manages the lifecycle of multiple MCP clients, including local child processes.
 * This class is responsible for starting, stopping, and discovering tools from
 * a collection of MCP servers defined in the configuration.
 */
export declare class McpClientManager {
    private clients;
    private readonly toolRegistry;
    private readonly cliConfig;
    private discoveryState;
    private readonly eventEmitter?;
    private readonly sendSdkMcpMessage?;
    private healthConfig;
    private healthCheckTimers;
    private consecutiveFailures;
    private isReconnecting;
    private serverDiscoveryPromises;
    /**
     * Per connected server, the single-session "connected config key" of the
     * config it was last connected with — see {@link singleSessionConnectedKeyOf}.
     * Single-session path only; pool mode tracks transport identity via
     * `pooledConnections[].transportId` and its own `desiredIds` diff.
     * Lets `discoverAllMcpToolsIncremental` detect an in-place config change to an
     * already-connected server and reconnect it, instead of leaving it on the
     * stale config. Unlike the transport-only `connectionIdOf`, this key also
     * covers the discovery-time metadata (trust / alwaysLoadTools / includeTools /
     * excludeTools) so editing those re-applies it. Set on successful connect;
     * cleared on every teardown path so a stale key can't mask a later change.
     */
    private readonly connectedConfigKeys;
    /**
     * Budget bookkeeping. Slots are reserved synchronously by server name
     * inside the discovery loop BEFORE any `await client.connect()`, so
     * `Promise.all(discoveryPromises)` cannot interleave a second connect
     * past the cap. `enforce` mode refuses past the cap; `warn` mode
     * over-reserves so accounting reflects the configured set; `off`
     * doesn't reserve at all.
     */
    private readonly reservedSlots;
    private readonly clientBudget?;
    private readonly budgetMode;
    /**
     * names whose
     * slot was freshly reserved (not `'already_held'`) by an
     * in-flight `discoverMcpToolsForServerInternal` call. Read by
     * `runWithDiscoveryTimeout`'s timeout handler to decide whether
     * to release the slot on hard timeout — fresh reservations
     * release (server never connected, slot shouldn't permanently
     * block other servers); `'already_held'` reconnects keep their
     * slot (operator's previously-healthy server shouldn't be
     * permanently demoted by a transient timeout).
     *
     * Lifetime: `add` after `tryReserveSlot` returns `'reserved'`
     * with the `.has` guard, `delete` in success / catch / finally
     * cleanup. Idempotent — multiple deletes are no-ops.
     */
    private readonly freshReservations;
    /**
     * Servers refused during the most recent `discoverAllMcpTools*` pass.
     * Reset at the start of each pass; survives between passes so a
     * snapshot taken between discoveries still shows the last set of
     * refusals to operators.
     */
    private lastRefusedServerNames;
    /**
     * transport family (`stdio`/`http`/...) resolved for each
     * entry in `lastRefusedServerNames`, captured at refusal time. The
     * `'refused_batch'` event payload includes the per-server transport
     * so dashboards can break down "which kind of servers got refused"
     * without re-walking config.
     *
     * Lifetime mirrors `lastRefusedServerNames`: reset at the start of
     * each `discoverAllMcpTools*` pass + on `stop()` + on
     * `dropRefusalEntry` (operator removed/disconnected the server).
     * NOT cleared on `emitRefusedBatchIfAny` — the snapshot-visible
     * refusal state survives between passes per the contract,
     * so a snapshot taken between passes still reports the last
     * refusal set with correct transport metadata. The push-event
     * idempotency invariant is held by the separate
     * `pendingRefusalNames` queue, not by clearing this map.
     */
    private lastRefusedTransports;
    /**
     * queue of refusal names NOT YET emitted as a push event.
     * `lastRefusedServerNames` is the snapshot-visible state and MUST
     * survive between passes (contract). The push-event path
     * needs separate accounting so a length-1 batch fired by a single-
     * server / readResource refusal doesn't get re-emitted by the
     * bulk-pass end-of-pass call. `refuseAndLog` adds to both;
     * `emitRefusedBatchIfAny` drains and clears this set without
     * touching `lastRefusedServerNames`. Empty whenever there are no
     * unsent refusals, regardless of pass.
     */
    private pendingRefusalNames;
    /**
     * hysteresis state for `'budget_warning'` events. `true`
     * means "next 75% upward crossing fires"; `false` means "warning
     * already fired, waiting for ratio to drop below 37.5% to re-arm".
     * Stays `true` permanently in `off` mode (the state machine
     * short-circuits before touching it). Initial value `true` so the
     * first crossing during a session always fires.
     */
    private warnArmed;
    /**
     * re-entrant counter that
     * tracks whether a bulk discovery pass is currently in flight.
     * Incremented on entry to `discoverAllMcpTools` /
     * `discoverAllMcpToolsIncremental`; decremented in the matching
     * `finally`. While > 0, `emitRefusedBatchIfAny` short-circuits so
     * per-server refusals queue up; the bulk pass's own end-of-pass
     * call (which runs AFTER `bulkPassDepth--`) drains the queue once
     * as a coalesced batch — preserving the documented "one batch per
     * pass" contract regardless of which inner code path enqueued the
     * refusals (`discoverMcpToolsForServerInternal` from incremental,
     * inline `refuseAndLog` from legacy bulk).
     *
     * Counter rather than boolean to defend against re-entry (a future
     * code path that nests bulk passes — e.g. a discovery hook that
     * itself triggers reload — wouldn't accidentally clear the flag
     * mid-outer-pass).
     */
    private bulkPassDepth;
    /**
     * optional callback set at construction time OR via
     * `setOnBudgetEvent` after construction. When non-`null` and
     * `budgetMode !== 'off'`, the manager fires it on every threshold
     * crossing or non-empty refusal batch. Decouples core from ACP
     * wire types; `acpAgent.newSessionConfig` provides the adapter
     * that translates events into `connection.extNotification`.
     *
     * The setter exists because the production construction path
     * (`ToolRegistry` constructor → `loadCliConfig`) doesn't expose a
     * hook to thread the callback through. acpAgent registers the
     * callback after `loadCliConfig` returns but BEFORE
     * `config.initialize()` fires the first discovery — so no events
     * are missed.
     */
    private onBudgetEvent?;
    /**
     * when present, non-SDK MCP server discovery
     * delegates to the workspace-shared pool instead of spawning a
     * per-session `McpClient`. Tracked here so `disconnectServer` /
     * `stop` can `release` the pool reference cleanly without leaking
     * refs (the pool's drain timer kicks in when refs hit zero).
     *
     * SDK MCP servers (`isSdkMcpServerConfig`) always bypass the pool
     * — the `sendSdkMcpMessage` callback is per-session by design and
     * the pool's transport is workspace-level. Per-server gating in
     * `discoverMcpToolsForServer` keeps the legacy path for SDK MCP.
     */
    private readonly pool?;
    private readonly pooledConnections;
    /**
     * re-entrancy guard
     * for `discoverAllMcpToolsViaPool`. Two passes interleaving (full
     * + incremental, or two incrementals) could see
     * `pooledConnections.has(name) === false` simultaneously and both
     * call `pool.acquire`, with the second `set(name, conn2)` silently
     * overwriting the first → conn1 leaks (refcount never reaches 0,
     * drain timer never fires). The mutex serializes passes; a second
     * caller awaits the same promise and sees the resolved state.
     */
    private discoveryInFlight?;
    /**
     * set true by
     * `stop()` when its 5s shutdown-grace timer wins the race against
     * `discoveryInFlight`. The in-flight discovery pass checks this
     * flag before calling `pooledConnections.set(...)` so a late-
     * resolving `pool.acquire` (whose 30s default timeout exceeds the
     * shutdown cap) doesn't orphan an entry by re-populating the Map
     * after `releaseAllPooledConnections` cleared it.
     */
    private stopTimedOut;
    constructor(config: Config, toolRegistry: ToolRegistry, options?: McpClientManagerOptions);
    /**
     * Atomic budget check + slot reservation. Synchronous so the
     * concurrent discovery loop (`Promise.all` over server entries) can't
     * interleave a second connect past the cap at any `await` boundary.
     *
     * Returns:
     *   `reserved` — slot newly held (or `off`-mode no-op)
     *   `already_held` — slot was already reserved (reconnect / dup)
     *   `refused` — `enforce` mode and the cap is full
     */
    private tryReserveSlot;
    /**
     * single release path for
     * `reservedSlots`. Delete + re-evaluate hysteresis on every
     * downward mutation so re-arming through the 37.5% boundary
     * happens whether the release came from operator
     * `disconnectServer`, config-driven `removeServer`, discovery
     * timeout cleanup, or a connect-failure catch block.
     *
     * Returns `true` when the name was actually held (parity with
     * `Set.delete`'s return); idempotent on already-released names.
     */
    private releaseSlotName;
    /**
     * Snapshot the manager's MCP accounting for the daemon's read-only
     * `GET /workspace/mcp` route. Cheap to call — iterates `this.clients`
     * once and constructs a fresh struct each time so callers can mutate
     * the returned arrays without affecting internal state.
     *
     * `total` counts only `CONNECTED` clients; `reservedSlots` includes
     * the configured set (which under `enforce` mode is bounded by
     * `clientBudget`, but under `warn` mode can exceed it).
     */
    getMcpClientAccounting(): McpClientAccounting;
    /** Returns this manager's status for a server without consulting the
     * process-wide compatibility status registry. */
    getServerStatus(serverName: string): MCPServerStatus;
    /** Resolved budget mode (env-var or constructor-supplied). */
    getMcpBudgetMode(): McpBudgetMode;
    /** Resolved client budget, or `undefined` when unlimited. */
    getMcpClientBudget(): number | undefined;
    /**
     * register (or replace) the budget-event callback. Production
     * code path: acpAgent constructs Config (which constructs the
     * manager via env-var defaults) then calls this BEFORE
     * `config.initialize()` so the callback is wired before the first
     * discovery pass fires.
     *
     * No-op in `off` mode — the state machine never runs, so a callback
     * here would never fire. Tests can pass a callback at construction
     * via `budgetConfig.onBudgetEvent` instead, which avoids this
     * setter path.
     */
    setOnBudgetEvent(callback: ((event: McpBudgetEvent) => void) | undefined): void;
    /**
     * Whether a discovery / reconnect for `serverName` is currently in
     * flight (started but not yet resolved). Used by the daemon's
     * `POST /workspace/mcp/:server/restart` route
     * to short-circuit a redundant restart with `skipped:in_flight`
     * rather than awaiting the original discovery promise. Calling
     * `discoverMcpToolsForServer` during an in-flight pass is safe
     * (it joins the existing promise), but the route prefers the
     * fast-path skip so the HTTP latency stays bounded.
     */
    isServerDiscovering(serverName: string): boolean;
    /**
     * drop a server's
     * entry from the per-pass refusal log, if present. The
     * `indexOf` + `splice` pattern was repeated at 4 sites
     * (`removeServer`, `disconnectServer`, `runWithDiscoveryTimeout`
     * timeout handler, `readResource` late-reserve clear). Centralizing
     * here makes future fixes (e.g. emitting an `mcp_budget_cleared`
     * event when the entry is dropped) a one-place change.
     */
    private dropRefusalEntry;
    /**
     * record a refusal +
     * emit the operator-visible stderr breadcrumb. The push +
     * stderr.write block was repeated at 3 sites (`discoverAllMcpTools`
     * + `discoverAllMcpToolsIncremental` + `discoverMcpToolsForServerInternal`).
     * Centralizing here keeps the message format consistent and makes
     * future telemetry additions (e.g. `recordStartupEvent` per
     * refusal) a one-place change.
     *
     * Idempotent on the push: if `serverName` is already in the list
     * (rare but possible for the lazy-spawn refusal path which can be
     * reached more than once for the same server), the array isn't
     * grown. The stderr line still fires so the operator sees the
     * refusal at every reproduction.
     */
    private refuseAndLog;
    /**
     * post-discovery budget
     * telemetry was duplicated verbatim in `discoverAllMcpTools` and
     * `discoverAllMcpToolsIncremental`. Centralized here so future
     * field additions to `mcp_budget_decision` happen in one place.
     * `off` mode is a no-op — operators who never set a budget don't
     * pollute the startup-event sink.
     *
     * Invariant (post R8 #2): `mode !== 'off'` ⇒ `clientBudget` was
     * resolved. Both `readBudgetFromEnv` AND the constructor downgrade
     * `enforce`/`warn`-without-budget to `off` so neither call site can
     * leave a budgetless mode reaching this telemetry path.
     * `clientBudget ?? 0` is kept as belt-and-suspenders against future
     * call sites that might bypass both validations.
     */
    private emitBudgetTelemetry;
    /**
     * hysteresis state machine for `'budget_warning'` events.
     * Called at end of each discovery pass and in the `readResource`
     * lazy-spawn path after a successful slot reservation.
     *
     * Invariants:
     *   - In `off` mode or with no budget configured: hard no-op.
     *     `warnArmed` stays at its initial `true`, never read or
     *     mutated. The constructor's `onBudgetEvent` capture is
     *     `undefined` in `off` mode, so an accidental call wouldn't
     *     fire anyway — defense in depth.
     *   - Trigger is `reservedSlots.size / clientBudget`, NOT
     *     `liveCount / clientBudget`. Reservations include in-flight
     *     connects and survive transient `disconnectServer` calls,
     *     making the trigger stable against connect/disconnect
     *     chatter. Payload exposes BOTH so SDK consumers can pick.
     *   - One fire per upward 75% crossing; no fire while the ratio
     *     stays at or above 0.75; re-arms only on dropping below
     *     0.375. Mirrors `slow_client_warning`'s hysteresis exactly.
     */
    private evaluateBudgetState;
    /**
     * coalesce per-pass refusals into a single `'refused_batch'`
     * event. Called at end of `discoverAllMcpTools` and
     * `discoverAllMcpToolsIncremental`, plus the `readResource` lazy-
     * spawn refusal path (where it emits a length-1 batch for shape
     * consistency).
     *
     * Idempotent on empty queue: when `pendingRefusalNames.size === 0`
     * the call short-circuits without firing or clearing.
     *
     * What gets cleared on a successful emit:
     * - `pendingRefusalNames` — drained, so a follow-up
     *   `emitRefusedBatchIfAny` in the same pass is a no-op.
     *
     * What does NOT get cleared on emit (doc fix):
     * - `lastRefusedServerNames` — snapshot-visible, must survive
     *   between passes so `GET /workspace/mcp` reports the last
     *   refusal set even after the push event fired.
     * - `lastRefusedTransports` — sidecar of the names list, same
     *   lifetime: reset at start of each pass / `stop()` /
     *   `dropRefusalEntry`, NOT on emit.
     *
     * `mode: 'enforce'` is a literal: `warn` mode never refuses, so the
     * code path that calls `refuseAndLog` (the only writer of
     * `lastRefusedServerNames`) is reachable only under `enforce`.
     */
    private emitRefusedBatchIfAny;
    /**
     * single boundary for `onBudgetEvent`
     * invocation. The manager's state machine and refused-batch
     * coalescer both call this — the production ACP adapter wraps its
     * extNotification in `void ... .catch()` so async failures don't
     * leak, but the callback ITSELF could throw synchronously (a future
     * test fixture, a buggy adapter, an unexpected serialization
     * crash). Without this guard, the throw would propagate into MCP
     * discovery / `readResource` / `disconnectServer` paths and abort
     * unrelated work — budget push events are best-effort telemetry,
     * NEVER critical-path.
     *
     * Logs at `debug` level so production daemons stay quiet on the
     * happy path; oncall flips debug on when investigating an MCP
     * guardrail incident and sees both delivery successes (via
     * `evaluateBudgetState`'s info logs) and failures.
     */
    private emitBudgetEvent;
    /**
     * Single source of truth for the effective server map: the configured
     * servers plus the `mcpServerCommand`-derived `mcp` server, each stamped
     * with the session target dir as its cwd. Every discovery entry point
     * resolves servers through here so the recipe cannot diverge.
     */
    private getEffectiveMcpServers;
    /**
     * Initiates the tool discovery process for all configured MCP servers.
     * It connects to each server, discovers its available tools, and registers
     * them with the `ToolRegistry`.
     *
     * in pool mode (`this.pool !== undefined`),
     * non-SDK MCP servers go through the workspace-shared transport
     * pool. SDK MCP and HTTP/SSE (when not opt-in) fall back through
     * the pool's own `createUnpooledConnection` path so this manager
     * doesn't need to maintain a parallel SDK code path. Pool entries
     * are tracked in `this.pooledConnections` for `disconnectServer` /
     * `stop` to release cleanly.
     */
    discoverAllMcpTools(cliConfig: Config): Promise<void>;
    /**
     * Connects to a single MCP server and discovers its tools/prompts.
     * The connected client is tracked so it can be closed by {@link stop}.
     *
     * This is primarily used for on-demand re-discovery flows (e.g. after OAuth).
     */
    discoverMcpToolsForServer(serverName: string, cliConfig: Config): Promise<void>;
    private discoverMcpToolsForServerInternal;
    /**
     * pool-mode discovery. Iterates configured
     * servers and calls `pool.acquire(name, cfg, sessionId, toolReg,
     * promptReg)` for each non-disabled server. Pool internally:
     *   - Returns the existing PoolEntry if same fingerprint already
     *     spawned for this workspace (other sessions sharing it)
     *   - Spawns a new entry otherwise (deduped via spawnInFlight)
     *   - For SDK MCP / non-pooled HTTP: routes to
     *     `createUnpooledConnection` (per-session McpClient with the
     *     supplied session registries)
     *   - On attach: synchronously applies tool/prompt snapshots into
     *     the supplied session registries via `SessionMcpView`
     *
     * Per-session reconnect / health monitoring / budget enforcement
     * lives inside the pool, NOT in this manager — `this.reservedSlots`
     * / `this.healthCheckTimers` etc. stay empty in pool mode (they're
     * still allocated for legacy mode coexistence).
     *
     * Pre-pool path's `await this.stop()` releases EVERYTHING; here we
     * only need to drop the manager's own pool refs because cross-
     * session pool entries still belong to the pool.
     */
    private discoverAllMcpToolsViaPool;
    private runDiscoverAllMcpToolsViaPool;
    private releaseAllPooledConnections;
    /**
     * Stops all running local MCP servers and closes all client connections.
     * This is the cleanup method to be called on application exit.
     */
    stop(): Promise<void>;
    /**
     * Disconnects a specific MCP server.
     * @param serverName The name of the server to disconnect.
     */
    disconnectServer(serverName: string): Promise<void>;
    getDiscoveryState(): MCPDiscoveryState;
    getServerInstructions(): Map<string, string>;
    /**
     * Gets the health monitoring configuration
     */
    getHealthConfig(): MCPHealthMonitorConfig;
    /**
     * Updates the health monitoring configuration
     */
    updateHealthConfig(config: Partial<MCPHealthMonitorConfig>): void;
    /**
     * Starts health monitoring for a specific server
     */
    private startHealthCheck;
    /**
     * Stops health monitoring for a specific server
     */
    private stopHealthCheck;
    /**
     * Stops all health checks
     */
    private stopAllHealthChecks;
    /**
     * Starts health checks for all connected servers
     */
    private startAllHealthChecks;
    /**
     * Performs a health check on a specific server
     */
    private performHealthCheck;
    /**
     * Reconnects a specific server
     */
    private reconnectServer;
    /**
     * Discovers tools incrementally for all configured servers.
     * Only updates servers that have changed or are new.
     */
    discoverAllMcpToolsIncremental(cliConfig: Config): Promise<void>;
    /**
     * Caps how long a single MCP server's discover handshake is allowed to
     * take during startup. Local stdio servers default to 30s; remote
     * HTTP/SSE servers default to 5s (mirrors Claude Code's
     * `CLAUDE_AI_MCP_TIMEOUT_MS`). Per-server override via
     * `mcpServers.<name>.discoveryTimeoutMs` in settings.
     */
    private runWithDiscoveryTimeout;
    /**
     * Minimum / maximum discovery timeouts. `0` or a negative value as a
     * per-server override would cause every discover to fire its timeout on
     * the next tick — combined with the lack of disconnect on timeout this
     * was a remote-exploitable silent-tool-registration vector (a
     * MITM/attacker-controlled MCP server could land its tools after the
     * timeout fired). `Infinity` / very large values would hang
     * `waitForMcpReady()` forever for non-interactive paths. The 100ms
     * floor is generous (real handshakes start in single-digit ms locally,
     * tens of ms remote); the 5-minute ceiling matches the longest tool
     * call timeouts we've documented.
     */
    private static readonly MIN_DISCOVERY_TIMEOUT_MS;
    private static readonly MAX_DISCOVERY_TIMEOUT_MS;
    private discoveryTimeoutFor;
    /**
     * The single-session reconnect key for a server config. `connectionIdOf` is
     * intentionally transport-only (it excludes the per-session discovery filters
     * so the shared pool can reuse a transport across sessions with different
     * filters). But the single-session reconcile must ALSO reconnect when only a
     * discovery metadata changes. Append the same canonical metadata identity
     * used by pooled session views so equivalent filters do not reconnect.
     */
    private singleSessionConnectedKeyOf;
    /**
     * Purge a server's entries from all three registries (tools + prompts +
     * resources). Every teardown path must clean all three atomically — a missed
     * registry leaves stale entries bound to a closed client (selectable by the
     * model, or surfaced by `listMcpResources`). Centralized here so adding a
     * future registry is one edit, not a hunt across teardown sites. Callers keep
     * their own transport disconnect / map deletes / health-check / status /
     * budget handling — only the registry purge is shared.
     */
    private purgeServerRegistries;
    /**
     * Removes a server and its tools
     */
    private removeServer;
    readResource(serverName: string, uri: string, options?: {
        signal?: AbortSignal;
    }): Promise<ReadResourceResult>;
    /**
     * Add (or replace) a runtime MCP server, wiring:
     *   1. Config runtime overlay (shadow-over-settings detection)
     *   2. Budget guard (enforce throws, warn returns skipped)
     *   3. Pool acquire (or standalone McpClient connect + discover)
     *
     * Returns a result object describing what happened. Throws
     * `McpBudgetWouldExceedError` on hard-cap violations,
     * `McpServerSpawnFailedError` on transport failures,
     * `InvalidMcpConfigError` on bad config.
     */
    addRuntimeMcpServer(name: string, config: MCPServerConfig, originatorClientId: string): Promise<AddRuntimeMcpServerResult>;
    /**
     * Remove a runtime MCP server previously added via
     * `addRuntimeMcpServer`. Drops the Config overlay, releases the
     * pool connection (or disconnects the standalone client), and
     * releases the budget slot.
     *
     * Idempotent: returns `{skipped: true, reason: 'not_present'}` when
     * no runtime entry exists for `name`.
     */
    removeRuntimeMcpServer(name: string, originatorClientId: string): Promise<RemoveRuntimeMcpServerResult>;
}
export type AddRuntimeMcpServerResult = {
    name: string;
    transport: McpTransportKind;
    replaced: boolean;
    shadowedSettings: boolean;
    toolCount: number;
    originatorClientId: string;
} | {
    name: string;
    skipped: true;
    reason: 'budget_warning_only' | 'runtime_name_conflict';
};
export type RemoveRuntimeMcpServerResult = {
    name: string;
    removed: true;
    wasShadowingSettings: boolean;
    originatorClientId: string;
} | {
    name: string;
    skipped: true;
    reason: 'not_present';
};
export { McpBudgetWouldExceedError, McpServerSpawnFailedError, InvalidMcpConfigError, } from './mcp-errors.js';
