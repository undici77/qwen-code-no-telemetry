/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HistoryItem, HistoryItemWithoutId } from '../types.js';
type HistoryItemUpdater = (
  prevItem: HistoryItem,
) => Partial<HistoryItemWithoutId>;
export declare const UI_COMPACT_CLEARED_MESSAGE =
  '[Old tool result content cleared]';
export declare const UI_COMPACT_CLEARED_IMAGE_MESSAGE =
  '[Old assistant image content cleared]';
export interface UseHistoryManagerReturn {
  history: HistoryItem[];
  addItem: (itemData: HistoryItemWithoutId, baseTimestamp: number) => number;
  updateItem: (
    id: number,
    updates: Partial<HistoryItemWithoutId> | HistoryItemUpdater,
  ) => void;
  clearItems: () => void;
  loadHistory: (newHistory: HistoryItem[]) => void;
  truncateToItem: (itemId: number) => void;
  compactOldItems: () => void;
}
/**
 * Custom hook to manage the chat history state.
 *
 * Encapsulates the history array, message ID generation, adding items,
 * updating items, and clearing the history.
 */
export declare function useHistory(): UseHistoryManagerReturn;
export {};
