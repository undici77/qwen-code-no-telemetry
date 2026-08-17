/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const TOKEN_ESTIMATE_UNITS_PER_TOKEN = 20;
/**
 * Text tokenizer for calculating text tokens using character-based estimation.
 *
 * Uses a lightweight character-based approach that is "good enough" for
 * guardrail features like sessionTokenLimit.
 *
 * Algorithm:
 * - ASCII characters: 0.25 tokens per char (4 chars = 1 token)
 * - Non-ASCII characters: 1.1 tokens per char (conservative for CJK, emoji, etc.)
 */
export declare function estimateTextTokens(text: string): number;
/** Returns 20 units per token so streams can accumulate without float drift. */
export declare function estimateTextTokenUnits(text: string): number;
export declare class TextTokenizer {
  /**
   * Calculate tokens for text content
   *
   * @param text - The text to estimate tokens for
   * @returns The estimated token count
   */
  calculateTokens(text: string): Promise<number>;
  /**
   * Calculate tokens for multiple text strings
   *
   * @param texts - Array of text strings to estimate tokens for
   * @returns Array of token counts corresponding to each input text
   */
  calculateTokensBatch(texts: string[]): Promise<number[]>;
  private calculateTokensSync;
}
