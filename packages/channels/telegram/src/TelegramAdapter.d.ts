import { ChannelBase } from '@qwen-code/channel-base';
import type {
  ChannelAgentBridge,
  ChannelBaseOptions,
  ChannelConfig,
  ChannelTaskLifecycleEvent,
  Envelope,
  SessionTarget,
} from '@qwen-code/channel-base';
export declare class TelegramChannel extends ChannelBase {
  private bot;
  private botId;
  private botUsername;
  private hasConnectedOnce;
  private signalHandlersRegistered;
  private readonly inboundRoute;
  constructor(
    name: string,
    config: ChannelConfig,
    bridge: ChannelAgentBridge,
    options?: ChannelBaseOptions,
  );
  supportsProactiveSend(): boolean;
  protected supportsProactiveTarget(target: SessionTarget): boolean;
  private createBot;
  private getFileUrl;
  connect(): Promise<void>;
  private registerBotCommands;
  /** Per-chat typing interval — repeats every 4s since Telegram expires it after 5s. */
  private typingIntervals;
  private activeTypingSessions;
  private sendTyping;
  private startTyping;
  private stopTyping;
  protected onTaskLifecycle(event: ChannelTaskLifecycleEvent): void;
  protected onPromptStart(chatId: string, sessionId?: string): void;
  protected onPromptEnd(chatId: string, sessionId?: string): void;
  onSessionDied(sessionId: string): void;
  handleInbound(envelope: Envelope): Promise<void>;
  sendMessage(chatId: string, text: string): Promise<void>;
  protected sendResponseMessage(
    chatId: string,
    text: string,
    sessionId: string,
  ): Promise<void>;
  protected pushProactive(target: SessionTarget, text: string): Promise<void>;
  private sendTelegramMessage;
  disconnect(): void;
  private buildEnvelope;
}
