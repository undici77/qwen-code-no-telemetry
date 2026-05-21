/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CountTokensParameters, CountTokensResponse, EmbedContentParameters, EmbedContentResponse, GenerateContentParameters } from '@google/genai';
import { GenerateContentResponse } from '@google/genai';
import type { Config } from '../../config/config.js';
import type { ContentGenerator, ContentGeneratorConfig } from '../contentGenerator.js';
export declare class AnthropicContentGenerator implements ContentGenerator {
    private contentGeneratorConfig;
    private readonly cliConfig;
    private client;
    private converter;
    private effortClampWarned;
    constructor(contentGeneratorConfig: ContentGeneratorConfig, cliConfig: Config);
    generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse>;
    generateContentStream(request: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>>;
    countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;
    embedContent(_request: EmbedContentParameters): Promise<EmbedContentResponse>;
    useSummarizedThinking(): boolean;
    private buildHeaders;
    /**
     * Compute `anthropic-beta` from the actual fields present in the request
     * body. Keeps the header consistent with the body even when a per-request
     * `thinkingConfig.includeThoughts: false` opt-out drops `thinking` /
     * `output_config` after the constructor has already run.
     *
     * User-supplied `customHeaders['anthropic-beta']` flags are merged in (and
     * deduped) so the per-request override doesn't wipe out the existing
     * customHeaders escape hatch for unrelated beta features. The lookup is
     * case-insensitive — HTTP header names are case-insensitive by spec, so a
     * user-configured `Anthropic-Beta` or `ANTHROPIC-BETA` is honored too.
     */
    private buildPerRequestHeaders;
    /**
     * Whether to ATTACH the body-side `scope: 'global'` field on
     * `cache_control` entries this request. Requires both
     * `enableCacheControl !== false` AND an Anthropic-native baseURL.
     * Computed per request: `Config.handleModelChange()` hot-updates
     * `enableCacheControl` in-place on the qwen-oauth path (without
     * recreating the ContentGenerator); non-qwen-oauth providers refresh
     * via generator recreation, which captures `baseUrl` fresh at
     * construct time (not mutated). Reading both fields each request is
     * the right defense — cheap and avoids stale-cache surprises if the
     * hot-update list ever expands.
     *
     * The matching `prompt-caching-scope-2026-01-05` beta header is NOT
     * gated on this predicate directly; instead `buildPerRequestHeaders`
     * scans the assembled body via `hasGlobalCacheScopeOnWire` so the beta
     * and the body field always agree even in degenerate cases (e.g.
     * empty-system + no-tools request — predicate true, body has nothing
     * to attach scope to, beta correctly suppressed).
     */
    private useGlobalCacheScope;
    /**
     * Whether the assembled request body carries any
     * `cache_control: { …, scope: 'global' }` entry. Scans the system
     * block (when present as TextBlockParam[]) and the tools array — these
     * are the only two places the converter attaches scoped cache control.
     * Used to gate the `prompt-caching-scope-2026-01-05` beta header so it
     * never ships without a matching body field, and conversely so the
     * field never ships without the beta declaring it.
     */
    private hasGlobalCacheScopeOnWire;
    /**
     * Read every customHeaders entry whose key (case-insensitively) is
     * `anthropic-beta` and yield the comma-separated flags from each. Multiple
     * matching entries are concatenated; later ones may produce duplicates
     * which the caller dedupes.
     */
    private collectCustomBetaFlags;
    private buildRequest;
    private buildSamplingParameters;
    /**
     * Compute the effort value that both the thinking budget ladder and
     * output_config should use for this request. Returns undefined whenever
     * reasoning is disabled or the user didn't set an effort. Clamps the
     * DeepSeek-only 'max' tier to 'high' when the resolved baseURL is NOT a
     * DeepSeek hostname (real Anthropic accepts low/medium/high only and
     * would 400 on 'max'). Uses the hostname-only detector deliberately —
     * the broader `isDeepSeekAnthropicProvider` model-name fallback exists
     * for the thinking-block injection workaround (sglang/vllm self-hosted
     * coverage), but trusting it here would let a model named e.g.
     * "deepseek-clone" running on real api.anthropic.com bypass the clamp.
     *
     * The downgrade warning fires once per generator lifetime via the
     * `effortClampWarned` latch — repeating on every request just spams
     * the log without giving users new information.
     */
    private resolveEffectiveEffort;
    /**
     * Check if the current model supports adaptive thinking (type: 'adaptive').
     * Claude 4.6+ models require adaptive thinking; older models use the
     * budget-based config. Uses numeric major/minor comparison rather than a
     * single-digit character class so that future families (haiku, opus-4-10,
     * opus-5-1, …) are recognized instead of silently falling back to the
     * budget path and tripping HTTP 400 with `budget_tokens` they don't
     * accept.
     *
     * The regex is intentionally unanchored so reseller-prefixed model names
     * also match (`bedrock/claude-opus-4-7`, `vertex_ai/claude-sonnet-4-6@…`,
     * `idealab:claude-opus-4-6`, etc.) — those route to the same Anthropic
     * models on the wire and need the same thinking shape. Do not tighten to
     * `^claude-` without also covering those naming conventions.
     */
    private modelSupportsAdaptiveThinking;
    private buildThinkingConfig;
    private buildOutputConfig;
    private redactStreamErrors;
    private processStream;
    private buildGeminiChunk;
}
