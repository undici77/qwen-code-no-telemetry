/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  Content,
  GenerateContentResponseUsageMetadata,
} from '@google/genai';
/**
 * Average characters-per-token for char-based token estimation. The inputs
 * are character counts from `estimateContentChars` (i.e. `string.length`),
 * not byte counts — for CJK / multi-byte text the byte/char ratio differs
 * from 1, so a "bytes" name would mislead. Programmatically aliased to
 * compactionInputSlimming.ts's TOKEN_TO_CHAR_RATIO so the auto-compaction
 * trigger and the compression size estimator can never drift on this constant.
 * Matches claude-code's roughTokenCountEstimation default. (review #4168 R3.1)
 */
export declare const CHARS_PER_TOKEN = 4;
/**
 * Estimate the token count of a list of Content objects via char/4.
 *
 * Reuses `estimateContentChars` so that inlineData / functionCall /
 * functionResponse get the same treatment they receive when computing
 * compression size estimates — keeping the two estimators in sync prevents
 * the auto-compaction trigger and the compressor from disagreeing on size.
 *
 * Intended for the pre-send threshold gate only. char/4 is a conservative
 * lower bound (real tokenizers vary ±30%); using it to TRIGGER compaction
 * earlier is safe (false-positive), using it to SKIP compaction is not.
 */
export declare function estimateContentTokens(
  contents: Content[],
  imageTokenEstimate?: number,
): number;
/**
 * Compute an effective prompt-token count for the auto-compaction gate.
 *
 * `lastPromptTokenCount` (from the previous turn's usage metadata) lacks
 * three things: the current user message, the previous model response that
 * was appended to local history after that prompt count was reported, and
 * any initial value on the very first send. This helper closes those gaps via
 * local estimation plus `lastOutputTokenCount` when available.
 *
 * WARNING: like estimateContentTokens, this is a conservative lower
 * bound. Use it to TRIGGER earlier, never to SKIP — the fallback path
 * (lastPromptTokenCount === 0) returns a pure estimate with no API-
 * authoritative anchor.
 */
/**
 * Multiplier applied to the char/4 estimate of NEWLY-added content when
 * `conservative` is set. char/4 is documented (see file header) as varying
 * ±30% against real tokenizers, but that band was measured against mixed
 * English-heavy content; two independent real production failures
 * (chatCompressionService's 400-overflow root cause doc and a main-turn
 * `prompt + max_tokens > window` overflow, both 2026-07-28) traced back to
 * char/4 under-counting CJK-dense tool output (design docs, large file
 * reads) by 39-54% — beyond the documented band. 1.5x covers both observed
 * cases with headroom without materially eating into the output budget for
 * ordinary (non-CJK-heavy) content, since it only scales the incremental
 * new-content term, not the API-authoritative running total.
 */
export declare const CONSERVATIVE_NEW_CONTENT_SAFETY_FACTOR = 1.5;
export declare function estimatePromptTokens(
  history: Content[],
  userMessage: Content,
  lastPromptTokenCount: number,
  lastOutputTokenCount?: number,
  imageTokenEstimate?: number,
  conservative?: boolean,
): number;
export declare function getUsageOutputTokenCountForPromptEstimate(
  usage: GenerateContentResponseUsageMetadata | undefined,
): number;
