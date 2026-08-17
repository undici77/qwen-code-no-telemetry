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
export declare const ESCALATED_MAX_TOKENS: TokenCount;
/**
 * Ceiling on the auto (non-user-configured) output request. Models
 * advertising output limits above this are clipped down; users who
 * genuinely need more set max_tokens explicitly (respected up to the
 * model's real limit). Same value as the MAX_TOKENS escalation target —
 * escalation-on-truncation raises the request up to this ceiling, never
 * past it.
 */
export declare const OUTPUT_TOKEN_CEILING: TokenCount;
/**
 * Floor applied to the window ROOM when clamping an output request: when the
 * prompt has (nearly) filled the window, still ask for at least this much
 * rather than max_tokens <= 0 — compaction/hard-rescue owns that regime. An
 * explicit user ceiling below this floor is still respected (the floor
 * bounds the room, not the ceiling). Must stay below ~5K so that
 * `margin + MIN_CLAMPED_OUTPUT_TOKENS` fits inside the headroom compaction
 * leaves free (15% of a 100K window); see the window-clamp design doc.
 */
export declare const MIN_CLAMPED_OUTPUT_TOKENS: TokenCount;
/**
 * Safety headroom subtracted from the window before sizing the output
 * request: absorbs prompt-estimation error plus system/tool/schema overhead
 * not captured by the API-reported prompt count. Deliberately conservative —
 * a generous margin only trims output in the final approach to compaction,
 * while an under-sized one reintroduces the #5950 400s.
 */
export declare function outputClampMargin(
  contextWindowSize: number,
): TokenCount;
/**
 * Size an output request to the room actually left in the context window:
 * `min(ceiling, window − prompt − margin)`, floored at
 * MIN_CLAMPED_OUTPUT_TOKENS. Makes `prompt + max_tokens ≤ window` an
 * invariant on every main-turn request (issue #5950 becomes structurally
 * impossible), which is what lets compaction thresholds run against the
 * full window with no output reservation.
 *
 * @param outputCeiling - Upper bound on the request: the user's explicit
 *   max_tokens when set, else `min(tokenLimit(model,'output'),
 *   OUTPUT_TOKEN_CEILING)`.
 * @param contextWindowSize - The configured context window.
 * @param promptTokens - Estimated prompt size; use the API-authoritative
 *   count where available (a fresh chars/4 estimate under-counts CJK and
 *   tool-heavy prompts, which is the one way a residual 400 could return).
 */
export declare function clampOutputTokensToWindow(
  outputCeiling: number,
  contextWindowSize: number,
  promptTokens: number,
): TokenCount;
export declare function parsePositiveIntegerEnvValue(
  raw: string | undefined,
): number | undefined;
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
export declare function knownTokenLimit(
  model: Model,
  type?: TokenLimitType,
): TokenCount | undefined;
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
export declare function tokenLimit(
  model: Model,
  type?: TokenLimitType,
): TokenCount;
/**
 * The default (non-user-configured) output request for a model: its
 * advertised output limit, clipped to OUTPUT_TOKEN_CEILING. This is the one
 * place that policy lives — the send path and both provider layers call it
 * so a model advertising >64K output is clamped consistently everywhere.
 */
export declare function defaultOutputCeiling(model: Model): TokenCount;
/**
 * Reconcile a user-configured `max_tokens` (from samplingParams) with the
 * send path's window-clamped request value: the smaller wins, so a user's
 * explicit ceiling is honored while never overriding the window clamp
 * upward. Returns undefined when the two can't be reconciled (either side
 * absent), leaving each provider to apply its own fallback — the shared
 * invariant ("user max_tokens is a ceiling, not an escape hatch") stays in
 * one place so a new provider can't silently reopen it.
 */
export declare function reconcileMaxTokens(
  configMaxTokens: number | null | undefined,
  requestMaxTokens: number | null | undefined,
): number | undefined;
export {};
