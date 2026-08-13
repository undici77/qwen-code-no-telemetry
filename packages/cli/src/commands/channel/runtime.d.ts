import type { SessionRouter, ChannelAgentBridge, ChannelBase, ChannelBaseOptions } from '@qwen-code/channel-base';
import { type LoadedSettings } from '../../config/settings.js';
import { parseChannelConfig } from './config-utils.js';
export type ParsedChannelConfig = Awaited<ReturnType<typeof parseChannelConfig>>;
export interface ParsedChannel {
    name: string;
    config: ParsedChannelConfig;
}
export declare function sessionsPath(): string;
export declare function daemonSessionRoutesPath(workspaceCwd: string): string;
export declare function daemonObservedContactsPath(workspaceCwd: string): string;
export declare function daemonChannelLoopPath(workspaceCwd: string): string;
export declare function daemonChannelStateDir(workspaceCwd: string, channelName: string): string;
export declare function channelLoopPath(): string;
export declare function loadChannelsConfig(cwd?: string, settings?: LoadedSettings): Record<string, unknown>;
export declare function resolveExtensionChannelEntrySpecifier(extensionPath: string, entry: string): string;
/**
 * Load channel plugins from active extensions.
 * Extensions declare channels in their qwen-extension.json manifest.
 */
export declare function loadChannelsFromExtensions(): Promise<number>;
export declare function createChannel(name: string, config: ParsedChannelConfig, bridge: ChannelAgentBridge, options?: ChannelBaseOptions): Promise<ChannelBase>;
export declare function selectFirstModel(parsed: ParsedChannel[], bridgeLabel: string): string | undefined;
export declare function registerToolCallDispatch(bridge: ChannelAgentBridge, router: SessionRouter, channels: Map<string, ChannelBase>): void;
export declare function registerBackgroundResponseRelay(bridge: ChannelAgentBridge, router: SessionRouter, channels: Map<string, ChannelBase>): void;
export declare function registerPermissionRelay(bridge: ChannelAgentBridge, router: SessionRouter, channels: Map<string, ChannelBase>): void;
export declare function registerSessionCleanup(bridge: ChannelAgentBridge, router: SessionRouter, channels: Map<string, ChannelBase>): void;
export declare function parseConfiguredChannels(channelsConfig: Record<string, unknown>, selectedNames: string[], opts?: {
    defaultCwd?: string;
}): Promise<ParsedChannel[]>;
