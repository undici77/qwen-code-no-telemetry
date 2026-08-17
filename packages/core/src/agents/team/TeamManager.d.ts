/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { ApprovalMode } from '../../config/config.js';
import type { Backend, TeamAgentHandle } from '../backends/types.js';
import { TeamEventEmitter } from './team-events.js';
import type { TeamFile } from './types.js';
import type { SubagentManager } from '../../subagents/subagent-manager.js';
export type { TeamAgentHandle };
/** Configuration for spawning a teammate. */
export interface TeammateSpawnConfig {
  /** Human-readable name (will be sanitized). */
  name: string;
  /** Agent type (subagent definition name). */
  agentType?: string;
  /** Model identifier override. */
  model?: string;
  /** Custom system prompt. */
  prompt?: string;
  /** Working directory (defaults to team leader's cwd). */
  cwd?: string;
  /** Start this teammate in plan mode and require leader plan approval. */
  planModeRequired?: boolean;
  /** Restrict this teammate to read-only inspection and team coordination. */
  readOnly?: boolean;
}
export interface TeamPlanApprovalRequest {
  teammateName: string;
  plan: string;
  originalRequest?: string;
  researchSummary?: string;
  signal?: AbortSignal;
}
export type TeamPlanApprovalDecision =
  | {
      action: 'approve';
      targetMode: ApprovalMode;
      message?: string;
    }
  | {
      action: 'reject';
      message?: string;
    };
