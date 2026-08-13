import type { ChannelConfig, ChannelMemoryCallbacks, ChannelMemoryIntentClassifier, ChannelOutputSegmentContext, ChannelOutputSegmentEndReason, ChannelProactiveTarget, ChannelRuntimeIdentity, ChannelRuntimeMemoryScope, ChannelTaskLifecycleEvent, ChannelUserInputRequestContext, Envelope, ObservedChannelContactGraph, ObservedChannelContactObservation, SessionTarget, UserInputPresentationResult } from './types.js';
import { GroupGate } from './GroupGate.js';
import { DmGate } from './DmGate.js';
import { SenderGate } from './SenderGate.js';
import type { CreatePairingRequestResult } from './PairingStore.js';
import { SessionRouter } from './SessionRouter.js';
import type { ChannelAgentBridge, PermissionRequestEvent, PermissionResolvedEvent, ToolCallEvent } from './ChannelAgentBridge.js';
import type { ChannelLoop, ChannelLoopInput } from './ChannelLoopStore.js';
import type { ChannelWebhookRunOptions, ChannelWebhookTask } from './ChannelWebhookTask.js';
/**
 * Max time /clear waits for a cancelled in-flight turn to wind down before
 * purging anyway. A wedged ACP child (stuck tool call, not reading stdin, or
 * crashed without closing) can leave active.done unresolved forever; without
 * this bound /clear — and the whole channel — would hang. Safe because the
 * purge runs regardless and the generation is bumped, so a turn that settles
 * later is already invalidated.
 */
