/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  Client,
  ReadTextFileRequest,
  ReadTextFileResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  SessionNotification,
  SessionUpdate,
  WriteTextFileRequest,
  WriteTextFileResponse,
} from '@agentclientprotocol/sdk';
import type { BridgeEvent, EventBus } from './eventBus.js';
import { type ActiveWorkSnapshotV1 } from './bridgeTypes.js';
import type {
  BridgeWorkspaceGenerationNotificationEvent,
  BridgeGenerationNotificationEvent,
  BridgePendingInteraction,
  MidTurnQueueEntry,
  PendingPromptEntry,
} from './bridgeTypes.js';
import type {
  ChannelDeliveryHandler,
  ClientMcpMessageSender,
  CreateSubSessionHandler,
  ExternalToolGuardHandler,
  LiveScreenContextCaptureHandler,
  LiveSpeakToUserHandler,
  LiveTaskToolRequestHandler,
} from './bridgeOptions.js';
import type { BridgeFileSystem } from './bridgeFileSystem.js';
import type { PermissionMediator } from './permission.js';
import type {
  SessionArtifactInput,
  SessionArtifactStore,
} from './sessionArtifacts.js';
export declare const KNOWN_APPROVAL_MODES: ReadonlySet<string>;
/**
 * Minimal session-entry shape `BridgeClient` reads via its
 * `resolveEntry` callback. Defined here (rather than importing the
 * factory's richer `SessionEntry`) to keep the bridge package free of
 * daemon-host session-bookkeeping types: the factory's `SessionEntry`
 * structurally satisfies this interface, so no explicit conversion
 * is required.
 *
 * Only the fields declared on this narrowed interface cross the boundary:
 * `sessionId`, `events`,
 * `pendingPermissionIds`, `pendingInteractions`, `activePromptId`,
 * `activePromptOriginatorClientId`. New fields
 * BridgeClient grows must be added here too (and the factory's
 * `SessionEntry` is required to provide them — TS enforces the
 * structural match at the callback signature).
 */
export interface BridgeClientSessionEntry {
  sessionId: string;
  events: EventBus;
  artifacts: SessionArtifactStore;
  recordingDegraded: boolean;
  pendingPermissionIds: Set<string>;
  /** Pollable pending human interactions, keyed by permission request id. */
  pendingInteractions: Map<string, BridgePendingInteraction>;
  /**
   * Mid-turn user messages queued by the browser, drained here when the ACP
   * child calls the `craft/drainMidTurnQueue` ext-method. Owned by the full
   * `SessionEntry` in `bridge.ts`; surfaced on this narrowed view so
   * `extMethod` can splice it. See `SessionEntry.midTurnMessageQueue`.
   */
  midTurnMessageQueue: MidTurnQueueEntry[];
  /**
   * Bounded ring of drained mid-turn message ids. Owned by the full
   * `SessionEntry` in `bridge.ts`; surfaced on this narrowed view so the
   * drain in `extMethod` can record what it handed to the child. See
   * `SessionEntry.settledMidTurnMessageIds`.
   */
  settledMidTurnMessageIds: string[];
  /** Complete prompts waiting behind the currently running prompt. */
  pendingPromptList: PendingPromptEntry[];
  /** Bridge prompt that owns the child Guard wait for this FIFO. */
  todoStopGuardAwaitingQueuedPromptOwnerPromptId?: string;
  /** True while a prompt is executing for this session. */
  promptActive?: boolean;
  /** Admitted id for the prompt currently executing on this session. */
  activePromptId?: string;
  activePromptOriginatorClientId?: string;
  /**
   * True while the bridge drives a model roundtrip; the
   * `current_model_update` extNotification demux reads it to suppress
   * promotion during a bridge-driven change. Set on the full `SessionEntry`
   * in `bridge.ts`; surfaced here for the demux.
   */
  modelRoundtripInFlight?: boolean;
  /** A2: mirrors `modelRoundtripInFlight` for approval-mode roundtrips. */
  approvalModeRoundtripInFlight?: boolean;
}
interface PreparedSessionUpdateFrames {
  frames: Array<Omit<BridgeEvent, 'id' | 'v'>>;
  artifacts: SessionArtifactInput[];
  trustedPublisher: boolean;
  turn: Pick<BridgeEvent, 'promptId' | 'originatorClientId'>;
}
/**
 * Bridge `Client` implementation — the daemon's response surface for things
 * the agent asks the client (file reads/writes, permission prompts).
 *
 * Stage 1 behavior:
 *   - `requestPermission` publishes a `permission_request` event onto the
 *     session bus and awaits the first HTTP `POST /permission/:requestId`
 *     vote (first-responder wins). When the session is cancelled or the
 *     daemon shuts down, the pending promise resolves with
 *     `{ outcome: { outcome: 'cancelled' } }` per ACP spec.
 *   - `sessionUpdate` notifications publish onto the session's EventBus; SSE
 *     subscribers (`GET /session/:id/events`) drain it.
 *   - File reads/writes proxy to local fs (daemon and agent share the host).
 *
 * Stage 1 trust model: the spawned `qwen --acp` child runs as the same user
 * as the daemon, so the file-proxy methods do NOT enforce a workspace-cwd
 * sandbox. The agent could already read or write the same files via its
 * built-in tools (e.g. shell). Restricting the bridge here would be
 * theatre. Stage 4+ remote-sandbox deployments swap this `Client` for a
 * sandbox-aware variant.
 */
