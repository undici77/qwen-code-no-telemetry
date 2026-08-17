/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { ClearContextOnIdleSettings } from '../../config/config.js';
export declare const MICROCOMPACT_CLEARED_MESSAGE =
  '[Old tool result content cleared]';
export declare const MICROCOMPACT_CLEARED_IMAGE_PREFIX =
  '[Old inline media cleared:';
/**
 * Check whether the time-based trigger should fire.
 *
 * A toolResultsThresholdMinutes of -1 means disabled (never clear).
 */
export declare function evaluateTimeBasedTrigger(
  lastApiCompletionTimestamp: number | null,
  settings: ClearContextOnIdleSettings,
): {
  gapMs: number;
} | null;
export type PreserveReadFileResult = (filePath: string) => boolean;
export type MicrocompactTriggerReason = 'force' | 'idle' | 'size';
export interface MicrocompactOptions {
  force?: boolean;
  sizeOnly?: boolean;
  pendingContent?: Content | Content[];
  preserveReadFileResult?: PreserveReadFileResult;
}
export interface MicrocompactMeta {
  triggerReason: MicrocompactTriggerReason;
  gapMinutes: number;
  thresholdMinutes: number;
  toolResultCharsBefore?: number;
  toolResultCharsAfter?: number;
  pendingToolResultChars?: number;
  toolResultsTotalCharsThreshold?: number;
  toolResultsLowWatermark?: number;
  /** Count of `tool`-kind results cleared (compactable tool outputs). */
  toolsCleared: number;
  /** Count of media parts cleared (`media` top-level + `nested-media` under non-compactable tools). */
  mediaCleared: number;
  /** Count of `tool`-kind results retained (recent-budget protected). */
  toolsKept: number;
  /** Count of media parts retained across both media kinds. */
  mediaKept: number;
  keepRecent: number;
  tokensSaved: number;
  /** Recovered paths of files whose read/edit/write result was blanked; the caller disarms their fast-path (issue #4239). */
  evictedReadPaths: string[];
  /**
   * Count of blanked file results whose path could NOT be recovered
   * (e.g. provider didn't populate `functionCall.id`). Non-zero means
   * the caller MUST fall back to the blanket wipe — an unrecovered
   * armed entry would serve a dangling placeholder.
   */
  unresolvedEvictedReads: number;
}
/**
 * Microcompact history: clear old compactable tool results and media when the
 * idle/force trigger fires, or clear old compactable tool results only when
 * the cumulative tool-result size trigger fires.
 *
 * Pass `opts.force: true` to skip trigger checks and always run the full
 * clearing logic (used by `/compress-fast`). Pass `opts.sizeOnly: true` with
 * optional `pendingContent` for ToolResult turns.
 *
 * Returns the (potentially modified) history and optional metadata
 * about what was cleared (for logging by the caller).
 */
export declare function microcompactHistory(
  history: Content[],
  lastApiCompletionTimestamp: number | null,
  settings: ClearContextOnIdleSettings,
  opts?: MicrocompactOptions,
): {
  history: Content[];
  meta?: MicrocompactMeta;
};
