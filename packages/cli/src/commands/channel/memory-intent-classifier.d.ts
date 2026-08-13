import type { ChannelAgentBridge, ChannelMemoryIntentClassifier, ChannelMemoryIntentClassifierResult } from '@qwen-code/channel-base';
type ChannelMemoryEntries = NonNullable<Parameters<ChannelMemoryIntentClassifier['classifyChannelMemoryIntent']>[1]>;
type ChannelMemoryEntry = ChannelMemoryEntries[number];
export declare class BridgeChannelMemoryIntentClassifier implements ChannelMemoryIntentClassifier {
    private readonly cwd;
    private readonly getBridge;
    constructor(bridge: ChannelAgentBridge | (() => ChannelAgentBridge), cwd: string);
    classifyChannelMemoryIntent(text: string, entries?: readonly ChannelMemoryEntry[]): Promise<ChannelMemoryIntentClassifierResult>;
}
export {};
