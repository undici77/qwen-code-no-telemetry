/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonClient } from './DaemonClient.js';
import {
  type CreateSessionRequest,
  type NonBlockingPromptAccepted,
  type PromptRequest,
  type RestoreSessionRequest,
  type SubscribeOptions,
} from './DaemonClient.js';
import type {
  DaemonForkSessionResult,
  DaemonEvent,
  DaemonRewindResult,
  DaemonRewindSnapshotInfo,
  DaemonSessionBtwResult,
  DaemonSessionGenerationEvent,
  DaemonMidTurnMessageResult,
  DaemonMidTurnMessagesResult,
  DaemonRemoveMidTurnMessageResult,
  DaemonPendingPromptsResult,
  DaemonRemovePendingPromptResult,
  DaemonSessionContextStatus,
  DaemonSessionContextUsageStatus,
  DaemonSessionConfigOptionResult,
  DaemonSessionLspStatus,
  DaemonSessionRecapResult,
  DaemonSessionSummary,
  DaemonShellCommandResult,
  DaemonSessionArtifactInput,
  DaemonSessionArtifactMutationResult,
  DaemonSessionArtifactsEnvelope,
  DaemonSessionState,
  DaemonSession,
  DaemonSessionStatsStatus,
  DaemonSessionSupportedCommandsStatus,
  DaemonSessionTaskStatus,
  DaemonSessionTasksStatus,
  HeartbeatResult,
  PermissionResponse,
  PromptResult,
  SetModelResult,
  SessionMetadataResult,
} from './types.js';
/** Compacted replay snapshot returned by the daemon on session load. */
export interface DaemonReplaySnapshot {
  compactedReplay: DaemonEvent[];
  liveJournal: DaemonEvent[];
}
export interface DaemonSessionClientOptions {
  client: DaemonClient;
  session: DaemonSession;
  /** True when load/resume attached to a session with an in-flight prompt. */
  hasActivePrompt?: boolean;
  /** ACP state returned by load/resume; empty for create/attach clients. */
  state?: DaemonSessionState;
  /**
   * Seed replay state for callers that persisted the last seen SSE event id.
   * When omitted, the first event subscription starts live. Values must be
   * finite, non-negative integers because the daemon uses these ids as
   * `Last-Event-ID` resume cursors.
   */
  lastEventId?: number;
  /**
   * Epoch token of the event bus that produced `lastEventId` (the
   * `eventEpoch` field of load/resume responses). Paired with the cursor
   * on every subscription so a daemon restart is detected as an epoch
   * mismatch instead of a numeric guess. Absent on older daemons — the
   * first subscription then learns the epoch from the
   * `X-Qwen-Event-Epoch` response header.
   */
  eventEpoch?: string;
  /** Compacted replay snapshot from daemon load response. */
  replaySnapshot?: DaemonReplaySnapshot;
  /** True when the load response explicitly carried both replay arrays. */
  replaySnapshotComplete?: boolean;
  /** True when persisted replay was only partially reconstructed. */
  replayPartial?: boolean;
  /** Diagnostic for a partial persisted replay. */
  replayError?: string;
  /** True when older persisted records precede the replay snapshot. */
  historyHasMore?: boolean;
  /**
   * Fallback pagination anchor from the daemon: the oldest
   * `qwen.session.recordId` in the last persisted transcript page,
   * read from the transcript when the replay
   * snapshot's `history_truncated` marker carries none (live sessions
   * whose in-flight turn capped the journal before any turn boundary).
   * Clients use it as `beforeRecordId` when no recordId is available
   * in the retained window.
   */
  historyAnchorRecordId?: string;
  /**
   * True when the daemon reported the replay snapshot as degraded (the
   * compaction engine failed at least once for this session). Consumers
   * should prefer the full transcript over the snapshot when set.
   */
  replayDegraded?: boolean;
  /**
   * Local per-session prompt cap. The counter is shared with the parent
   * `DaemonClient`; other session clients using the same parent instance
   * contend on the same count. Set to `null`, `0`, or `Infinity` to disable
   * the local guard. Server-side admission still applies.
   */
  maxPendingPromptsPerSession?: number | null;
}
export interface DaemonSessionSubscribeOptions
  extends Omit<
    SubscribeOptions,
    'clientId' | 'previousSseStreamId' | 'onSseStreamAccepted'
  > {
  /**
   * Reuse this client's last seen SSE event id when `lastEventId` is not
   * supplied. Defaults to true so reconnecting client adapters get replay
   * behavior without carrying the id through every call.
   */
  resume?: boolean;
}
/**
 * Session-scoped wrapper around `DaemonClient`.
 *
 * `DaemonClient` mirrors the raw HTTP API and requires a `sessionId` on each
 * method. `DaemonSessionClient` is the adapter-facing layer for TUI, channel,
 * IDE, and web backends: it binds one daemon session, forwards the existing
 * Stage 1 routes, and preserves SSE replay state. It intentionally does not
 * interpret daemon event payloads; typed event reducers belong to the protocol
 * schema layer — see `asKnownDaemonEvent` and `reduceDaemonSessionEvent` in
 * `./events.js` for the typed consumption surface.
 */
