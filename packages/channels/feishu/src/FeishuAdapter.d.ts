import { ChannelBase } from '@qwen-code/channel-base';
import type {
  ChannelConfig,
  ChannelBaseOptions,
  Envelope,
  ChannelAgentBridge,
  ChannelOutputSegmentContext,
  ChannelOutputSegmentEndReason,
  ChannelUserInputRequestContext,
  UserInputPresentationResult,
  ChannelTaskLifecycleEvent,
  SessionTarget,
} from '@qwen-code/channel-base';
export declare class FeishuChannel extends ChannelBase {
  private eventDispatcher;
  private wsClient?;
  private httpServer?;
  private seenMessages;
  private dedupTimer?;
  /** Card state keyed by inbound messageId (unique per request). */
  private cardSessions;
  /** Map sessionId → inbound messageId, set in onPromptStart. */
  private sessionToInboundMsg;
  /** Question title keyed by inbound messageId. */
  private msgToQuestion;
  /** Sender @tag keyed by inbound messageId. */
  private msgToSenderName;
  /** Sender open_id keyed by inbound messageId — for stop-button auth in group chats. */
  private msgToSenderId;
  /** Tracks messages that were stopped. Cleaned up by onResponseComplete, onPromptEnd, stale timer, and disconnect. */
  private stoppedMessages;
  private botOpenId?;
  private tokenCache?;
  private tokenRefreshPromise?;
  private questionCardController;
  private tokenRefreshHasCoreWaiters;
  private readonly observedUserNames;
  private readonly observedChatNames;
  private readonly observedUserLookups;
  private readonly observedChatLookups;
  private readonly observedContactWrites;
  private hydratedObservedNames;
  private collapsible;
  private collapsibleThreshold;
  constructor(
    name: string,
    config: ChannelConfig,
    bridge: ChannelAgentBridge,
    options?: ChannelBaseOptions,
  );
  supportsProactiveSend(): boolean;
  /** Build the event handler map shared between WebSocket and webhook modes. */
  private buildHandlerMap;
  connect(): Promise<void>;
  private connectWebSocket;
  private connectWebhook;
  private fetchBotInfo;
  /**
   * Fetch the content of a message by ID.
   * For interactive cards, extracts markdown text from card elements.
   */
  private fetchMessageContent;
  /**
   * Extract text content from a Feishu interactive card JSON structure.
   * Supports both v2 format ({ schema, body: { elements } }) and
   * v1/API-returned format ({ title, elements: [[...]] }).
   */
  private extractCardText;
  private getTenantAccessToken;
  private refreshToken;
  private hydrateObservedNames;
  /** Evicts the oldest-inserted entries once a runtime cache exceeds the cap. */
  private capObservedCache;
  private observedUserName;
  private observedChatName;
  private observedNameLookup;
  protected onObservedContact(envelope: Envelope): void;
  private observedContactKey;
  private enrichObservedContact;
  sendMessage(chatId: string, text: string): Promise<void>;
  protected pushProactive(target: SessionTarget, text: string): Promise<void>;
  protected pushProactiveDelivery(
    target: SessionTarget,
    text: string,
  ): Promise<void>;
  private sendMessageInternal;
  private sendInteractiveCard;
  private patchInteractiveCard;
  private createStreamingCard;
  private updateCard;
  protected presentUserInputRequest(
    context: ChannelUserInputRequestContext,
  ): Promise<UserInputPresentationResult>;
  /** Delete a card message from Feishu to prevent orphaned "思考中..." cards. */
  private deleteCard;
  protected onResponseChunk(
    chatId: string,
    chunk: string,
    sessionId: string,
  ): void;
  /** Runs one throttled streaming PATCH, then re-runs once when timer fires
   *  coalesced behind it (`updateQueued`) so the latest buffer still goes out.
   *  `pendingUpdatePromise` covers the whole chain so finalization can drain
   *  every in-flight update before sending the final patch. */
  private runThrottledCardUpdate;
  protected onResponseBoundary(_chatId: string, sessionId: string): void;
  protected onOutputSegmentEnd(
    chatId: string,
    sessionId: string,
    _segment: ChannelOutputSegmentContext,
    reason: ChannelOutputSegmentEndReason,
  ): Promise<void>;
  private endOutputCardBeforeInputRequest;
  private isKnownInboundMessageId;
  private knownInboundMessageId;
  private statusLabelFor;
  private stopLabelFor;
  private finalizeStoppedCardUpdate;
  protected onTaskLifecycle(event: ChannelTaskLifecycleEvent): void;
  protected onResponseComplete(
    chatId: string,
    fullText: string,
    sessionId: string,
  ): Promise<void>;
  protected onPromptStart(
    _chatId: string,
    sessionId: string,
    messageId?: string,
  ): void;
  protected onPromptEnd(
    _chatId: string,
    sessionId: string,
    messageId?: string,
  ): Promise<void>;
  private addReaction;
  private removeReaction;
  private onCardAction;
  disconnect(): void;
  /**
   * Count code fence boundaries in text using line-by-line tracking.
   * Handles indented fences and inline triple-backticks consistently.
   */
  private countFences;
  /**
   * Strip markdown tables from text while preserving code-fenced blocks.
   * Collapses consecutive table rows into a single replacement line.
   */
  private stripTables;
  /** Truncate card content to the Feishu card size limit, keeping the tail.
   *  `reservedChars` covers content rendered alongside the text (greeting
   *  prefix, status block) that must fit the same limit. */
  private truncateCardText;
  private cleanupCard;
  private releaseOutputCard;
  private onMessage;
  /**
   * Extract text and media keys from Feishu message content.
   */
  private extractContent;
}
