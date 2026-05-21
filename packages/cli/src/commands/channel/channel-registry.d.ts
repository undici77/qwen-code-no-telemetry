import type { ChannelPlugin } from '@qwen-code/channel-base';
export declare function registerPlugin(plugin: ChannelPlugin): void;
export declare function getPlugin(channelType: string): Promise<ChannelPlugin | undefined>;
export declare function supportedTypes(): Promise<string[]>;
