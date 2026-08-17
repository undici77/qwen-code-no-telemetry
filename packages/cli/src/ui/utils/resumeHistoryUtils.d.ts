/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ResumedSessionData, Config } from '@qwen-code/qwen-code-core';
import type { HistoryItem } from '../types.js';
/**
 * Builds the complete UI history items for a resumed session.
 *
 * This function takes the resumed session data, converts it to UI history format,
 * and assigns unique IDs to each item for use with loadHistory.
 *
 * @param sessionData The resumed session data from SessionService
 * @param config The config object for accessing tool registry. Pass `null`
 *   to render in "preview" mode (no tool metadata lookup, thoughts shown
 *   verbatim) — used by the standalone resume picker that runs before
 *   `loadCliConfig`.
 * @param baseTimestamp Base timestamp for generating unique IDs
 * @returns Array of HistoryItem with proper IDs
 */
export declare function buildResumedHistoryItems(
  sessionData: ResumedSessionData,
  config: Config | null,
  baseTimestamp?: number,
): HistoryItem[];
/**
 * Strips the suppressOnRestore flag from a history item's display property.
 * Used when rewinding into collapsed history to ensure rewound items remain visible.
 */
export declare function stripSuppressOnRestore(item: HistoryItem): HistoryItem;
/**
 * Removes collapse-summary items and strips suppressOnRestore from the rest.
 * Shared between the rewind path and the expand-now command.
 */
export declare function expandCollapsedHistory(
  items: HistoryItem[],
): HistoryItem[];
/**
 * Helper to apply the collapse policy and append the summary item if needed.
 */
export declare function applyCollapsePolicyAndSummary(
  rawItems: HistoryItem[],
  collapseOnResume: boolean,
  collapsePreviewCount?: number,
): HistoryItem[];