export declare class BridgeClient implements Client {
  /**
   * Look up the `SessionEntry` for an ACP call. Stage 1.5 multi-
   * session on one channel means `BridgeClient` is shared across
   * many sessions, so we can't bind the entry in a closure — we
   * dispatch by the `sessionId` ACP includes in every per-session
   * notification / request. `undefined` sessionId is the fallback
   * for ACP calls that don't carry one (none expected on the
   * client surface as of this writing) and resolves to whatever
   * the channel's most-recent entry is — kept defensive to avoid
   * silent drops if ACP grows a no-sessionId call.
   */
  private readonly resolveEntry;
  private readonly resolvePendingRestoreEvents;
  /** The multi-client permission coordinator. Owns ALL pending +
   * resolved permission state; this client just plumbs
   * `requestPermission` into `mediator.request` and forwards
   * the resolution to the agent. Strategy dispatch and audit/emit
   * fan-out live inside the mediator.
   */
  private readonly mediator;
  /**
   * Bd1yh: wall-clock ms before `requestPermission` resolves as
   * cancelled if no client vote arrives. 0 = disabled. Prevents
   * the per-session FIFO `promptQueue` from poisoning forever
   * when no SSE subscriber is connected. Forwarded directly to
   * `mediator.request`; the mediator owns the timer.
   */
  private readonly permissionTimeoutMs;
  /**
   * Bd1z5: per-session cap on in-flight permissions. New requests
   * past this cap resolve as cancelled with a stderr warning.
   * Infinity = disabled. The bridge keeps `entry.pendingPermissionIds`
   * as a fast cap-check index; the mediator is still the source of
   * truth for the pending registry.
   */
  private readonly maxPendingPerSession;
  /**
   * Optional fs injection seam. When provided, `writeTextFile` /
   * `readTextFile` delegate to this implementation instead of running
   * the inline `fs.realpath` / `fs.writeFile` / `fs.readFile` proxy
   * below. Production `qwen serve` wires a serve-side adapter
   * wrapping `WorkspaceFileSystem` here so writes get the TOCTOU +
   * symlink + trust-gate + audit machinery the inline proxy lacks.
   * Omitted by tests + Mode A in-process consumers + channels / IDE
   * companion — preserves the inline proxy behavior.
   */
  private readonly fileSystem?;
  /**
   * §2.3 callback: centralised `model_switched` publish through the
   * bridge factory's cache-updating helper. The BridgeClient calls
   * this instead of inlining `entry.events.publish(...)` so the
   * cache update + generation bump stays atomic in one place.
   */
  private readonly onModelPromoted?;
  /**
   * §2.3 / A2 callback: centralised `approval_mode_changed` publish.
   * Called by the A2 `current_mode_update` demux when the agent
   * switches approval mode in-session (exit_plan_mode, ProceedAlways,
   * /mode). `previous` is read from the bridge state cache.
   */
  private readonly onModePromoted?;
  /**
   * Reverse tool channel (issue #5626, Phase 2). Resolves the
   * `sendSdkMcpMessage`-shaped sender for a client-hosted MCP server name so
   * the `qwen/control/client_mcp/message` ext-method (child → parent) can
   * deliver a JSON-RPC frame to the extension and return the response.
   * Omitted by tests / Mode A consumers — the method then rejects with
   * `methodNotFound` (no client-hosted server can exist without it).
   */
  private readonly clientMcpSender?;
  private readonly ownsSession;
  /**
   * Optional daemon token-usage hook. Called once per model round with the
   * per-round input/output token increments read from
   * `agent_message_chunk._meta.usage` at {@link sessionUpdate} (the single
   * session/update fan-in). Wired only by the daemon host for the Daemon
   * Status token-burn chart; omitted by tests / Mode A in-process consumers.
   * `apiErrors` / `apiRetries` are the per-round model-API-error and
   * automatic-retry increments riding the same `_meta` frame (0 when the
   * round had none), for the daemon's model-API-health charts.
   */
  private readonly onTokenUsage?;
  /**
   * Daemon-host seam for the `create_sub_session` tool. Invoked from the
   * `extMethod` dispatch (a child→daemon REQUEST, so it returns a Promise the
   * child awaits) with the prompt, completion mode, and optional model/name;
   * the host spawns a sub-session and, for `'first-turn'`, returns its result.
   * Omitted by tests / Mode A / non-daemon — the method then reports
   * `methodNotFound` and the tool surfaces itself as daemon-only.
   */
  private readonly onCreateSubSession?;
  /** Request-scoped generation events are routed to a private bridge queue,
   * never to the session EventBus. */
  private readonly onGenerationEvent?;
  /** Workspace generation events are session-less and routed to a
   * private bridge queue keyed by requestId. */
  private readonly onWorkspaceGenerationEvent?;
  private readonly onChannelDelivery?;
  /** Permits pre-registration client-MCP discovery without trusting its id. */
  private readonly hasSessionSpawnInFlight;
  private readonly getLiveScreenContextCaptureHandler;
  private readonly getLiveTaskToolRequestHandler;
  private readonly getLiveSpeakToUserHandler;
  /**
   * Managed tool guard hosted by the daemon. Kept after the Live handlers so
   * existing direct BridgeClient constructors remain source-compatible.
   */
  private readonly externalToolGuard?;
  private readonly onActiveWork?;
  constructor(
    /**
     * Look up the `SessionEntry` for an ACP call. Stage 1.5 multi-
     * session on one channel means `BridgeClient` is shared across
     * many sessions, so we can't bind the entry in a closure — we
     * dispatch by the `sessionId` ACP includes in every per-session
     * notification / request. `undefined` sessionId is the fallback
     * for ACP calls that don't carry one (none expected on the
     * client surface as of this writing) and resolves to whatever
     * the channel's most-recent entry is — kept defensive to avoid
     * silent drops if ACP grows a no-sessionId call.
     */
    resolveEntry: (sessionId?: string) => BridgeClientSessionEntry | undefined,
    resolvePendingRestoreEvents: (sessionId?: string) => EventBus | undefined,
    /** The multi-client permission coordinator. Owns ALL pending +
     * resolved permission state; this client just plumbs
     * `requestPermission` into `mediator.request` and forwards
     * the resolution to the agent. Strategy dispatch and audit/emit
     * fan-out live inside the mediator.
     */
    mediator: Pick<PermissionMediator, 'request'>,
    /**
     * Bd1yh: wall-clock ms before `requestPermission` resolves as
     * cancelled if no client vote arrives. 0 = disabled. Prevents
     * the per-session FIFO `promptQueue` from poisoning forever
     * when no SSE subscriber is connected. Forwarded directly to
     * `mediator.request`; the mediator owns the timer.
     */
    permissionTimeoutMs: number,
    /**
     * Bd1z5: per-session cap on in-flight permissions. New requests
     * past this cap resolve as cancelled with a stderr warning.
     * Infinity = disabled. The bridge keeps `entry.pendingPermissionIds`
     * as a fast cap-check index; the mediator is still the source of
     * truth for the pending registry.
     */
    maxPendingPerSession: number,
    /**
     * Optional fs injection seam. When provided, `writeTextFile` /
     * `readTextFile` delegate to this implementation instead of running
     * the inline `fs.realpath` / `fs.writeFile` / `fs.readFile` proxy
     * below. Production `qwen serve` wires a serve-side adapter
     * wrapping `WorkspaceFileSystem` here so writes get the TOCTOU +
     * symlink + trust-gate + audit machinery the inline proxy lacks.
     * Omitted by tests + Mode A in-process consumers + channels / IDE
     * companion — preserves the inline proxy behavior.
     */
    fileSystem?: BridgeFileSystem | undefined,
    /**
     * §2.3 callback: centralised `model_switched` publish through the
     * bridge factory's cache-updating helper. The BridgeClient calls
     * this instead of inlining `entry.events.publish(...)` so the
     * cache update + generation bump stays atomic in one place.
     */
    onModelPromoted?:
      | ((
          entry: BridgeClientSessionEntry,
          modelId: string,
          originatorClientId: string | undefined,
        ) => void)
      | undefined,
    /**
     * §2.3 / A2 callback: centralised `approval_mode_changed` publish.
     * Called by the A2 `current_mode_update` demux when the agent
     * switches approval mode in-session (exit_plan_mode, ProceedAlways,
     * /mode). `previous` is read from the bridge state cache.
     */
    onModePromoted?:
      | ((
          entry: BridgeClientSessionEntry,
          modeId: string,
          originatorClientId: string | undefined,
        ) => void)
      | undefined,
    /**
     * Reverse tool channel (issue #5626, Phase 2). Resolves the
     * `sendSdkMcpMessage`-shaped sender for a client-hosted MCP server name so
     * the `qwen/control/client_mcp/message` ext-method (child → parent) can
     * deliver a JSON-RPC frame to the extension and return the response.
     * Omitted by tests / Mode A consumers — the method then rejects with
     * `methodNotFound` (no client-hosted server can exist without it).
     */
    clientMcpSender?: ClientMcpMessageSender | undefined,
    ownsSession?: (sessionId: string) => boolean,
    /**
     * Optional daemon token-usage hook. Called once per model round with the
     * per-round input/output token increments read from
     * `agent_message_chunk._meta.usage` at {@link sessionUpdate} (the single
     * session/update fan-in). Wired only by the daemon host for the Daemon
     * Status token-burn chart; omitted by tests / Mode A in-process consumers.
     * `apiErrors` / `apiRetries` are the per-round model-API-error and
     * automatic-retry increments riding the same `_meta` frame (0 when the
     * round had none), for the daemon's model-API-health charts.
     */
    onTokenUsage?:
      | ((
          inputTokens: number,
          outputTokens: number,
          durationMs?: number,
          apiErrors?: number,
          apiRetries?: number,
        ) => void)
      | undefined,
    /**
     * Daemon-host seam for the `create_sub_session` tool. Invoked from the
     * `extMethod` dispatch (a child→daemon REQUEST, so it returns a Promise the
     * child awaits) with the prompt, completion mode, and optional model/name;
     * the host spawns a sub-session and, for `'first-turn'`, returns its result.
     * Omitted by tests / Mode A / non-daemon — the method then reports
     * `methodNotFound` and the tool surfaces itself as daemon-only.
     */
    onCreateSubSession?: CreateSubSessionHandler | undefined,
    /** Request-scoped generation events are routed to a private bridge queue,
     * never to the session EventBus. */
    onGenerationEvent?:
      | ((sessionId: string, event: BridgeGenerationNotificationEvent) => void)
      | undefined,
    /** Workspace generation events are session-less and routed to a
     * private bridge queue keyed by requestId. */
    onWorkspaceGenerationEvent?:
      | ((event: BridgeWorkspaceGenerationNotificationEvent) => void)
      | undefined,
    onChannelDelivery?: ChannelDeliveryHandler | undefined,
    /** Permits pre-registration client-MCP discovery without trusting its id. */
    hasSessionSpawnInFlight?: () => boolean,
    getLiveScreenContextCaptureHandler?: () =>
      | LiveScreenContextCaptureHandler
      | undefined,
    getLiveTaskToolRequestHandler?: () =>
      | LiveTaskToolRequestHandler
      | undefined,
    getLiveSpeakToUserHandler?: () => LiveSpeakToUserHandler | undefined,
    /**
     * Managed tool guard hosted by the daemon. Kept after the Live handlers so
     * existing direct BridgeClient constructors remain source-compatible.
     */
    externalToolGuard?: ExternalToolGuardHandler | undefined,
    onActiveWork?: ((snapshot: ActiveWorkSnapshotV1) => void) | undefined,
  );
  requestPermission(
    params: RequestPermissionRequest,
  ): Promise<RequestPermissionResponse>;
  sessionUpdate(params: SessionNotification): Promise<void>;
  prepareSessionUpdateFrames(
    params: SessionNotification,
    entry?: BridgeClientSessionEntry,
  ): PreparedSessionUpdateFrames;
  seedSessionUpdates(
    entry: BridgeClientSessionEntry,
    updates: SessionUpdate[],
    options?: {
      ingestArtifacts?: boolean;
    },
  ): Promise<void>;
  /**
   * Daemon token-burn accounting for LIVE model turns. Called only from
   * `sessionUpdate` (the live session/update fan-in), never from
   * `seedSessionUpdates` — so batch load-replay never lands historical usage in
   * the current metrics window. Additionally guarded on a live `entry`: a stray
   * pending-restore frame (entry not yet registered) is skipped too, so replayed
   * history can't post a phantom burn spike with no model call.
   *
   * Usage rides an otherwise-empty `agent_message_chunk` as `update._meta.usage`
   * with per-round camelCase increments; subagent frames carry their own usage
   * (tagged `parentToolCallId`) and are independent turns, so counting each
   * frame once is the correct total. `_meta`/`usage` are optional and untyped.
   */
  private recordLiveTokenUsage;
  /**
   * Bounded early-event buffer. The map is scoped to this BridgeClient and
   * therefore to one channel; a stale channel cannot seed a fresh channel's
   * future session. Frames are keyed by sessionId; each entry tracks its
   * `expiresAt` for lazy TTL-based eviction in `bufferEarlyEvent`. Drained by
   * `drainEarlyEvents` whenever the bridge registers a session with a matching
   * id. See MAX_EARLY_EVENT_* constants for capacity bounds.
   */
  private readonly earlyEvents;
  /**
   * Tombstone for closed/killed session ids. Prevents late
   * `extNotification` from a dying child from leaking into the
   * early-event buffer and being replayed onto a future session
   * that reuses the same id via `session/load` or `session/resume`.
   *
   * Tombstone semantics:
   * - Marked when the bridge removes a sessionId from `byId` (kill
   *   path, channel.exited handler, closeSession).
   * - Concurrently purges any in-flight `earlyEvents[id]`.
   * - `bufferEarlyEvent` rejects tombstoned ids.
   * - `drainEarlyEvents` clears the tombstone — a fresh
   *   `createSessionEntry` for the same id is a legitimate
   *   "load/resume of a persisted session id" case.
   * - TTL = `EARLY_EVENT_TTL_MS` (60s) — same as the early-event
   *   buffer, so by the time a tombstone expires there can be no
   *   stale frame for that id anywhere in the system.
   */
  private readonly tombstonedSessionIds;
  /** Restore ownership for `sessionUpdate` and artifact demultiplexing. */
  private readonly inFlightRestoreIds;
  /**
   * Registrations allowed to buffer early extended notifications through an
   * ordinary close tombstone. This includes restores and caller-supplied-id
   * spawns, and lasts only until their ACP registration attempt settles.
   */
  private readonly inFlightSessionRegistrationIds;
  /**
   * Restore ids whose caller timed out while the non-cancellable ACP request
   * continues.
   */
  private readonly abandonedRestoreIds;
  /**
   * Handle child->bridge ACP `extMethod` requests (calls that expect a
   * response, unlike `extNotification`). Served methods:
   * `qwen/control/client_mcp/message` (reverse tool channel),
   * `qwen/control/create-sub-session` (the `create_sub_session` tool → daemon
   * spawns a sub-session and, for `'first-turn'`, returns its first-turn
   * result), and `craft/drainMidTurnQueue`: the ACP child calls the last one
   * between tool batches to pull any messages the browser queued mid-turn. We splice the per-session
   * queue, return them to the child as the response, and — when non-empty —
   * publish a `mid_turn_message_injected` SSE frame so the browser can move
   * those messages out of its pending queue (a dedupe signal, not a transcript
   * render). Unknown methods reject with ACP `methodNotFound` (-32601), matching
   * the SDK's
   * default for an unimplemented client surface; the child's drain caller
   * treats that as "drain unsupported" and stops asking.
   */
  extMethod(
    method: string,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  private handleExternalToolGuardPrepare;
  private handleTodoStopGuardContinuationClaim;
  private handleChannelDelivery;
  /**
   * Reverse tool channel (issue #5626, Phase 2) — answer the child's
   * `qwen/control/client_mcp/message` ext-method. The child's session
   * `McpClientManager` calls this when its agent drives a client-hosted
   * (extension) MCP server: `params` carries the advertised `server` name and
   * the JSON-RPC `payload` (initialize / tools/list / tools/call / a
   * notification). We resolve the per-WS-connection sender via the injected
   * `clientMcpSender` lookup, deliver the payload over the daemon WS, and
   * return the correlated response as `{ payload }`.
   *
   * Rejects with ACP `methodNotFound` when no `clientMcpSender` is wired (Mode
   * A / tests can't host a client MCP server), and `invalidParams` when the
   * frame is malformed or the named server is no longer hosted (e.g. the
   * extension disconnected mid-turn) — the agent's `SdkControlClientTransport`
   * surfaces that as a transport error rather than hanging.
   */
  private handleClientMcpMessage;
  /**
   * Handle the `create_sub_session` tool's request: validate, then forward to
   * the daemon-host `onCreateSubSession` callback (which spawns a fresh
   * top-level sub-session and, for `'first-turn'`, waits for its first turn and
   * returns the result). No host wired → `methodNotFound`, which the tool
   * surfaces as "daemon-only".
   */
  private handleCreateSubSession;
  private handleLiveScreenContextCapture;
  private handleLiveTaskTool;
  private handleLiveSpeakToUser;
  /**
   * Handle child->bridge ACP `extNotification` calls. Recognized methods are
   * `qwen/notify/session/model-update`,
   * `qwen/notify/session/mode-update`,
   * `qwen/notify/session/title-update` (auto/in-process session titles),
   * `qwen/notify/session/recording-degraded`,
   * `qwen/notify/session/prompt-suggestion` (followup assist),
   * `qwen/notify/session/artifact-event` (hook artifacts),
   * `qwen/notify/session/terminal-sequence`, and
   * `_qwencode/end_turn` (background-notification turns), and
   * `qwen/notify/session/mcp-budget-event` — each translated into a
   * session-scoped SSE frame. Unknown methods are dropped silently for
   * forward-compat.
   */
  extNotification(
    method: string,
    params: Record<string, unknown>,
  ): Promise<void>;
  private handleArtifactEvent;
  private upsertAndPublishArtifacts;
  private publishArtifactChanges;
  private publishExtNotification;
  /**
   * Promote an in-session `current_model_update` extNotification to a
   * `model_switched` bus event. Suppressed while the bridge is driving
   * its own model roundtrip (`entry.modelRoundtripInFlight`) — there the
   * bridge publishes the authoritative `model_switched`, so promoting
   * here too would double-publish. A structured log records the decision
   * so the `dropped` case is observable.
   */
  private handleInSessionModelUpdate;
  /**
   * A2: promote an in-session `current_mode_update` extNotification to
   * `approval_mode_changed`. Uses the same suppression pattern as
   * `handleInSessionModelUpdate` — suppressed while the bridge is driving
   * its own approval-mode roundtrip (`entry.approvalModeRoundtripInFlight`)
   * — but diverges with two additions the model handler lacks: enum
   * validation against `KNOWN_APPROVAL_MODES`, and a legacy
   * `session_update{current_mode_update}` dual-emit for IDE companion
   * compat (transition — see §6 of the design doc), itself deduped via the
   * `legacyFrameSent` flag.
   */
  private handleInSessionModeUpdate;
  /**
   * Enqueue `frame` for `sessionId`. Lazy TTL sweep runs first so
   * caller doesn't pay for stale entries before deciding whether
   * the session-cap is reached. New sessionIds past
   * `MAX_EARLY_EVENT_SESSIONS` are dropped (defense against a
   * malicious / buggy child fanning out fake sessionIds); same-
   * sessionId frames past `MAX_EARLY_EVENTS_PER_SESSION` are
   * dropped to bound per-session memory.
   */
  private bufferEarlyEvent;
  private sweepExpiredEarlyEvents;
  private sweepExpiredTombstones;
  /**
   * Mark a sessionId as closed so a late `extNotification` from the
   * dying child can't leak into the early-event buffer. Bridge factory
   * calls this from every `byId.delete(sid)` site (kill path,
   * channel.exited handler, closeSession). Idempotent on already-
   * tombstoned ids — refreshes the TTL so a recently-killed id stays
   * dead long enough for any in-flight stale frames to expire.
   */
  markSessionClosed(sessionId: string): void;
  /**
   * Mark a sessionId as currently being restored via `session/load` /
   * `session/resume`. While in this set, `bufferEarlyEvent` accepts
   * frames for the id even if it's tombstoned — so restore-time
   * early events from the freshly-restored child reach
   * `drainEarlyEvents` instead of being rejected by the tombstone.
   *
   * Bridge factory calls this BEFORE awaiting the ACP restore call.
   * `clearRestoreInFlight` is paired in the matching `finally` so a
   * failed restore doesn't leave a dangling allow-list entry.
   */
  markRestoreInFlight(sessionId: string): void;
  /**
   * Transfer an id from closed/abandoned ownership to a new registration
   * attempt before its ACP call starts. The in-flight allow-list is what lets
   * legitimate early notifications bypass the ordinary close tombstone until
   * `createSessionEntry` can drain them.
   */
  markSessionRegistrationInFlight(sessionId: string): void;
  /**
   * Drop the abandoned-restore fence for `sessionId`.
   *
   * The fence has no TTL and suppresses session updates, guardrail events,
   * and child notifications, so it must not outlive the abandoned attempt it
   * was raised for. The bridge clears it whenever a legitimate owner takes
   * the id — a new restore, or `createSessionEntry` registering a session
   * from any other route.
   */
  clearAbandonedRestoreFence(sessionId: string): void;
  /**
   * Companion to `markRestoreInFlight`. Bridge factory calls this when
   * the restore IIFE settles — after `createSessionEntry` runs
   * (success) or after the ACP restore call fails (error). Cleared to
   * prevent the Set from growing forever under high restore churn.
   */
  clearRestoreInFlight(sessionId: string): void;
  clearSessionRegistrationInFlight(sessionId: string): void;
  markRestoreAbandoned(sessionId: string): void;
  /**
   * Drain any frames buffered for `sessionId` onto `entry.events`.
   * Bridge calls this immediately after `byId.set(sessionId, entry)`
   * in `createSessionEntry`. The frames were captured before the
   * entry existed (e.g. MCP discovery during the child's `newSession`
   * handler), so draining them now lands them in the replay ring as
   * the FIRST events of this session.
   *
   * Public so the bridge factory can call it directly. Idempotent on
   * unknown sessionIds.
   */
  drainEarlyEvents(sessionId: string, entry: BridgeClientSessionEntry): void;
  writeTextFile(params: WriteTextFileRequest): Promise<WriteTextFileResponse>;
  readTextFile(params: ReadTextFileRequest): Promise<ReadTextFileResponse>;
}
export declare function isA2uiToolMeta(meta?: {
  toolName?: string;
  serverId?: string;
}): boolean;
/**
 * Extract the balanced JSON array at the start of the text; returns
 * [command array, remaining fallback text], or null when no array parses.
 *
 * Exported for unit testing.
 */
export declare function splitA2uiText(raw: string): [unknown[], string] | null;
export interface A2uiExtraction {
  /** Commands grouped per surface, in first-appearance order. */
  surfaces: Array<{
    surfaceId: string;
    commands: unknown[];
  }>;
  callId: string | undefined;
  /** Sanitized copy of the notification: the A2UI JSON in the tool-result text is replaced with the fallback text. */
  sanitizedParams: SessionNotification;
}
/**
 * If the notification is a `tool_call_update` from an A2UI tool whose result
 * carries an A2UI command array, extract the commands (grouped per surface)
 * and produce a sanitized notification; otherwise return null (the
 * notification is forwarded as-is).
 *
 * Exported for unit testing.
 */
export declare function extractA2uiToolUpdate(
  params: SessionNotification,
): A2uiExtraction | null;
export {};
