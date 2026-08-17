/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HistoryItem, HistoryItemWithoutId } from '../types.js';
/**
 * Items that don't represent meaningful model output. Used by the
 * auto-restore-on-cancel flow to decide whether the just-submitted user
 * prompt can be rewound (no real response was produced) or must stay in
 * the transcript (the user already saw something worth keeping).
 *
 * Mirrors claude-code's `messagesAfterAreOnlySynthetic` (MessageSelector.tsx):
 * thoughts/info/error/etc. are non-meaningful; assistant text and tool runs
 * are meaningful.
 *
 * Every member of the {@link HistoryItemWithoutId} union must appear in
 * exactly one branch — the trailing `_exhaustive: never` line gives a
 * compile-time error when a new history item type is added without
 * being explicitly classified, so auto-restore can't silently break.
 */
export declare function isSyntheticHistoryItem(
  item: HistoryItem | HistoryItemWithoutId,
): boolean;
/**
 * Returns true when every item AFTER `fromIndex` is non-meaningful
 * (synthetic). An empty trailing slice also returns true.
 *
 * Used by the cancel handler: if the user hit ESC right after submitting
 * and the model produced nothing real, the prompt+trailing INFO can be
 * rewound and the prompt text restored to the input box — same UX as
 * claude-code (REPL.tsx auto-restore branch).
 */
export declare function itemsAfterAreOnlySynthetic(
  history: readonly HistoryItem[],
  fromIndex: number,
): boolean;
/** Index of the last `user` (real prompt) item, or -1. */
export declare function findLastUserItemIndex(
  history: readonly HistoryItem[],
): number;
/** Texts of real (non-steer) user prompts in `history`, oldest-first. */
export declare function realUserPromptTexts(
  history: readonly HistoryItem[],
): string[];
/**
 * Map every thought item to the id of its group's `gemini_thought` head.
 *
 * A "thought" is one `gemini_thought` head followed by zero or more
 * `gemini_thought_content` continuations. Both the head and its continuations
 * map to the head id, so a single click on the head can expand/collapse the
 * whole group as a unit (see the per-thought inline expansion in
 * HistoryItemDisplay).
 */
export declare function buildThoughtHeadIdMap(
  items: readonly HistoryItem[],
): Map<HistoryItem, number>;