export declare class DaemonSessionClient {
  readonly client: DaemonClient;
  readonly session: DaemonSession;
  readonly state: DaemonSessionState;
  readonly replaySnapshot: DaemonReplaySnapshot;
  readonly replaySnapshotComplete: boolean;
  readonly replayPartial: boolean;
  readonly replayError: string | undefined;
  readonly hasActivePrompt: boolean;
  readonly historyHasMore: boolean;
  /**
   * Fallback pagination anchor from the daemon load response (see
   * {@link DaemonSessionClientOptions.historyAnchorRecordId}). Undefined
   * when the retained window already carries a recordId or the daemon
   * could not read one from the persisted transcript.
   */
  readonly historyAnchorRecordId: string | undefined;
  /**
   * True when the load response flagged the replay snapshot as degraded
   * (`replayDegraded` — compaction failed at least once, so
   * `replaySnapshot` may lag behind live events). Prefer the full
   * transcript (see `fullTranscriptAvailable`) when set.
   */
  readonly replayDegraded: boolean;
  private lastSeenEventId;
  /**
   * Epoch token paired with {@link lastSeenEventId}. Seeded from the
   * load/resume/create response when available, refreshed from every
   * subscription's `X-Qwen-Event-Epoch` response header.
   */
  private lastSeenEpoch;
  private hasAcceptedRestStream;
  private lastAcceptedRestStreamId;
  private subscriptionActive;
  /** In-flight `reattach()` so concurrent prompts re-register only once. */
  private reattaching?;
  private cancelling?;
  private readonly promptLimit;
  private readonly _pendingPrompts;
  constructor(opts: DaemonSessionClientOptions);
  /**
   * Creates a new daemon session or attaches to an existing matching session.
   */
  static createOrAttach(
    client: DaemonClient,
    req?: CreateSessionRequest,
    clientId?: string,
  ): Promise<DaemonSessionClient>;
  /**
   * Loads an existing daemon session and seeds the first event subscription
   * from the start of the daemon replay ring so history replay frames emitted
   * during `session/load` are visible to this client.
   */
  static load(
    client: DaemonClient,
    sessionId: string,
    req?: RestoreSessionRequest,
    clientId?: string,
  ): Promise<DaemonSessionClient>;
  /**
   * Resumes an existing daemon session without requesting history replay.
   * When the daemon returns a watermark (`lastEventId`), uses it as the
   * initial SSE cursor. Falls back to 0 for older daemons so
   * post-resume events (e.g. `available_commands_update`) are captured.
   */
  static resume(
    client: DaemonClient,
    sessionId: string,
    req?: RestoreSessionRequest,
    clientId?: string,
  ): Promise<DaemonSessionClient>;
  get sessionId(): string;
  get workspaceCwd(): string;
  get attached(): boolean;
  get clientId(): string | undefined;
  get worktree(): DaemonSession['worktree'];
  get branch(): DaemonSession['branch'];
  get lastEventId(): number | undefined;
  get eventEpoch(): string | undefined;
  setLastEventId(lastEventId: number | undefined): void;
  prompt(req: PromptRequest, signal?: AbortSignal): Promise<PromptResult>;
  /**
   * Submit a prompt and return as soon as the daemon accepts it.
   *
   * This is admission-only: it does not reserve a client-side prompt slot,
   * register the prompt in `_pendingPrompts`, or wait for the matching
   * `turn_complete` / `turn_error` SSE event. Callers that need final turn
   * results should use `prompt()` or manage SSE terminal events themselves.
   */
  submitPrompt(
    req: PromptRequest,
    signal?: AbortSignal,
  ): Promise<NonBlockingPromptAccepted>;
  /**
   * Run a prompt-admission call, recovering from a stale `clientId`.
   *
   * A daemon restart (or session reload) wipes the daemon's in-memory client
   * registration, so a prompt sent with our now-unknown `clientId` is rejected
   * at admission with `400 invalid_client_id` (see PR #5784). That rejection
   * happens before the turn is registered, so the prompt never ran — retrying
   * cannot double-execute. We re-register to obtain a fresh `clientId` and
   * retry the admission exactly once. Any other error (and a second
   * `invalid_client_id`) propagates.
   */
  private withClientIdSelfHeal;
  /**
   * Re-register this client against the (already-restored) session to obtain a
   * fresh daemon-assigned `clientId`. Concurrent callers coalesce onto a single
   * in-flight `resume` so we never orphan extra registrations.
   */
  private reattach;
  cancel(): Promise<void>;
  /**
   * Bump the daemon's last-seen bookkeeping for this session. Adapters
   * with a long-lived view of a session (TUI/IDE/web) can fire this on
   * an interval to keep diagnostics fresh and feed future revocation
   * policy. Forwards the bound `clientId` so identified clients update
   * their per-client timestamp instead of just the session-wide one.
   */
  heartbeat(): Promise<HeartbeatResult>;
  artifacts(): Promise<DaemonSessionArtifactsEnvelope>;
  addArtifact(
    artifact: DaemonSessionArtifactInput,
  ): Promise<DaemonSessionArtifactMutationResult>;
  removeArtifact(
    artifactId: string,
  ): Promise<DaemonSessionArtifactMutationResult>;
  setModel(modelId: string): Promise<SetModelResult>;
  setConfigOption(
    configId: 'reasoning_effort',
    value: string,
  ): Promise<DaemonSessionConfigOptionResult>;
  getRewindSnapshots(): Promise<{
    snapshots: DaemonRewindSnapshotInfo[];
  }>;
  rewind(
    promptId: string,
    opts?: {
      rewindFiles?: boolean;
    },
  ): Promise<DaemonRewindResult>;
  fork(directive: string): Promise<DaemonForkSessionResult>;
  /**
   * One-sentence "where did I leave off" recap of this session. See
   * `DaemonClient.recapSession` for the full contract: best-effort
   * (may return `recap: null`); the optional `signal` aborts only the
   * local HTTP fetch — the daemon-side wait + the LLM call in the ACP
   * child both run to completion regardless (no cross-process abort
   * plumbing in v1).
   */
  recap(opts?: { signal?: AbortSignal }): Promise<DaemonSessionRecapResult>;
  generateContent(
    prompt: string,
    opts?: {
      signal?: AbortSignal;
    },
  ): AsyncGenerator<DaemonSessionGenerationEvent>;
  btw(
    question: string,
    opts?: {
      signal?: AbortSignal;
    },
  ): Promise<DaemonSessionBtwResult>;
  /**
   * Queue a user message typed while this session's turn is still running so
   * the ACP child can drain it mid-turn. Forwards the client id bound at
   * create/attach. Accepted requests become daemon-owned even when the active
   * turn settles while the request is in flight.
   */
  enqueueMidTurnMessage(
    message: string,
    opts?: {
      signal?: AbortSignal;
      messageId?: string;
    },
  ): Promise<DaemonMidTurnMessageResult>;
  removeMidTurnMessage(
    messageId: string,
  ): Promise<DaemonRemoveMidTurnMessageResult>;
  /**
   * Fetch the mid-turn reconciliation snapshot (queue + delivery-state rings) for
   * this session. Forwards the bound client id. See
   * `DaemonClient.getMidTurnMessages` — requires the daemon to advertise
   * `session_mid_turn_message_query`; older daemons reject with 404 and
   * callers preserve their current state.
   */
  getMidTurnMessages(opts?: {
    signal?: AbortSignal;
  }): Promise<DaemonMidTurnMessagesResult>;
  getPendingPrompts(): Promise<DaemonPendingPromptsResult>;
  removePendingPrompt(
    promptId: string,
  ): Promise<DaemonRemovePendingPromptResult>;
  /**
   * Execute a direct daemon-side shell command for this session. Requires the
   * daemon to opt in to direct session shell and bearer auth; this wrapper
   * automatically forwards the client id bound when the session was created
   * or attached.
   */
  shellCommand(
    command: string,
    signal?: AbortSignal,
  ): Promise<DaemonShellCommandResult>;
  context(): Promise<DaemonSessionContextStatus>;
  status(): Promise<DaemonSessionSummary>;
  contextUsage(opts?: {
    detail?: boolean;
  }): Promise<DaemonSessionContextUsageStatus>;
  supportedCommands(): Promise<DaemonSessionSupportedCommandsStatus>;
  tasks(): Promise<DaemonSessionTasksStatus>;
  lspStatus(): Promise<DaemonSessionLspStatus>;
  cancelTask(
    taskId: string,
    kind: DaemonSessionTaskStatus['kind'],
  ): Promise<{
    cancelled: boolean;
  }>;
  clearGoal(): Promise<{
    cleared: boolean;
    condition?: string;
  }>;
  stats(): Promise<DaemonSessionStatsStatus>;
  respondToPermission(
    requestId: string,
    response: PermissionResponse,
  ): Promise<boolean>;
  respondToSessionPermission(
    requestId: string,
    response: PermissionResponse,
  ): Promise<boolean>;
  close(): Promise<void>;
  detach(): Promise<void>;
  updateMetadata(metadata: {
    displayName?: string;
  }): Promise<SessionMetadataResult>;
  events(
    opts?: DaemonSessionSubscribeOptions,
  ): AsyncGenerator<DaemonEvent, void, unknown>;
  /**
   * @deprecated Use {@link events} instead. Both methods are equivalent.
   */
  subscribeEvents(
    opts?: DaemonSessionSubscribeOptions,
  ): AsyncGenerator<DaemonEvent, void, unknown>;
  private openEventSubscription;
  private iterateEvents;
  private _dispatchTurnEvent;
  private _rejectAllPending;
}