export declare class TeamManager {
  private readonly backend;
  private teamFile;
  private readonly teamEventEmitter;
  /**
   * Cap on per-agent pending messages. Each message can be up to the
   * `send_message` schema's `maxLength`, and a queue only drains when its
   * recipient goes IDLE — so without a cap a single looping or
   * hallucinating teammate can balloon a busy teammate's memory by
   * flooding it. 50 is far above any legitimate backlog for a team of at
   * most `MAX_TEAMMATES`; past it `sendMessage` applies backpressure by
   * rejecting the send.
   */
  private static readonly MAX_PENDING_MESSAGES;
  /** Per-agent pending message queues. */
  private readonly pendingMessages;
  /** Cleanup functions for event bridge listeners, keyed by
   *  agentId so we can release each agent's listeners as soon as
   *  it reaches a terminal status — not just at full team
   *  cleanup. Otherwise long-running sessions accumulate dead
   *  listeners (5 per spawn) on shared emitters. */
  private readonly eventBridgeCleanups;
  /** Last model-visible answer from each teammate's active turn. */
  private readonly pendingFinalReports;
  /** Teammates that explicitly reported to the leader during this turn. */
  private readonly explicitLeaderReports;
  /** Unsubscribe from task update notifications. */
  private taskUpdateUnsubscribe?;
  /** Leader inbox polling interval. */
  private pollingInterval;
  /**
   * Callback to inject teammate messages into the leader. Receives the
   * full model-bound text (the `<teammate_message>` envelope) and a
   * compact, human-readable `display` line for the leader's UI — the
   * two-text split that lets the on-screen line stay short while the
   * model still gets the whole report.
   */
  private leaderMessageCallback;
  /** Names of teammates with a pending leader-requested shutdown.
   *  Gates both the per-idle mailbox read in flushNextMessage and
   *  the shutdown_approved abort path in sendMessage. Tracked
   *  per-agent (rather than as a sticky boolean) so a free-text
   *  match in an unrelated teammate's reply cannot abort them, and
   *  so an impersonation-forged shutdown can't widen the blast
   *  radius across the rest of the session. */
  private readonly _shutdownPending;
  /** Per-agent last activity timestamp (updated on events). */
  private readonly lastActivityAt;
  /** Per-agent teammate identity for re-entering AsyncLocalStorage. */
  private readonly agentIdentities;
  /** Async coordination work kicked off from synchronous event emitters. */
  private readonly pendingAsyncWork;
  /** Pending plan approval requests keyed by opaque request id. */
  private readonly pendingPlanApprovals;
  /** Optional subagent manager for loading specialized agent configs. */
  private readonly subagentManager;
  /** Maximum number of teammates this team will accept. */
  private readonly maxTeammates;
  constructor(
    backend: Backend,
    teamFile: TeamFile,
    subagentManager?: SubagentManager | null,
    options?: {
      maxTeammates?: number;
    },
  );
  /**
   * Spawn a new teammate. Adds the member to the team file,
   * spawns via backend, and sets up the event bridge.
   */
  spawnTeammate(config: TeammateSpawnConfig): Promise<void>;
  /**
   * Send a message to a teammate by name.
   * If the agent is idle, delivers immediately. Otherwise,
   * queues with priority based on sender.
   */
  sendMessage(
    toName: string,
    message: string,
    from?: string,
    summary?: string,
    automatic?: boolean,
  ): Promise<void>;
  /**
   * Broadcast a message to all teammates and the leader
   * (except the sender).
   */
  broadcast(message: string, fromName: string): Promise<void>;
  /**
   * Request cooperative shutdown of a teammate.
   * Sends a shutdown_request to the agent's mailbox.
   */
  requestShutdown(name: string): Promise<void>;
  /**
   * Consume the messages teammates have sent to the leader since the
   * last poll / call, in arrival order. Marks them read so the inbox
   * file compacts (`writeMessage` drops read entries past the retention
   * window) — the `read` flag is the high-water mark, so there is no
   * array index for compaction to shift a message out from under.
   * task_list and pollLeaderInbox both drain through here, and
   * `consumeUnread` is atomic per inbox, so they can't double-deliver.
   */
  getLeaderMessages(): Promise<
    Array<{
      from: string;
      text: string;
      timestamp: string;
    }>
  >;
  /**
   * Drain the leader's unread inbox, marking the drained messages read.
   *
   * The 500ms poll runs continuously while teammates are alive, so the
   * common "nothing new" case stays lockless: a tmp+rename write lets
   * `readInbox` observe a consistent snapshot without paying
   * lock-contention cost on the hot path. Only when that snapshot
   * actually shows unread messages do we take the file lock to consume
   * and mark them read atomically (so a concurrent writer or the other
   * reader can't clobber or double-deliver). On a corrupt / unreadable
   * inbox the file is quarantined and an empty batch returned.
   */
  private consumeLeaderInbox;
  /**
   * Quarantine a corrupt / unreadable leader inbox to `.corrupt-{ts}`
   * so a fresh inbox can replace it, and return an empty batch for this
   * read. `readInbox` already maps the legitimate "no inbox yet" case
   * (ENOENT) to [], so anything throwing past it is real corruption.
   */
  private quarantineLeaderInbox;
  /**
   * Register the callback that delivers teammate messages
   * to the leader's conversation. Called by the CLI layer.
   * Pass `null` to detach a previously-installed callback.
   */
  setLeaderMessageCallback(
    cb: ((message: string, display: string) => void) | null,
  ): void;
  requestPlanApproval(
    request: TeamPlanApprovalRequest,
  ): Promise<TeamPlanApprovalDecision>;
  resolvePlanApprovalRequest(
    requestId: string,
    decision: TeamPlanApprovalDecision,
  ): void;
  /**
   * Start polling the leader inbox (idempotent).
   * Called automatically when the first teammate is spawned.
   */
  private ensureLeaderInboxPolling;
  /**
   * Stop polling the leader inbox.
   */
  stopLeaderInboxPolling(): void;
  /**
   * Force a one-shot inbox drain. Used by callers that need to
   * synchronously flush any messages a teammate wrote between
   * the last 500ms poll and a decision to exit (otherwise the
   * final teammate message can be lost when the teammate writes
   * to disk and immediately goes IDLE).
   */
  drainLeaderInbox(): Promise<void>;
  /**
   * Check for new leader inbox messages and deliver them.
   */
  private pollLeaderInbox;
  /**
   * Wrap teammate-to-leader messages in a stable `<teammate_message>`
   * envelope. Forgery is prevented structurally rather than by a
   * secret: {@link TeamManager.escapeEnvelopeTags} defangs any copy of
   * the delimiter a teammate embeds in its own body, so it cannot break
   * out and inject a forged envelope (e.g. one claiming `from="leader"`)
   * into the leader's conversation. A stable tag has nothing to leak —
   * unlike the per-session nonce this replaced, which the leader model
   * could echo back to a teammate, who could then forge the delimiter.
   *
   * Exposed so any path that surfaces teammate text to the leader
   * (`pollLeaderInbox`, `task_list`, ...) shares the same anti-spoofing
   * framing instead of each one re-implementing it.
   */
  formatLeaderEnvelope(
    messages: ReadonlyArray<{
      from: string;
      text: string;
    }>,
  ): string[];
  /**
   * Defang any `<teammate_message …>` / `</teammate_message>` delimiter
   * embedded in untrusted teammate text by escaping the opening `<` to
   * `&lt;`, so the teammate cannot break out of its envelope and inject
   * a forged one. Only the `<` that begins the delimiter token is
   * touched (see {@link LEADER_ENVELOPE_TAG_RE}); every other angle
   * bracket — code, comparisons in reports — is left intact.
   */
  private static escapeEnvelopeTags;
  private formatPlanApprovalEnvelope;
  /**
   * Build a compact, one-line summary of a batch of teammate→leader
   * messages for the leader's UI. The full `formatLeaderEnvelope` text
   * still goes to the model; this is the short line the user sees in
   * its place (rendered as a `●` notification), so the conversation
   * isn't flooded with the entire raw report.
   *
   * Uses each message's `summary` when the teammate provided one, else
   * a "{name} reported back" fallback. Names are wrapped in `**` so the
   * UI's inline-markdown renderer bolds them. Kept separate from
   * `formatLeaderEnvelope` so the model payload and the on-screen line
   * can diverge.
   */
  formatLeaderDisplay(
    messages: ReadonlyArray<{
      from: string;
      summary?: string;
    }>,
  ): string;
  /**
   * Returns true if any teammate is still actively working or
   * has pending messages/tasks to process. An IDLE teammate
   * with an empty queue is not considered active — it has
   * finished its current work and is waiting to be re-engaged.
   */
  hasActiveTeammates(): boolean;
  /**
   * Returns true when all teammates have reached a
   * terminal status (COMPLETED, FAILED, CANCELLED).
   * Unlike hasActiveTeammates(), this does NOT treat idle
   * teammates as terminated — they are still alive and
   * can receive messages, so inbox polling must continue.
   */
  allTeammatesTerminated(): boolean;
  /**
   * Returns a promise that resolves when either:
   * - A teammate message is delivered via the callback,
   * - All teammates have reached terminal status, or
   * - The timeout fires (default 120s).
   *
   * Returns the reason it resolved so the caller can
   * decide whether to inject a status summary.
   */
  waitForTeammateActivity(
    timeoutMs?: number,
    signal?: AbortSignal,
  ): Promise<'message' | 'terminated' | 'timeout' | 'aborted'>;
  /**
   * Build a human-readable status summary of all teammates.
   * Injected into the leader's conversation on wait timeout.
   */
  /** Seconds of inactivity before a teammate is considered stalled. */
  private static readonly STALL_THRESHOLD_S;
  buildTeamStatusSummary(): string;
  /**
   * Returns true if all non-terminal teammates are stalled
   * (no activity for STALL_THRESHOLD_S seconds).
   */
  allRemainingStalled(): boolean;
  /**
   * Abort all teammates that have been stalled for longer
   * than the stall threshold. This transitions them from
   * RUNNING to CANCELLED so the leader can exit.
   */
  abortStalledTeammates(): void;
  getTeamFile(): TeamFile;
  getBackend(): Backend;
  getEventEmitter(): TeamEventEmitter;
  /** Mark that a shutdown has been requested for `name` so the
   *  mailbox is checked on its next idle transition. Used by tests
   *  that inject the structured shutdown message directly without
   *  going through `requestShutdown`. */
  markShutdownRequested(name: string): void;
  /**
   * Get an agent object from the backend by agent ID.
   * Returns undefined for backends that don't expose in-process
   * agent handles (e.g. tmux/iTerm2).
   */
  getAgentFromBackend(agentId: string): TeamAgentHandle | undefined;
  /**
   * Run a fire-and-forget coordination task, logging any rejection
   * instead of letting it surface as an unhandled promise rejection.
   * These paths (message flush, task auto-claim, task unassign) hit
   * file locks and disk I/O that can reject on corrupt files, EACCES,
   * or lock exhaustion. Without this guard a rejection would crash the
   * process (or trip the shared-token-manager's unhandledRejection
   * handler) and bury the cause off stderr — observed as a teammate
   * silently hanging or a task stuck in_progress with no trail.
   *
   * Beyond the debug log (which is off in production), a concise notice
   * is also injected into the leader's conversation when a callback is
   * attached, so these otherwise-silent coordination failures are at
   * least observable to the leader driving the team.
   */
  private fireAndForget;
  cleanup(): Promise<void>;
  /**
   * Set up event bridge for a single agent.
   * Subscribes to STATUS_CHANGE to drive idle detection,
   * message flushing, and auto task claiming.
   */
  private setupEventBridge;
  /**
   * Emit a team-level approval event so the CLI (or any
   * other host) can route it through its own permission
   * channel (e.g. stream-json control requests, local
   * approval mode check). If nobody handles the event the
   * tool will remain blocked until the agent's stall timeout.
   */
  private emitTeammateApprovalRequest;
  /**
   * Flush the next highest-priority message to an agent.
   * Priority: shutdown (mailbox) > leader > peer > auto-claim.
   */
  private flushNextMessage;
  /**
   * Enqueue a message within the agent's teammate identity so
   * that the resulting runLoop executes inside the correct
   * AsyncLocalStorage context.
   */
  private enqueueWithIdentity;
  /**
   * Try to claim the next pending task for an agent.
   *
   * `pending` may be passed in by `scanIdleAgentsForTasks` to share
   * a single `listTasks` call across all idle teammates; if omitted
   * the task list is fetched directly.
   */
  private tryAutoClaimTask;
  /**
   * Scan all idle agents and try to auto-claim tasks.
   * Called when task list changes. Shares a single listTasks
   * call and runs claims concurrently.
   */
  private scanIdleAgentsForTasks;
  private clearPlanApprovalRequest;
  private rejectPlanApprovalRequest;
  private rejectPendingPlanApprovalsForTeammate;
  private rejectAllPlanApprovalRequests;
  private logRejectedPlanApprovalRequest;
  /**
   * Determine message priority from the sender name.
   */
  private getSenderPriority;
}
