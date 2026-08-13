import type { ChannelConfigFieldDescriptor, ChannelPlugin } from '@qwen-code/channel-base';
export interface ChannelTypeDescriptor {
    type: string;
    displayName: string;
    manageable: boolean;
    fields: readonly ChannelConfigFieldDescriptor[];
}
export declare const UNSAFE_OBJECT_KEYS: Set<string>;
export declare function registerPlugin(plugin: ChannelPlugin): void;
export declare function getPlugin(channelType: string): Promise<ChannelPlugin | undefined>;
export declare function supportedTypes(): Promise<string[]>;
export declare function supportedChannelCatalog(): Promise<ChannelTypeDescriptor[]>;
