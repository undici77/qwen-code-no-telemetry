/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const CHANNEL_MEMORY_DOCUMENT_VERSION = 1;
export declare const MAX_CHANNEL_MEMORY_ENTRIES = 500;
export declare const MAX_CHANNEL_MEMORY_ENTRIES_PER_REQUEST = 10;
export declare const MAX_CHANNEL_MEMORY_ENTRY_CODE_POINTS = 2000;
export declare const CHANNEL_MEMORY_ID_RE: RegExp;
export interface ChannelMemoryEntry {
  id: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}
export interface ChannelMemoryDocument {
  version: 1;
  migration?: {
    legacySha256: string;
  };
  entries: ChannelMemoryEntry[];
}
export declare function normalizeChannelMemoryText(text: string): string;
export declare function parseChannelMemoryDocument(
  raw: string,
): ChannelMemoryDocument;
export declare function parseLegacyChannelMemory(
  raw: Buffer,
): ChannelMemoryDocument;
export declare function createChannelMemoryEntry(input: {
  text: string;
  createdBy?: string;
  now: string;
  randomHex: string;
}): ChannelMemoryEntry;
export declare function renderChannelMemoryRecall(
  entries: readonly ChannelMemoryEntry[],
): string;
export declare function serializeChannelMemoryDocument(
  document: ChannelMemoryDocument,
): string;
