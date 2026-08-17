/**
 * WeChat channel adapter for Qwen Code.
 * Extends ChannelBase with WeChat iLink Bot API integration.
 */
import { ChannelBase } from '@qwen-code/channel-base';
import type {
  ChannelConfig,
  ChannelBaseOptions,
  ChannelAgentBridge,
  ChannelTaskLifecycleEvent,
} from '@qwen-code/channel-base';
export declare class WeixinChannel extends ChannelBase {
  private abortController;
  private activeTypingChats;
  private baseUrl;
  private token;
  constructor(
    name: string,
    config: ChannelConfig,
    bridge: ChannelAgentBridge,
    options?: ChannelBaseOptions,
  );
  connect(): Promise<void>;
  protected onPromptStart(chatId: string): void;
  protected onPromptEnd(chatId: string): void;
  protected onTaskLifecycle(event: ChannelTaskLifecycleEvent): void;
  private handleInboundWithMedia;
  sendMessage(chatId: string, text: string): Promise<void>;
  disconnect(): void;
  private startTyping;
  private stopTyping;
  private setTyping;
}
