/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
export { COMBINED_PASS_TOLERANCE_FACTOR } from './truncation.js';
export declare const OVERSIZED_TOOL_RESULT_THRESHOLD_CHARS = 30000;
export interface ToolResultRetentionStats {
    /** Number of function-response (tool result) parts retained in history. */
    toolResultCount: number;
    /** Total characters retained across all tool results. */
    totalChars: number;
    /** Character size of the single largest retained tool result. */
    largestResultChars: number;
    /**
     * Tool results retained far above their producing tool's output budget:
     * not already truncated (no sentinel prefix) and measured above 2x budget.
     */
    oversizedResultCount: number;
    /** Fallback budget applied when a tool declares none. */
    oversizedThresholdChars: number;
}
export interface AnalyzeToolResultRetentionOptions {
    /**
     * Fallback budget for tools that declare no `maxOutputChars`. Production
     * callers pass the configured global truncation threshold — the bound the
     * scheduler actually applies to such results.
     */
    thresholdChars?: number;
    /**
     * Resolves the declared output budget of the tool that produced a result
     * (by its `functionResponse.name`), mirroring the scheduler's per-tool
     * limits. A result is oversized only if it exceeds its own tool's budget,
     * so compliant results from high-budget tools (e.g. MCP) are never flagged.
     *
     * Caveat: if the tool has been removed from the registry (e.g. an MCP
     * server disconnected mid-session), the resolver misses and the fallback
     * threshold applies, which may over-flag formerly high-budget results.
     */
    resolveToolBudgetChars?: (toolName: string) => number | undefined;
    /**
     * Image token estimate for billing nested media parts, mirroring the
     * compression pipeline's `resolveSlimmingConfig`. Defaults to
     * `DEFAULT_IMAGE_TOKEN_ESTIMATE`; production callers should pass the
     * resolved value so both diagnostics and compression agree about the
     * same history.
     */
    imageTokenEstimate?: number;
}
/**
 * Computes aggregate size/count signals for tool results retained in a
 * conversation history. Deliberately reports sizes and counts only — never
 * content — so the output is safe to paste into bug reports.
 *
 * Sizes reuse `estimatePartChars`, the same model the compression pipeline
 * uses, so both agree about the same history (string outputs are measured as
 * raw chars — no JSON-escaping inflation — and nested media parts are billed
 * at the image token estimate instead of their base64 length).
 */
export declare function analyzeToolResultRetention(history: Content[], options?: AnalyzeToolResultRetentionOptions): ToolResultRetentionStats;
