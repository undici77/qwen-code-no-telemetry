/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, Part } from '@google/genai';
import type { ChatCompressionSettings } from '../config/config.js';
import type { InputModalities } from '../core/contentGenerator.js';
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
 * Generic char/token conversion factor (claude-code's canonical heuristic).
 * Exported so adjacent estimators (`tokenEstimation.ts`'s `CHARS_PER_TOKEN`)
 * stay programmatically linked — if this ever moves, both sites move
 * together rather than drifting silently.
 */
export declare const TOKEN_TO_CHAR_RATIO = 4;
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
export declare const DEFAULT_MAX_RECENT_FILES = 5;
export declare const DEFAULT_MAX_RECENT_IMAGES = 3;
export declare const DEFAULT_SCREENSHOT_TRIGGER_ENABLED = true;
export declare const DEFAULT_SCREENSHOT_TRIGGER_THRESHOLD = 20;
export declare const DEFAULT_IMAGE_PAYLOAD_THRESHOLD = 20;
export interface ResolvedCompactionTuning {
    /** Recent files restored after compaction (0 = restore none). */
    maxRecentFiles: number;
    /** Recent images restored after compaction (0 = restore none). */
    maxRecentImages: number;
    /** Whether tool-image accumulation can trigger auto-compaction. */
    enableScreenshotTrigger: boolean;
    /** Tool-image count at or above which the trigger fires (≥ 1). */
    screenshotTriggerThreshold: number;
    /**
     * Inline image count at or above which historical image payloads
     * are replaced with text references and only recent images are
     * reattached. Below this threshold images stay in-place untouched.
     */
    imagePayloadThreshold: number;
}
/**
 * Resolves the post-compact retention + screenshot-trigger knobs in
 * priority order env > settings > default. Count-like fields require
 * integer values because downstream collectors compare against integer
 * lengths.
 *
 * The screenshot trigger counts only images nested in
 * `functionResponse.parts` (tool results). Compaction replaces those with
 * the summary, and the surviving images are re-embedded as TOP-LEVEL parts
 * in the restoration block — which the counter ignores. So compaction
 * always resets the tool-image count to ~0 and the trigger cannot
 * immediately re-fire, independent of `maxRecentImages`.
 */
export declare function resolveCompactionTuning(settings: ChatCompressionSettings | undefined): ResolvedCompactionTuning;
/**
 * Approximate char count for a single `Part`, used by
 * `estimateContentChars` and by the slimming module's own budget
 * accounting. Binary parts get a fixed budget (in chars) derived from
 * the configured token estimate; this keeps base64 payloads from
 * skewing compression size estimation or token-budget math.
 */
export declare function estimatePartChars(part: Part, imageTokenEstimate: number): number;
/**
 * Returns the nested-parts array from a `functionResponse`, if present.
 * qwen-code attaches media here (see
 * `coreToolScheduler.createFunctionResponsePart`); the standard
 * `@google/genai` FunctionResponse type does not declare it.
 *
 * Exported so post-compact image extraction/counting walks the SAME
 * carrier the slimmer strips — otherwise the two disagree on where tool
 * media lives and screenshots silently vanish from restoration.
 */
export declare function getFunctionResponseParts(part: Part): Part[] | undefined;
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
export declare function slimCompactionInput(history: Content[], supportedModalities?: InputModalities): SlimResult;
export {};
