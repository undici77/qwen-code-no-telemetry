import type { ChannelMemoryEntry } from './types.js';
export declare const CHANNEL_MEMORY_RECALL_MAX_ENTRIES = 3;
export declare const CHANNEL_MEMORY_RECALL_MAX_CODE_POINTS = 1200;
export declare const CHANNEL_MEMORY_RECALL_FALLBACK_CODE_POINTS = 120;
type IndexedCandidate = {
  entry: ChannelMemoryEntry;
  index: number;
  entryTerms: Set<string>;
  normalizedLength: number;
};
export interface ChannelMemoryRecallIndex {
  readonly candidates: readonly IndexedCandidate[];
}
export declare function selectRelevantChannelMemory(
  message: string,
  entries: readonly ChannelMemoryEntry[],
): ChannelMemoryEntry[];
export declare function createChannelMemoryRecallIndex(
  entries: readonly ChannelMemoryEntry[],
): ChannelMemoryRecallIndex;
export declare function selectRelevantChannelMemoryFromIndex(
  message: string,
  recallIndex: ChannelMemoryRecallIndex,
): ChannelMemoryEntry[];
export {};
