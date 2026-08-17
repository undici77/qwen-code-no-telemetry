/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ChannelMemoryEntry } from './channel-memory-document.js';
export interface ChannelMemoryTarget {
  channelName: string;
  chatId: string;
  threadId?: string;
}
export interface ChannelMemoryMutationResult {
  changed: boolean;
  filePath: string;
}
export interface AddChannelMemoryResult extends ChannelMemoryMutationResult {
  added: ChannelMemoryEntry[];
  duplicateIds: string[];
}
export interface UpdateChannelMemoryResult extends ChannelMemoryMutationResult {
  entry?: ChannelMemoryEntry;
}
export interface RemoveChannelMemoryResult extends ChannelMemoryMutationResult {
  removed: ChannelMemoryEntry[];
}
export type ChannelMemoryWriteResult = ChannelMemoryMutationResult;
export declare const CHANNEL_MEMORY_FILE_NAME = 'CHANNEL.json';
export declare const LEGACY_CHANNEL_MEMORY_FILE_NAME = 'CHANNEL.md';
export declare const MAX_CHANNEL_MEMORY_BYTES: number;
export declare function getChannelMemoryFilePath(
  target: ChannelMemoryTarget,
): string;
export declare function getLegacyChannelMemoryFilePath(
  target: ChannelMemoryTarget,
): string;
export declare function listChannelMemoryEntries(
  target: ChannelMemoryTarget,
): Promise<ChannelMemoryEntry[]>;
export declare function getChannelMemoryRevision(
  target: ChannelMemoryTarget,
): Promise<string>;
export declare function addChannelMemoryEntries(
  target: ChannelMemoryTarget,
  texts: readonly string[],
  createdBy?: string,
): Promise<AddChannelMemoryResult>;
export declare function updateChannelMemoryEntry(
  target: ChannelMemoryTarget,
  mutation: {
    id: string;
    text: string;
    expectedText?: string;
  },
): Promise<UpdateChannelMemoryResult>;
export declare function removeChannelMemoryEntries(
  target: ChannelMemoryTarget,
  mutation: {
    ids: readonly string[];
    expectedTextById?: Readonly<Record<string, string>>;
  },
): Promise<RemoveChannelMemoryResult>;
export declare function readChannelMemory(
  target: ChannelMemoryTarget,
): Promise<string>;
export declare function appendChannelMemory(
  target: ChannelMemoryTarget,
  text: string,
): Promise<ChannelMemoryMutationResult>;
export declare function clearChannelMemory(
  target: ChannelMemoryTarget,
): Promise<ChannelMemoryMutationResult>;
