import { ChannelBase } from '@qwen-code/channel-base';
import { DingtalkInteractiveCardClient } from './interactive-card-client.js';
import { type DingtalkCardCallback, type DingtalkCardCallbackResult } from './interactive-card-types.js';
import type { ChannelConfig, ChannelBaseOptions, Envelope, ChannelAgentBridge, ChannelOutputSegmentContext, ChannelOutputSegmentEndReason, ChannelTaskLifecycleEvent, ChannelUserInputRequestContext, SessionTarget, UserInputPresentationResult } from '@qwen-code/channel-base';
export declare class DingtalkChannel extends ChannelBase {
    private client;
    private readonly atSender;
    private connectionManager?;
    private seenMessages;
    private mentionTargets;
    private sessionMentionTargets;
    private bufferedMentionTargets;
    private bufferedMentionTargetsBySession;
    private dedupTimer?;
    /** Map conversationId → latest sessionWebhook URL for sending replies. */
    private webhooks;
    private activeReactionKeys;
    /** sessionId → reaction keys, so a dead session's reactions can be recalled. */
    private sessionReactionKeys;
    /**
     * Real inbound message ids (insertion-ordered, size-capped). Unlike the
     * TTL-swept seenMessages dedup map, entries survive long queue waits, so a
     * turn that starts minutes after its message arrived still gets a reaction.
     */
    private inboundMessageIds;
    /**
     * Token cache for proactive sends. The stream SDK only refreshes its token
     * on (re)connect, so a long-lived socket serves a stale one after ~2h.
     */
    private proactiveToken?;
    private readonly interactiveCardConfig;
    protected readonly interactiveCardClient?: DingtalkInteractiveCardClient;
    private statusCardController?;
    private questionCardController?;
    private interactionPresenter?;
    private readonly inboundCardOwners;
    private readonly cardRunBySession;
    private readonly cardRuns;
    constructor(name: string, config: ChannelConfig, bridge: ChannelAgentBridge, options?: ChannelBaseOptions);
    private createClient;
    private installStructuredDownstreamHandler;
    private registerMessageHandler;
    private onCardCallback;
    protected routeCardCallback(callback: DingtalkCardCallback): DingtalkCardCallbackResult;
    private onDownStream;
    private callDownStreamHandler;
    private decodeDownStream;
    connect(): Promise<void>;
    /**
     * A group message with no conversationId can't be routed to a stable shared
     * session (chatId would fall back to the expiring sessionWebhook), so it is
     * dropped on ingestion. Exposed for testing the drop rule.
     */
    static isUnroutableGroupMessage(isGroup: boolean, conversationId: string | undefined): boolean;
    private prepareOutgoingText;
    private sendReply;
    sendMessage(chatId: string, text: string): Promise<void>;
    supportsProactiveSend(): boolean;
    protected supportsProactiveTarget(target: SessionTarget): boolean;
    protected supportsProactiveDeliveryTarget(target: SessionTarget): boolean;
    protected supportsProactiveWebhookTarget(target: SessionTarget): boolean;
    /**
     * Single-shot cold send: a failed chunk aborts the remainder (already-sent
     * chunks are not recalled) and the error surfaces in the loop's lastError.
     */
    protected pushProactive(target: SessionTarget, text: string): Promise<void>;
    private getProactiveToken;
    private sendCardInteractionFeedback;
    private sendProactiveChunk;
    private getAccessToken;
    private emotionApi;
    private attachReaction;
    private recallReaction;
    disconnect(): void;
    /** Stable API targets are conversation or user IDs, never webhook URLs. */
    private isStableTargetId;
    private reactionKey;
    private rememberInboundMessageId;
    private logReactionFailure;
    private startReaction;
    private stopReaction;
    /** Recall reactions left behind when a session dies without terminal lifecycle events. */
    onSessionDied(sessionId: string): void;
    protected onTaskLifecycle(event: ChannelTaskLifecycleEvent): void;
    protected onPromptBufferDropped(_chatId: string, sessionId: string, messageIds: string[]): void;
    protected onPromptBufferDrained(_chatId: string, sessionId: string, messageIds: string[]): void;
    protected onPromptBuffered(_chatId: string, sessionId: string, messageId?: string): void;
    protected onPromptStart(chatId: string, sessionId: string, messageId?: string): void;
    handleInbound(envelope: Envelope): Promise<void>;
    protected processInbound(envelope: Envelope): Promise<void>;
    private untrackBufferedMentionTarget;
    protected onPromptEnd(chatId: string, sessionId: string, messageId?: string): void;
    protected sendResponseMessage(chatId: string, text: string, sessionId: string): Promise<void>;
    private sendFallbackReply;
    protected onResponseComplete(chatId: string, text: string, sessionId: string, segment?: ChannelOutputSegmentContext): Promise<void>;
    protected onOutputSegmentEnd(_chatId: string, _sessionId: string, segment: ChannelOutputSegmentContext, reason: ChannelOutputSegmentEndReason): void | Promise<void>;
    protected onResponseChunk(_chatId: string, chunk: string, _sessionId: string, segment?: ChannelOutputSegmentContext): void;
    protected presentUserInputRequest(context: ChannelUserInputRequestContext): Promise<UserInputPresentationResult>;
    /**
     * Extract quoted/referenced message context from a reply.
     * DingTalk provides this via text.repliedMsg (newer) or quoteMessage (legacy).
     */
    private extractQuotedContext;
    /**
     * Build a text summary from a repliedMsg, handling text, richText, and
     * media message types with placeholders.
     */
    private summarizeRepliedContent;
    /**
     * Extract text and media download codes from an incoming DingTalk message.
     * Handles text, richText, picture, file, audio, and video message types.
     */
    private extractContent;
    /**
     * Download a media file and attach it to the envelope.
     * Images → base64 in envelope; files → saved to temp dir with path in text.
     */
    private attachMedia;
    private onMessage;
}