export declare const CLEAR_CANCEL_TIMEOUT_MS = 3000;
export type ChannelMemoryRecallCacheStatus = 'hit' | 'miss' | 'bypass';
export type ChannelMemoryRecallResult = 'selected' | 'empty' | 'stale' | 'read_error' | 'revision_unstable';
export interface ChannelMemoryRecallObservation {
    durationMs: number;
    selectedCount: number;
    cache: ChannelMemoryRecallCacheStatus;
    result: ChannelMemoryRecallResult;
}
export interface ChannelBaseOptions {
    router?: SessionRouter;
    proxy?: string;
    /** Adapter-owned persistent state directory. */
    stateDir?: string;
    channelMemory?: ChannelMemoryCallbacks;
    memoryIntentClassifier?: ChannelMemoryIntentClassifier;
    channelMemoryRecallObserver?: (observation: ChannelMemoryRecallObservation) => void;
    /**
     * Set when a channel owns a supplied router and should consume bridge
     * events directly.
     */
    registerBridgeEvents?: boolean;
    /** Return the active bridge recovery barrier, if recovery is in progress. */
    bridgeRecovery?: () => Promise<void> | undefined;
    groupHistoryPath?: string;
    loopController?: ChannelLoopController;
    observedContacts?: {
        observe(channelName: string, observation: ObservedChannelContactObservation): void | Promise<void>;
        /** Read persisted observations so adapters can hydrate label caches. */
        list?(): ObservedChannelContactGraph;
    };
}
export interface ChannelLoopController {
    create(input: ChannelLoopInput): Promise<ChannelLoop>;
    createForTarget?(input: ChannelLoopInput, maxEnabledLoops: number): Promise<ChannelLoop | undefined>;
    listForTarget(channelName: string, target: SessionTarget): Promise<ChannelLoop[]>;
    disable(id: string): Promise<boolean>;
    validateCron(cron: string): void;
    nextFireTime?(job: ChannelLoop): Date;
}
export interface ChannelLoopPromptOptions {
    timeoutMs?: number;
    shouldContinue?: () => Promise<boolean>;
}
/** Handler for a slash command. Return true if handled, false to forward to agent. */
type CommandHandler = (envelope: Envelope, args: string) => Promise<boolean>;
export declare abstract class ChannelBase {
    protected config: ChannelConfig;
    /**
     * Recovery invariant: session-resolution and prompt-capture paths must await
     * waitForBridgeRecovery() immediately before that operation.
     */
    protected bridge: ChannelAgentBridge;
    protected groupGate: GroupGate;
    protected dmGate: DmGate;
    protected gate: SenderGate;
    protected router: SessionRouter;
    protected name: string;
    /** Resolved (defaulted + frozen) identity/scope — adapters should read these, not raw config. */
    protected readonly identity: ChannelRuntimeIdentity;
    protected readonly memoryScope: ChannelRuntimeMemoryScope;
    /** Resolved proxy URL, available to subclasses for adapter-specific clients. */
    protected proxy?: string;
    /** Adapter-owned persistent state directory, when supplied by the runtime. */
    protected readonly stateDir?: string;
    private readonly channelMemory?;
    private readonly memoryIntentClassifier?;
    private readonly channelMemoryRecallObserver?;
    private groupHistory;
    private readonly groupPairingNotified;
    private readonly loopController?;
    private readonly observedContacts?;
    private readonly observedContactEnvelopes;
    private instructedSessions;
    private unattendedMemorySessions;
    private channelMemoryReads;
    private channelMemoryRecallCache;
    private commands;
    /** Per-session promise chain to serialize prompt + send (followup mode). */
    private sessionQueues;
    private readonly registerBridgeEvents;
    private readonly bridgeRecovery?;
    /**
     * Per-session generation, bumped by /clear. A queued followup turn captures the
     * generation when it enqueues and bails if /clear bumped it before the turn ran,
     * so a cleared session can't be resurrected by an already-queued prompt.
     */
    private sessionGenerations;
    private pendingChannelMemoryMutations;
    private pendingChannelMemoryMutationDeliveries;
    /** Per-session active prompt tracking for dispatch modes. */
    private activePrompts;
    /** Per-session message buffer for collect mode. */
    private collectBuffers;
    private readonly preflightedEnvelopes;
    private readonly bridgeToolCallListener;
    private readonly bridgeBackgroundResponseListener;
    private readonly bridgeSessionDiedListener;
    private readonly bridgePermissionRequestListener;
    private readonly bridgePermissionResolvedListener;
    private readonly pendingPermissions;
    private readonly pendingPermissionsByChat;
    private readonly channelLoopToolHandler;
    dispatchToolCall(event: ToolCallEvent): void;
    dispatchBackgroundResponse(sessionId: string, text: string): Promise<void>;
    dispatchPermissionRequest(event: PermissionRequestEvent): Promise<void>;
    private tryPresentUserInput;
    private normalizeUserQuestions;
    private respondToUserInput;
    private permissionTargetForEvent;
    dispatchPermissionResolved(event: PermissionResolvedEvent): void;
    constructor(name: string, config: ChannelConfig, bridge: ChannelAgentBridge, options?: ChannelBaseOptions);
    abstract connect(): Promise<void>;
    abstract sendMessage(chatId: string, text: string): Promise<void>;
    abstract disconnect(): void;
    /**
     * Thread-targeted delivery. Polling adapters override this to post comments
     * on a specific issue/PR. The default falls through to sendMessage(chatId,
     * text), ignoring threadId — existing IM adapters are behaviorally unchanged.
     */
    protected sendThreadMessage(chatId: string, _threadId: string | undefined, text: string): Promise<void>;
    /**
     * Adapter hook for task lifecycle events — the canonical way to track task
     * state (onPromptStart/onPromptEnd are retained for back-compat). The prompt
     * flow never awaits this hook; an async override's rejection is caught and
     * logged, nothing more.
     */
    protected onTaskLifecycle(_event: ChannelTaskLifecycleEvent): void | Promise<void>;
    protected presentUserInputRequest(_context: ChannelUserInputRequestContext): Promise<UserInputPresentationResult>;
    private emitTaskLifecycle;
    private logTaskLifecycleError;
    private lifecycleError;
    private emitTaskCancellation;
    private resolveIdentity;
    private resolveMemoryScope;
    deliverProactive(target: ChannelProactiveTarget, text: string): Promise<void>;
    /** Built once — identity/memoryScope are frozen at construction. */
    private boundaryPrompt?;
    private channelBoundaryPrompt;
    private shouldPrependChannelBoundaryPrompt;
    private lifecycleBase;
    private outputSegmentContext;
    private ensureOutputSegment;
    private closeOutputSegment;
    private notifyOutputSegmentEnd;
    supportsProactiveSend(): boolean;
    protected supportsProactiveTarget(target: SessionTarget): boolean;
    protected supportsProactiveDeliveryTarget(target: SessionTarget): boolean;
    protected supportsProactiveWebhookTarget(target: SessionTarget): boolean;
    protected pushProactive(target: SessionTarget, text: string): Promise<void>;
    protected pushProactiveDelivery(target: SessionTarget, text: string): Promise<void>;
    private prepareUnattendedSessionContext;
    private channelMemoryReadKey;
    private beginChannelMemoryRead;
    private releaseChannelMemoryRead;
    private getCachedChannelMemoryRecallIndex;
    private setCachedChannelMemoryRecallIndex;
    private selectRelevantChannelMemory;
    private observeChannelMemoryRecall;
    private drainCollectBufferForCurrentPrompt;
    /** Replace the bridge instance (used after crash recovery restart). */
    setBridge(bridge: ChannelAgentBridge): void;
    runLoopPrompt(job: ChannelLoop, options?: ChannelLoopPromptOptions): Promise<string | undefined>;
    validateWebhookTask(task: ChannelWebhookTask): void;
    private resolveWebhookTaskTarget;
    runWebhookTask(task: ChannelWebhookTask, options?: ChannelWebhookRunOptions): Promise<string | undefined>;
    private webhookRoutingThreadId;
    private runLoopBridgePrompt;
    private cancelTimedOutLoopPrompt;
    private discardRetiredSession;
    protected requestActivePromptCancellation(sessionId: string, reason?: 'cancel_command' | 'clear' | 'steer'): Promise<boolean>;
    protected requestPromptRunCancellation(sessionId: string, runId: string, reason?: 'cancel_command' | 'clear' | 'steer'): Promise<boolean>;
    private dropCollectBuffer;
    private notifyPromptBufferDrained;
    private collectBufferMessageIds;
    private logCancelSessionFailure;
    private settleCancelRequested;
    onToolCall(_chatId: string, _event: ToolCallEvent): void;
    onSessionDied(sessionId: string): void;
    private attachBridgeEvents;
    private detachBridgeEvents;
    /**
     * Called when a prompt actually begins processing (inside the session queue).
     * Override to show a platform-specific working indicator (e.g., typing, reaction).
     * Not called for buffered messages (collect mode) or gated/blocked messages.
     */
    protected onPromptStart(_chatId: string, _sessionId: string, _messageId?: string): void;
    protected onPromptBuffered(_chatId: string, _sessionId: string, _messageId?: string): void;
    protected onPromptBufferDrained(_chatId: string, _sessionId: string, _messageIds: string[]): void;
    protected onPromptBufferDropped(_chatId: string, _sessionId: string, _messageIds: string[]): void;
    /**
     * Called when a prompt finishes (response sent or cancelled).
     * Override to hide the working indicator.
     */
    protected onPromptEnd(_chatId: string, _sessionId: string, _messageId?: string): void;
    /**
     * Called for each text chunk as the agent streams its response.
     * Override to implement progressive display (e.g., updating an AI card in-place).
     * Default: no-op (chunks are collected internally and delivered via onResponseComplete).
     */
    protected onResponseChunk(_chatId: string, _chunk: string, _sessionId: string, _segment?: ChannelOutputSegmentContext): void;
    protected onOutputSegmentEnd(chatId: string, sessionId: string, _segment: ChannelOutputSegmentContext, reason: ChannelOutputSegmentEndReason): void | Promise<void>;
    /**
     * Called when the agent starts a new response segment for the same prompt.
     * Override to clear adapter-owned streaming buffers.
     */
    protected onResponseBoundary(_chatId: string, _sessionId: string): void | Promise<void>;
    protected sendResponseMessage(chatId: string, text: string, sessionId: string): Promise<void>;
    /**
     * Adapter hook for delivery-only metadata. The response delivery path can read
     * the active prompt while it exists; adapters must not retain its raw content.
     */
    protected getResponseMessageId(sessionId: string): string | undefined;
    protected getResponseSenderId(sessionId: string): string | undefined;
    protected getResponseMetadata(sessionId: string): string | undefined;
    /**
     * Returns the active prompt's response thread while it remains available for
     * adapter delivery. Falls back to the session target after prompt cleanup.
     */
    protected getResponseThreadId(sessionId: string): string | undefined;
    /**
     * Called when the agent's full response is ready.
     * Override to customize delivery (e.g., finalize an AI card).
     * Default: sends the full response text.
     */
    protected onResponseComplete(chatId: string, fullText: string, sessionId: string, _segment?: ChannelOutputSegmentContext): Promise<void>;
    /**
     * Register a slash command handler. Subclasses can call this to add
     * platform-specific commands (e.g., /start for Telegram).
     * Overrides shared commands if the same name is registered.
     */
    protected registerCommand(name: string, handler: CommandHandler): void;
    protected registerCancelCommand(name?: string): void;
    private permissionChatKey;
    private pendingPermissionIdsForChatKey;
    private removePendingPermission;
    private removePendingPermissionsForSession;
    private clearPendingPermissions;
    private settleUserInput;
    private userInputSettlementReason;
    private pendingPermissionForEnvelope;
    private canEnvelopeAnswerPendingPermission;
    private formatPermissionRequest;
    private approvalOptionId;
    private approvalAlwaysOption;
    private findScopedAlwaysOption;
    private approvalAlwaysLabel;
    private denialResponse;
    private handlePermissionResponseCommand;
    /** Register shared slash commands. Called from constructor. */
    private registerSharedCommands;
    private handleLoopCommand;
    private handleLoopAdd;
    private createLoopFromTool;
    private listLoopsFromTool;
    private cancelLoopFromTool;
    private handleLoopList;
    private handleLoopInspect;
    private formatLoopListLine;
    private lastLoopStatus;
    private formatNextFireTime;
    private handleLoopCancel;
    private loopTargetFromEnvelope;
    private normalizeLoopTarget;
    private loopToolTarget;
    private isStoredLoopTargetAuthorized;
    /** Check if a message text matches a registered local command. */
    protected isLocalCommand(text: string): boolean;
    private findActiveSessionId;
    private channelMemoryTarget;
    private formatChannelMemoryContext;
    private formatRelevantChannelMemoryContext;
    private shouldInjectChannelMemory;
    private invalidateUnattendedMemory;
    private dropQueuedTurnIfStale;
    private getChannelMemory;
    private entriesForChannelMemoryIds;
    private renderChannelMemoryCandidate;
    private renderChannelMemoryCandidates;
    private handleChannelMemoryIntent;
    private shouldClassifyChannelMemoryIntent;
    private channelMemoryPendingKey;
    private deliverPendingChannelMemoryMutation;
    private takePendingChannelMemoryMutation;
    private deletePendingChannelMemoryMutation;
    private classifyChannelMemoryIntent;
    private channelMemoryErrorMessage;
    private channelMemoryUserErrorMessage;
    private logChannelMemoryError;
    /**
     * Whether the resolved session is SHARED across senders. `single` collapses
     * the whole channel to one `__single__` session for EVERY sender — group OR
     * DM — so it is ALWAYS shared (even a DM maps to `__single__`). `thread` is
     * shared only in a group (a DM maps to the lone caller's own chat).
     * `chat_thread` is always shared: it scopes by chat+thread, and a thread
     * (issue/PR discussion) can carry multiple participants even outside a
     * group. `user` is per-sender, never shared. Drives both the
     * destructive-/clear confirm gate and the host-shell (`!`) gate.
     */
    private isSharedSession;
    private isSharedSessionTarget;
    /**
     * Whether `envelope.senderId` may act on the resolved session's destructive or
     * workspace-leaking commands (/clear, /who). A SHARED session with a non-empty
     * allowedUsers list is restricted to those members; a per-user session, or one
     * with no allowlist, is unrestricted. Shared verbatim by /clear and /who so the
     * gate can't drift; each caller sends its own rejection wording.
     */
    private isAuthorizedForSharedSession;
    private isAuthorizedForSharedSessionTarget;
    private isAuthorizedForSharedSessionToolCall;
    private toolCallerName;
    private stopActiveStreaming;
    /**
     * Cancel the active turn and wait (bounded) for it to wind down. Stops the
     * BlockStreamer so buffered text can't leak via the idle timer, then fires a
     * best-effort cancelSession (NOT awaited — a wedged child/daemon can leave the
     * request pending forever). Returns true if active.done settled first, false
     * if the CLEAR_CANCEL_TIMEOUT_MS bound won (the turn never wound down). Used by
     * /clear, which genuinely EVICTS the session and so must proceed even when the
     * turn is wedged. Steer no longer uses this: it best-effort cancels then chains
     * the new turn behind the old one (see handleInbound), so it never needs to
     * proceed past a still-active turn.
     */
    private cancelAndAwaitActive;
    /**
     * Parse a slash command from message text.
     * Returns { command, raw, args } or null if not a slash command. `command` is
     * lowercased for case-insensitive LOCAL dispatch (registerCommand lowercases the
     * names it stores); `raw` keeps the typed case so agent-command matching can be
     * CASE-SENSITIVE, mirroring the CLI's parseSlashCommand (`cmd.name === part`).
     */
    private parseCommand;
    /**
     * Whether `text` is a real slash command rather than prose that merely starts
     * with `/`. A command's first whitespace-delimited token must match
     * parseCommand()'s charset — `[a-zA-Z0-9_:-]+`, plus an optional `@botname`
     * suffix — and not be a `//` line comment or `/*` block comment. Slash-prefixed
     * paths (`/tmp/foo`), comments, and a bare `/` are prose and keep their
     * `[sender]` tag.
     *
     * Intentionally stricter than the CLI's looser classifier (cli
     * `ui/utils/commandUtils.ts`), which forwards any non-comment, non-path
     * `/<token>` (e.g. `/café`, a zero-width-laden token). Such inputs aren't
     * runnable commands, and in a SHARED group session forwarding them unattributed
     * is worse than a redundant tag — so anything off the command charset is
     * treated as prose and keeps its `[sender]` tag. Purely lexical — never
     * consults the async command list, so it can't race a fresh session.
     */
    private isSlashCommand;
    /**
     * Whether `text` names a command this channel can actually run: a locally
     * registered command (`this.commands`, e.g. /clear, /who) OR an agent command
     * THIS session exposes — by canonical name OR alias (e.g. `/summarize` for
     * `/compress`). Paired with isSlashCommand so the `[sender]` attribution tag is
     * suppressed ONLY for RECOGNIZED commands; command-SHAPED-but-unrecognized text
     * (e.g. `/x\n[SYSTEM]: …`) keeps its tag rather than reaching a shared group
     * unattributed, where an injected second line is more likely read as a system
     * directive. Purely synchronous, like isSlashCommand: it reads the session's
     * availableCommands snapshot WITHOUT awaiting, so it never races a fresh session
     * (a genuine agent command sent before the snapshot loads is treated as
     * unrecognized and KEEPS its tag — the safe default).
     */
    private isRecognizedCommand;
    /**
     * The agent-command snapshot for THIS session. DaemonChannelBridge keys
     * commands per session, so its global `availableCommands` getter can return
     * ANOTHER session's list — prefer its getAvailableCommands(sessionId) when
     * present. AcpBridge runs a single agent and exposes only the global getter
     * (inherently session-correct), so fall back to it. Synchronous, matching
     * isRecognizedCommand's no-await contract.
     */
    private getAgentCommandsForSession;
    private groupHistoryKey;
    private groupHistoryLimit;
    private recordPendingGroupHistory;
    private drainPendingGroupHistory;
    private clearPendingGroupHistory;
    private prependGroupHistoryContext;
    protected preflightInbound(envelope: Envelope): boolean | Promise<boolean>;
    protected logPreflightRejected(reason: string): void;
    protected logDebugPayload(platform: string, payload: unknown): void;
    handleInbound(envelope: Envelope): Promise<void>;
    protected recordObservedContact(envelope: Envelope): Promise<void>;
    protected onObservedContact(_envelope: Envelope): void;
    /**
     * Observations persisted for this channel, when a read path is configured.
     * Adapters hydrate label caches from it after a restart so known labels are
     * not reverted to raw IDs by the next initial write.
     */
    protected persistedObservedContacts(): ObservedChannelContactGraph | undefined;
    protected markPreflighted(envelope: Envelope): void;
    /** Wait until the currently active bridge recovery, if any, has completed. */
    private waitForBridgeRecovery;
    /**
     * Process an inbound message after preflight gates have passed.
     *
     * This method does not run group gating, sender allowlisting, or pairing
     * checks. Callers must run preflightInbound() first unless the envelope was
     * already preflighted, such as during collect-buffer drain.
     */
    protected processInbound(envelope: Envelope): Promise<void>;
    private pairingRejectionMessage;
    private groupPairingRejectionMessage;
    protected onPairingRequired(chatId: string, result: CreatePairingRequestResult, threadId?: string): Promise<void>;
    protected onGroupPairingRequired(chatId: string, result: CreatePairingRequestResult, threadId?: string): Promise<void>;
}
export {};
