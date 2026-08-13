/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentResponse, Part, FunctionCall } from '@google/genai';
export declare function getResponseTextFromParts(parts: Part[]): string | undefined;
/**
 * Default `output` string `convertToFunctionResponse` (in `coreToolScheduler`)
 * writes when a tool returned no text (e.g. media-only / empty results).
 * Exported as the single source of truth so the producer (coreToolScheduler)
 * and this consumer cannot drift: `getToolResponseDisplayText` treats it as
 * non-informative and falls back to media placeholders / the summary
 * `resultDisplay` instead of surfacing the literal.
 */
export declare const TOOL_SUCCEEDED_OUTPUT = "Tool execution succeeded.";
/**
 * Extract the FULL tool-result text for display (Ctrl+O transcript full detail),
 * from the persisted `functionResponse` parts.
 *
 * Tool results are wrapped as `{ functionResponse: { response: { output },
 * parts?: media } }` (see `createFunctionResponsePart`). The complete content
 * lives in `response.output`; media attachments live in the NESTED
 * `functionResponse.parts`. `getResponseTextFromParts` only reads top-level
 * `part.text`, so it cannot see this — hence a dedicated extractor.
 *
 * Rules:
 * - concatenate every non-empty `response.output` (skipping the non-informative
 *   "Tool execution succeeded." placeholder);
 * - for nested media parts emit a `<media: mime>` placeholder; keep nested text;
 * - output present → return it (+ any media placeholders);
 * - no output but media present → return the placeholder(s);
 * - nothing extractable → return `undefined` so the UI falls back to the
 *   summary `resultDisplay`.
 *
 * Does NOT apply any character cap — the bound is whatever core already applied
 * (truncateToolOutput / per-tool paging). Full-detail semantics, §4.9.
 */
export declare function getToolResponseDisplayText(parts: Part[] | undefined): string | undefined;
export declare function getFunctionCalls(response: GenerateContentResponse): FunctionCall[] | undefined;
export declare function getFunctionCallsFromParts(parts: Part[]): FunctionCall[] | undefined;
export declare function getFunctionCallsAsJson(response: GenerateContentResponse): string | undefined;
export declare function getFunctionCallsFromPartsAsJson(parts: Part[]): string | undefined;
export declare function getStructuredResponse(response: GenerateContentResponse): string | undefined;
export declare function getStructuredResponseFromParts(parts: Part[]): string | undefined;
