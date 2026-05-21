type Model = string;
type TokenCount = number;
/**
 * Token limit types for different use cases.
 * - 'input': Maximum input context window size
 * - 'output': Maximum output tokens that can be generated in a single response
 */
export type TokenLimitType = 'input' | 'output';
export declare const DEFAULT_TOKEN_LIMIT: TokenCount;
export declare const DEFAULT_OUTPUT_TOKEN_LIMIT: TokenCount;
export declare const CAPPED_DEFAULT_MAX_TOKENS: TokenCount;
export declare const ESCALATED_MAX_TOKENS: TokenCount;
/** Robust normalizer: strips provider prefixes, pipes/colons, date/version suffixes, etc. */
export declare function normalize(model: string): string;
/**
 * Check if a model has an explicitly defined output token limit.
 * This distinguishes between models with known limits in OUTPUT_PATTERNS
 * and unknown models that would fallback to DEFAULT_OUTPUT_TOKEN_LIMIT.
 *
 * @param model - The model name to check
 * @returns true if the model has an explicit output limit definition, false if it uses the default fallback
 */
export declare function hasExplicitOutputLimit(model: Model): boolean;
export declare function knownTokenLimit(model: Model, type?: TokenLimitType): TokenCount | undefined;
/**
 * Return the token limit for a model string based on the specified type.
 *
 * This function determines the maximum number of tokens for either input context
 * or output generation based on the model and token type. It uses the same
 * normalization logic for consistency across both input and output limits.
 *
 * This function is primarily used during config initialization to auto-detect
 * token limits. After initialization, code should use contentGeneratorConfig.contextWindowSize
 * or contentGeneratorConfig.maxOutputTokens directly.
 *
 * @param model - The model name to get the token limit for
 * @param type - The type of token limit ('input' for context window, 'output' for generation)
 * @returns The maximum number of tokens allowed for this model and type
 */
export declare function tokenLimit(model: Model, type?: TokenLimitType): TokenCount;
export {};
