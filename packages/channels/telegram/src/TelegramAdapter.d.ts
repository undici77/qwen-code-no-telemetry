import { ChannelBase } from '@qwen-code/channel-base';
import type { ChannelConfig, ChannelBaseOptions, AcpBridge } from '@qwen-code/channel-base';
export declare class TelegramChannel extends ChannelBase {
    private bot;
    private botId;
    private botUsername;
    constructor(name: string, config: ChannelConfig, bridge: AcpBridge, options?: ChannelBaseOptions);
    private getFileUrl;
    connect(): Promise<void>;
    /** Per-chat typing interval — repeats every 4s since Telegram expires it after 5s. */
    private typingIntervals;
    protected onPromptStart(chatId: string): void;
    protected onPromptEnd(chatId: string): void;
    sendMessage(chatId: string, text: string): Promise<void>;
    disconnect(): void;
    private buildEnvelope;
}
