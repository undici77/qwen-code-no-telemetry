import type { ServeChannelSelection } from './types.js';
export declare function isAllChannelSelectionName(name: string): boolean;
export declare function normalizeServeChannelSelection(rawChannels: string[] | undefined): ServeChannelSelection | undefined;
export declare function channelSelectionNames(selection: ServeChannelSelection): string[];
