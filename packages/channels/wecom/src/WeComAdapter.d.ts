import { ChannelBase } from '@qwen-code/channel-base';
import type {
  ChannelAgentBridge,
  ChannelBaseOptions,
  ChannelConfig,
} from '@qwen-code/channel-base';
export declare class WeComChannel extends ChannelBase {
  private readonly wecom;
  private client?;
  private readonly seenMessages;
  private readonly inFlightMessages;
  private readonly attachmentDirsByMessage;
  private readonly attachmentMessageByDir;
  private readonly attachmentDirsBySession;
  private readonly attachmentDirsWithoutMessageByRoute;
  private readonly bufferedAttachmentMessages;
  private readonly coalescedAttachmentMessages;
  private dedupTimer?;
  private kickReconnectReset?;
  private kickReconnectRetry?;
  private disconnectReconnectFallback?;
  private activityWatchdog?;
  private lastActivityAt;
  private connecting?;
  private connectingClient?;
  private authentication?;
  private disconnectGeneration;
  private clientHandlers?;
  private reconnectingAfterKick;
  private pendingKickReconnect;
  private kickReconnectAttempts;
  private kickReconnectRetryCycles;
  constructor(
    name: string,
    config: ChannelConfig & Record<string, unknown>,
    bridge: ChannelAgentBridge,
    options?: ChannelBaseOptions,
  );
  connect(): Promise<void>;
  private openClient;
  disconnect(): void;
  supportsProactiveSend(): boolean;
  sendMessage(chatId: string, text: string): Promise<void>;
  private onMessage;
  private downloadAttachments;
  protected onPromptBuffered(
    _chatId: string,
    sessionId: string,
    messageId?: string,
  ): void;
  protected onPromptStart(
    _chatId: string,
    sessionId: string,
    messageId?: string,
  ): void;
  protected onPromptBufferDrained(
    _chatId: string,
    _sessionId: string,
    messageIds: string[],
  ): void;
  protected onPromptBufferDropped(
    _chatId: string,
    sessionId: string,
    messageIds: string[],
  ): void;
  protected onPromptEnd(
    _chatId: string,
    sessionId: string,
    messageId?: string,
  ): void;
  private rememberAttachmentDir;
  private rememberMessageDirsForSession;
  private cleanupAttachmentDirsForMessage;
  private cleanupAttachmentDirsForSession;
  private cleanupUntrackedAttachmentDirsForSession;
  private rememberUntrackedDirsForSession;
  private removeAttachmentDirsFromSessions;
  private removeAttachmentDirsFromMessages;
  private cleanupAllAttachmentDirs;
  private attachmentRouteKeyForSession;
  private attachmentRouteKey;
  private detachClientHandlers;
  private disconnectClientOnly;
  private clearDisconnectReconnectFallback;
  private recordActivity;
  private clearActivityWatchdog;
  private startActivityWatchdog;
  private scheduleDisconnectReconnectFallback;
  private reconnectAfterKick;
  private scheduleKickReconnectReset;
  private scheduleKickReconnectRetry;
  private startKickReconnect;
  private cleanupSeenMessages;
}
