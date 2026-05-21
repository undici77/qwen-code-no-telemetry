import { ChannelBase } from '@qwen-code/channel-base';
import type { ChannelConfig, ChannelBaseOptions, AcpBridge } from '@qwen-code/channel-base';
export declare class DingtalkChannel extends ChannelBase {
    private client;
    private seenMessages;
    private dedupTimer?;
    /** Map conversationId → latest sessionWebhook URL for sending replies. */
    private webhooks;
    constructor(name: string, config: ChannelConfig, bridge: AcpBridge, options?: ChannelBaseOptions);
    connect(): Promise<void>;
    sendMessage(chatId: string, text: string): Promise<void>;
    private getAccessToken;
    private emotionApi;
    private attachReaction;
    private recallReaction;
    disconnect(): void;
    /**
     * The chatId passed to onPromptStart/onPromptEnd is `conversationId ||
     * sessionWebhook` (see message handler below). Reactions require a real
     * conversation ID — skip the webhook-URL fallback case.
     */
    private isConversationId;
    protected onPromptStart(chatId: string, _sessionId: string, messageId?: string): void;
    protected onPromptEnd(chatId: string, _sessionId: string, messageId?: string): void;
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
