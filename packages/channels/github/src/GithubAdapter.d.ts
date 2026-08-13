import type { ChannelAgentBridge, ChannelBaseOptions, ChannelConfig, ChannelTaskLifecycleEvent } from '@qwen-code/channel-base';
import { PollingChannelBase } from '@qwen-code/channel-base';
interface GithubConfig extends ChannelConfig {
    baseUrl?: string;
    reasonFilter?: unknown;
    useLocalGh?: boolean;
}
interface GithubCursor {
    lastProcessedAt: string;
    metaFloor?: string;
    /**
     * Thread keys (`chatId|threadId`) whose issue/PR body has already been fed as
     * a first-contact trigger. Dedupes body dispatch when a thread is re-fetched
     * with `last_read_at` still null — which happens if `markNotificationsAsRead`
     * failed to mark it read (its `updated_at` was bumped past the cutoff between
     * fetch and mark). Bounded to the most recent entries so the cursor stays small.
     */
    dispatchedBodies?: string[];
    /** Comment node IDs already accepted by the channel. */
    dispatchedComments?: string[];
    /** Direct-action event node IDs already accepted by the channel. */
    dispatchedEvents?: string[];
}
interface PublicationAuditRecord {
    at: string;
    type: 'github_publication';
    outcome: 'posted' | 'suppressed' | 'failed' | 'posting';
    channel: string;
    triggerKind?: string;
    repository: string;
    number?: number;
    sessionId: string;
    sourceMessageId?: string;
    actor?: string;
    threadId?: string;
    pendingId?: string;
    commentId?: number;
    commentUrl?: string;
    failurePhase?: 'delivery';
    failureError?: string;
    bodySha256: string;
    bodyChars: number;
}
export declare class GithubChannel extends PollingChannelBase<GithubCursor> {
    private octokit;
    private botUsername;
    private webOrigin;
    private readonly activeReactions;
    private readonly reactionsPendingRemoval;
    private pendingFinalDeliveryRetry;
    private pendingFinalDeliveryRetryAbort;
    private pendingFinalDeliveryRequestsActive;
    private pendingFinalDeliveryRetryStopRequested;
    private reasonFilter;
    private inboundRecoveryPending;
    private recoverableInboundTasks;
    private activeInboundTaskIdsByMessage;
    private cancelledInboundTaskIds;
    private pendingCursorUpdatedAt;
    private inboundPersistenceBlocked;
    constructor(name: string, config: GithubConfig & Record<string, unknown>, bridge: ChannelAgentBridge, options?: ChannelBaseOptions);
    protected createInitialCursor(): GithubCursor;
    protected validateCursor(parsed: unknown): GithubCursor | null;
    connect(): Promise<void>;
    disconnect(): void;
    sendMessage(_chatId: string, _text: string): Promise<void>;
    protected sendThreadMessage(chatId: string, threadId: string | undefined, text: string): Promise<void>;
    protected sendResponseMessage(chatId: string, text: string, sessionId: string): Promise<void>;
    protected publishFinalResponse(chatId: string, threadId: string | undefined, fullText: string, sessionId: string): Promise<void>;
    private buildPublicationAuditBase;
    private enqueuePendingFinalDelivery;
    private retryPendingFinalDeliveries;
    private hasPostedPublicationAudit;
    private updatePendingFinalDeliveries;
    private removeReplyPendingInboundTask;
    private pendingFinalDeliveriesPath;
    private readPendingFinalDeliveries;
    private writePendingFinalDeliveries;
    private createIssueComment;
    /**
     * Adds GitHub's eyes reaction to accepted comment prompts, then removes it
     * when the prompt ends. Both operations are best-effort and never block the
     * agent response.
     */
    protected onPromptStart(chatId: string, _sessionId: string, messageId?: string): void;
    protected onPromptEnd(chatId: string, _sessionId: string, messageId?: string): void;
    private reactionKey;
    private removeReaction;
    protected pollOnce(): Promise<void>;
    private processCommentLane;
    private processDirectLane;
    private processAggregateLane;
    private findDirectTrigger;
    private fetchNewComments;
    private fetchIssueMeta;
    private fetchPrMeta;
    private tryFirstContactBody;
    private recordDispatchedBody;
    private recordDispatchedComment;
    private recordDispatched;
    private dispatchEnvelope;
    private claimInboundTask;
    private runInboundTask;
    private recoverInboundTasks;
    private isRecoverableInboundTask;
    private hasRecoverableInboundTasks;
    private hasPendingFinalDeliveryForTask;
    private inboundTaskSourceKey;
    private readPublicationAuditKeys;
    private applyTaskDedupe;
    private transitionInboundTask;
    private removeInboundTask;
    private updateInboundTasks;
    private inboundTasksPath;
    private readInboundTasks;
    private writeInboundTasks;
    private inboundMessageKey;
    protected onTaskLifecycle(event: ChannelTaskLifecycleEvent): void;
    protected recordPublicationAudit(record: PublicationAuditRecord): void;
    private migrateLegacyPublicationState;
    private channelFilePath;
    private extractFromSubjectUrl;
    private buildMetadata;
    private buildRouteMetadata;
    private githubApi;
    private sleepForRetry;
    private markNotificationsAsRead;
    private postErrorComment;
}
export {};
