/**
 * WeChat channel adapter for Qwen Code.
 * Extends ChannelBase with WeChat iLink Bot API integration.
 */
import { ChannelBase } from '@qwen-code/channel-base';
import type { ChannelConfig, ChannelBaseOptions, AcpBridge } from '@qwen-code/channel-base';
export declare class WeixinChannel extends ChannelBase {
    private abortController;
    private baseUrl;
    private token;
    constructor(name: string, config: ChannelConfig, bridge: AcpBridge, options?: ChannelBaseOptions);
    connect(): Promise<void>;
    protected onPromptStart(chatId: string): void;
    protected onPromptEnd(chatId: string): void;
    private handleInboundWithMedia;
    sendMessage(chatId: string, text: string): Promise<void>;
    disconnect(): void;
    private setTyping;
}
