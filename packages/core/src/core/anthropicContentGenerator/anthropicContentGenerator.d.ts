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
    private budgetDropWarned;
    private temperatureDropWarned;
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
     * `cache_control` entries this request. Requires
     * `enableCacheControl !== false` AND either an Anthropic-native baseURL
     * OR `forceGlobalCacheScope` (opt-in for proxy providers that forward
     * the `prompt-caching-scope-2026-01-05` beta; see issue #6642).
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
     * Whether the assembled request body carries any
     * `cache_control: { ..., ttl: '1h' }` entry. Scans the system block,
     * tools array, and message content blocks — every place the converter
     * attaches `cache_control` (system text, last tool, trailing user
     * message). Used to gate the `extended-cache-ttl-2025-04-11` beta
     * header defensively: live verification found the header has no
     * observable effect on this proxy/Vertex backend (identical
     * `ephemeral_1h_input_tokens` with and without it), but a hard
     * requirement can't be ruled out for every Anthropic-compatible
     * backend, so it is sent whenever the body actually requests the 1h
     * tier -- same single-source-of-truth pattern as
     * {@link hasGlobalCacheScopeOnWire}.
     */
    private hasExtendedCacheTtlOnWire;
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
     * budget-based config. Shares `parseClaudeModelVersion` with
     * `anthropicSupportedEffortTiers` so the family list and the date-suffix guard
     * stay in lockstep — a model parsed for effort gating is parsed identically
     * here for the thinking shape.
     */
    private modelSupportsAdaptiveThinking;
    /**
     * Whether the model rejects the manual `thinking: { type: 'enabled',
     * budget_tokens: N }` shape with a 400. Opus 4.7+ and every 5.x family
     * (Fable 5, Mythos 5, Sonnet 5, …) dropped manual extended thinking in favor
     * of adaptive thinking, so a budget-tokens-shaped request errors on those
     * models — they must use `{ type: 'adaptive' }` with `output_config.effort`
     * instead (https://platform.claude.com/docs/en/build-with-claude/effort).
     * Opus 4.5/4.6 and Sonnet 4.6 still accept `budget_tokens` (deprecated on
     * 4.6), and unknown/unversioned ids keep the manual escape hatch, so both
     * return false. Shares `parseClaudeModelVersion` with the effort/adaptive
     * gates so the version rules can't drift.
     */
    private modelRejectsManualThinking;
    /**
     * Whether the model rejects the `temperature` sampling parameter with a 400.
     * Claude Opus 4.8+ deprecated temperature — the server controls sampling
     * determinism internally and responds with
     * `"temperature is deprecated for this model."` when the parameter is sent.
     * Older models (4.7 and below) and unknown/unversioned ids still accept it,
     * so both return false.
     */
    private modelRejectsTemperature;
    private buildThinkingConfig;
    private buildOutputConfig;
    /**
     * Translate the Gemini-style `toolConfig.functionCallingConfig.mode` on
     * the request into an Anthropic `tool_choice` value.
     *
     * Mapping:
     *   mode 'ANY'  → `{ type: 'any' }`   (model must call at least one tool)
     *   mode 'NONE' or 'AUTO' or absent → undefined (Anthropic has no
     *     `tool_choice: { type: 'none' }`; to prevent tool calls the caller
     *     should omit `tools` entirely)
     *
     * Only emitted when `tools` is non-empty — Anthropic rejects requests
     * that carry `tool_choice` without a `tools` array.
     */
    private resolveToolChoice;
    private redactStreamErrors;
    private processStream;
    private processStreamWithEmptyFallback;
    private buildGeminiChunk;
}
