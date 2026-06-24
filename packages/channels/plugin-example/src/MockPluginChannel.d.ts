import { ChannelBase } from '@qwen-code/channel-base';
import type { ChannelConfig, ChannelBaseOptions, Envelope, AcpBridge } from '@qwen-code/channel-base';
export interface MockPluginConfig extends ChannelConfig {
    serverWsUrl: string;
}
export declare class MockPluginChannel extends ChannelBase {
    private ws;
    private serverWsUrl;
    private pendingMessageId;
    constructor(name: string, config: MockPluginConfig & Record<string, unknown>, bridge: AcpBridge, options?: ChannelBaseOptions);
    connect(): Promise<void>;
    private onInboundMessage;
    protected onResponseChunk(chatId: string, chunk: string, _sessionId: string): void;
    protected onResponseComplete(chatId: string, fullText: string, _sessionId: string): Promise<void>;
    sendMessage(chatId: string, text: string): Promise<void>;
    disconnect(): void;
    handleInbound(envelope: Envelope): Promise<void>;
}
