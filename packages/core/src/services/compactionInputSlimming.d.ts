/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, Part } from '@google/genai';
import type { ChatCompressionSettings } from '../config/config.js';
/**
 * Prepares `historyToCompress` for the side-query summary model by
 * stripping inline media. `inlineData` / `fileData` parts are replaced
 * with a short `[image: <mime>]` / `[document: <mime>]` placeholder —
 * the summary model usually cannot interpret raw base64 anyway, and
 * shipping the bytes inflates the side-query payload.
 *
 * The function never mutates the input; it returns a fresh `Content[]`
 * (or the identity-equal input when no changes were made).
 */
export declare const DEFAULT_IMAGE_TOKEN_ESTIMATE = 1600;
/**
 * Strip characters that could break out of the placeholder envelope or
 * inject prompt-shaped content into the summary side-query. MCP tools
 * surface `mimeType` from arbitrary servers; an adversarial server
 * could craft something like `image/png]\n\n[SYSTEM: …` and have it
 * appear verbatim in the slimmed prompt.
 */
export declare function sanitizeMimeForPlaceholder(mime: string): string;
export interface ResolvedSlimmingConfig {
    imageTokenEstimate: number;
}
/**
 * Resolves slimming-related knobs in priority order: env > settings >
 * default. Invalid (non-finite or out-of-range) values fall through to
 * the next source.
 */
export declare function resolveSlimmingConfig(settings: ChatCompressionSettings | undefined): ResolvedSlimmingConfig;
/**
 * Approximate char count for a single `Part`, used by
 * `findCompressSplitPoint` and by the slimming module's own budget
 * accounting. Binary parts get a fixed budget (in chars) derived from
 * the configured token estimate; this keeps base64 payloads from
 * skewing the split point or token-budget math.
 */
export declare function estimatePartChars(part: Part, imageTokenEstimate: number): number;
export declare function estimateContentChars(content: Content, imageTokenEstimate: number): number;
interface SlimResult {
    slimmedHistory: Content[];
    stats: SlimStats;
}
interface SlimStats {
    imagesStripped: number;
    documentsStripped: number;
}
/**
 * Strip inline media from compaction input. The returned array has the
 * same length and ordering as the input; identity-equal when nothing
 * changed.
 */
export declare function slimCompactionInput(history: Content[]): SlimResult;
export {};
