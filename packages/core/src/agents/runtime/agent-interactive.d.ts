/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AgentEventEmitter } from './agent-events.js';
import type { AgentStatsSummary } from './agent-statistics.js';
import type { AgentCore } from './agent-core.js';
import type { ContextState } from './agent-headless.js';
import {
  type ToolCallConfirmationDetails,
  type ToolResultDisplay,
} from '../../tools/tools.js';
import {
  AgentStatus,
  type AgentInteractiveConfig,
  type AgentMessage,
} from './agent-types.js';
/**
 * AgentInteractive — persistent interactive agent that processes
 * messages on demand.
 *
 * Three-level cancellation:
 * - `cancelCurrentRound()` — abort the current reasoning loop only
 * - `shutdown()` — graceful: stop accepting messages, wait for cycle
 * - `abort()` — immediate: master abort, set cancelled
 */
export declare class AgentInteractive {
  readonly config: AgentInteractiveConfig;
  private readonly core;
  private readonly queue;
  /**
   * This agent's nesting depth, captured from the spawner's ambient frame at
   * construction (0 when spawned from the top-level session). start() and
   * runLoop() re-enter the agent identity frame pinned at this depth, so
   * prepareTools()' depth gating and the AgentTool's runtime guards see an
   * in-process interactive agent (Arena, in-process teammate) as an agent —
   * not as the top-level session. Pinning (rather than auto-increment)
   * matters because runLoop() restarts itself from its own finally block and
   * enqueueMessage() may be called from arbitrary chains.
   */
  private readonly agentDepth;
  private status;
  private error;
  private lastRoundError;
  private executionPromise;
  private masterAbortController;
  private roundAbortController;
  private chat;
  private toolsList;
  private processing;
  private roundCancelledByUser;
  private readonly executionStartTimes;
  constructor(config: AgentInteractiveConfig, core: AgentCore);
  /**
   * Start the agent. Initializes the chat session, then kicks off
   * processing if an initialTask is configured. Runs inside this agent's
   * identity frame so prepareTools() depth-gates the AgentTool correctly
   * (see agentDepth).
   */
  start(context: ContextState): Promise<void>;
  private startInner;
  /**
   * Run loop: process all pending messages, then settle status.
   * Exits when the queue is empty or the agent is aborted. Runs inside this
   * agent's identity frame (pinned at agentDepth) so tool bodies — including
   * a nested `agent` spawn and its depth guard — attribute to this agent
   * rather than the top-level session.
   */
  private runLoop;
  private runLoopInner;
  /**
   * Run a single reasoning round for one message.
   * Creates a per-round AbortController so cancellation is scoped.
   */
  private runOneRound;
  /**
   * Cancel only the current reasoning round.
   * Adds a visible "cancelled" info message and clears pending approvals.
   */
  cancelCurrentRound(): void;
  /**
   * Graceful shutdown: stop accepting messages and wait for current
   * processing to finish.
   */
  shutdown(): Promise<void>;
  /**
   * Immediate abort: cancel everything and set status to cancelled.
   */
  abort(): void;
  /**
   * Enqueue a message for the agent to process.
   */
  enqueueMessage(message: string): void;
  getMessages(): readonly AgentMessage[];
  getStatus(): AgentStatus;
  getError(): string | undefined;
  getLastRoundError(): string | undefined;
  getStats(): AgentStatsSummary;
  /** The prompt token count from the most recent model call. */
  getLastPromptTokenCount(): number;
  getCore(): AgentCore;
  getEventEmitter(): AgentEventEmitter;
  /**
   * Returns tool calls currently awaiting user approval.
   * Keyed by callId → full ToolCallConfirmationDetails (with onConfirm).
   * The UI reads this to render confirmation dialogs inside ToolGroupMessage.
   */
  getPendingApprovals(): ReadonlyMap<string, ToolCallConfirmationDetails>;
  /**
   * Returns live output for currently-executing tools.
   * Keyed by callId → latest ToolResultDisplay (replaces on each update).
   * Entries are cleared when TOOL_RESULT arrives for the call.
   */
  getLiveOutputs(): ReadonlyMap<string, ToolResultDisplay>;
  /**
   * Returns PTY PIDs for currently-executing interactive shell tools.
   * Keyed by callId → PID. Populated from TOOL_OUTPUT_UPDATE when pid is
   * present; cleared when TOOL_RESULT arrives. The UI uses this to enable
   * interactive shell input via HistoryItemDisplay's activeShellPtyId prop.
   */
  getShellPids(): ReadonlyMap<string, number>;
  /**
   * Returns wall-clock start timestamps (ms since epoch) for currently-
   * executing tools, from the scheduler's `→ executing` transition.
   * Keyed by callId; entries are cleared when TOOL_RESULT arrives. The UI
   * uses this to render an elapsed-time indicator that excludes approval
   * and scheduling wait.
   */
  getExecutionStartTimes(): ReadonlyMap<string, number>;
  /**
   * Wait for the run loop to finish (used by InProcessBackend).
   */
  waitForCompletion(): Promise<void>;
  private startRunLoop;
  /**
   * Settle status after the run loop empties.
   * On success → IDLE (agent stays alive for follow-up messages).
   * On error → FAILED (terminal).
   */
  private settleRoundStatus;
  private setStatus;
  private addMessage;
  /**
   * Wraps TOOL_WAITING_APPROVAL's onConfirm so a Cancel outcome aborts
   * the current round (headless agents bypass this path entirely).
   * Core already owns the message / live-output / shell-PID listeners.
   */
  private setupEventListeners;
}
