/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentParameters, ToolListUnion } from '@google/genai';
import { FinishReason, GenerateContentResponse } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import { type SchemaComplianceMode } from '../../utils/schemaConverter.js';
type AnthropicMessageParam = Anthropic.MessageParam;
type AnthropicCacheControl = {
    type: 'ephemeral';
    scope?: 'global';
};
type AnthropicToolParam = Anthropic.Tool & {
    cache_control?: AnthropicCacheControl;
};
type AnthropicTextBlockParam = Anthropic.TextBlockParam & {
    cache_control?: AnthropicCacheControl;
};
export interface ConvertGeminiRequestToAnthropicOptions {
    /**
     * On every assistant turn, fill in `signature: ''` on any `thinking` block
     * that lacks the required `signature` field. Preserves the original
     * `thinking` text. Common case: cross-provider history where non-Anthropic
     * generators (OpenAI / Gemini / agent-runtime) only set `thought: true`,
     * or `redacted_thinking` blocks that lost their `data` field through the
     * Gemini-Part round trip.
     */
    normalizeAssistantThinkingSignature?: boolean;
    /**
     * On assistant turns containing `tool_use` but lacking any thinking block,
     * prepend a synthetic empty thinking block. Required by DeepSeek's
     * anthropic-compatible API when thinking mode is enabled — without this,
     * follow-up requests fail with HTTP 400 ("The content[].thinking in the
     * thinking mode must be passed back to the API.").
     *
     * Pair with `normalizeAssistantThinkingSignature` so that any
     * signature-less `thinking` block already present is normalized (filled
     * with `signature: ''`) before this pass runs. After normalization the
     * block has a valid `signature` and is treated as already-satisfying, so
     * no synthetic block is prepended and the original thinking text is
     * preserved on the wire.
     *
     * Must be gated on the same per-request condition that emits the
     * top-level `thinking` config so disabled-thinking requests don't ship
     * stray thinking blocks. https://github.com/QwenLM/qwen-code/issues/3786
     */
    injectThinkingOnToolUseTurns?: boolean;
    /**
     * Strip thinking and redacted_thinking blocks from assistant messages.
     * Used to keep DeepSeek requests consistent when thinking mode is off but
     * session history still carries `thought: true` parts (e.g. side-queries
     * spawned with `thinkingConfig.includeThoughts: false`).
     */
    stripAssistantThinking?: boolean;
    /**
     * Per-call override for `enableCacheControl`. Falls back to the value
     * captured at construction. The generator passes the live
     * `contentGeneratorConfig.enableCacheControl` here so a hot
     * `Config.setModel()` flip is reflected on the next request — otherwise
     * the converter's body-side `cache_control` and the generator's
     * per-request `prompt-caching-scope-2026-01-05` beta header (which reads
     * the live config directly) can disagree.
     */
    enableCacheControl?: boolean;
    /**
     * When `true`, emit `cache_control: { type: 'ephemeral', scope: 'global' }`
     * on the system text and last tool entry so prefixes cache across
     * sessions; when `false` (or omitted), emit the SDK-standard per-session
     * shape `{ type: 'ephemeral' }`. Must be a strict subset of
     * `enableCacheControl` (no scope without a cache_control entry to
     * attach it to) and should mirror the generator's
     * `prompt-caching-scope-2026-01-05` beta-header gate — both ship
     * together or neither, so anthropic-compatible backends without
     * cross-session caching support don't see an unrecognized scope field.
     */
    useGlobalCacheScope?: boolean;
}
export declare class AnthropicContentConverter {
    private model;
    private schemaCompliance;
    private enableCacheControl;
    constructor(model: string, schemaCompliance?: SchemaComplianceMode, enableCacheControl?: boolean);
    convertGeminiRequestToAnthropic(request: GenerateContentParameters, options?: ConvertGeminiRequestToAnthropicOptions): {
        system?: AnthropicTextBlockParam[] | string;
        messages: AnthropicMessageParam[];
    };
    convertGeminiToolsToAnthropic(geminiTools: ToolListUnion, options?: {
        enableCacheControl?: boolean;
        useGlobalCacheScope?: boolean;
    }): Promise<AnthropicToolParam[]>;
    convertAnthropicResponseToGemini(response: Anthropic.Message): GenerateContentResponse;
    private processContents;
    private processContent;
    private createToolResultBlock;
    private createMediaBlockFromPart;
    private isSupportedAnthropicImageMimeType;
    private extractTextFromContentUnion;
    private extractFunctionResponseContent;
    private safeInputToArgs;
    mapAnthropicFinishReasonToGemini(reason?: string | null): FinishReason | undefined;
    private isContentObject;
    /**
     * Build system content blocks with cache_control.
     * Anthropic prompt caching requires cache_control on system content.
     * When `useGlobalCacheScope` is set, attach `scope: 'global'` so the
     * system prefix participates in cross-session caching under the
     * `prompt-caching-scope-2026-01-05` beta. Otherwise emit the standard
     * per-session shape so non-Anthropic baseURLs aren't sent a scope
     * extension they may not recognize.
     */
    private buildSystemWithCacheControl;
    /**
     * Remove thinking and redacted_thinking blocks from assistant messages.
     * Used by DeepSeek when thinking mode is off but session history still
     * has `thought: true` parts — keeps the request body in sync with the
     * absent top-level `thinking` config.
     *
     * If stripping would leave an assistant message with no content blocks
     * (a thinking-only turn, e.g. one cut off by max_tokens before any text
     * or tool_use was emitted), we keep the original blocks. An empty
     * `content: []` is rejected by the Anthropic API, and dropping the
     * message would break the required user/assistant alternation. DeepSeek
     * empirically tolerates the residual `thinking-block + no-thinking-config`
     * shape (verified against api.deepseek.com/anthropic), so leaving it as
     * an unaltered passthrough is the safer fallback.
     */
    private stripThinkingFromAssistantMessages;
    /**
     * Fill in `signature: ''` on every assistant `thinking` block that lacks
     * a `signature` field. Preserves the original thinking text. Common cases:
     *
     * - Cross-provider history where the upstream generator (OpenAI / Gemini /
     *   agent-runtime) only set `thought: true` without a signature.
     * - `redacted_thinking` blocks whose `data` field didn't survive the
     *   round-trip through Gemini Part format.
     *
     * DeepSeek empirically accepts empty signatures, so this keeps the wire
     * shape spec-compliant without discarding any preserved thinking text.
     */
    private fillMissingThinkingSignatures;
    /**
     * DeepSeek's anthropic-compatible API rejects follow-up requests when an
     * assistant turn carrying `tool_use` omits a thinking block while thinking
     * mode is on, returning HTTP 400 ("The content[].thinking in the thinking
     * mode must be passed back to the API."). The model can legitimately
     * return a tool round without thinking content, so prepend a synthetic
     * empty thinking block when one is missing.
     *
     * Live verification against api.deepseek.com/anthropic confirmed the
     * trigger is specific to tool_use turns — plain-text assistant turns
     * without thinking are accepted unchanged. We mirror that boundary here
     * to avoid bloating replay history with synthetic blocks for turns the
     * API already accepts.
     *
     * Should be paired with `fillMissingThinkingSignatures` running first
     * so that signature-less `thinking` blocks become compliant in place
     * (preserving their original text), and this pass then sees them as
     * already-satisfying. https://github.com/QwenLM/qwen-code/issues/3786
     */
    private injectEmptyThinkingOnToolUseTurns;
    /**
     * Add cache_control to the last user message's content.
     * This enables prompt caching for the conversation context.
     *
     * Deliberately emits the per-session `{ type: 'ephemeral' }` shape only —
     * no `scope: 'global'`. The last user message changes every turn (it's
     * the live prompt and any tool_result blocks from the immediately prior
     * round), so cross-session reuse here has effectively zero hit rate and
     * paying the global-scope overhead would just churn cache. System text
     * and tool prefixes (which DO repeat across sessions) carry
     * `scope: 'global'` instead.
     */
    private addCacheControlToMessages;
}
export {};
