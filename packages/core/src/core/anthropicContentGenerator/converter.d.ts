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
  ttl?: '5m' | '1h';
};
type AnthropicToolParam = Anthropic.Tool & {
  cache_control?: AnthropicCacheControl;
};
type AnthropicTextBlockParam = Anthropic.TextBlockParam & {
  cache_control?: AnthropicCacheControl;
};
/**
 * Internal token for "how long should a cache anchor live?", resolved from
 * `ContentGeneratorConfig.cacheRetention` (settings.json:
 * `model.generationConfig.cacheRetention`), threaded into the converter
 * per-call alongside `enableCacheControl`/`useGlobalCacheScope`.
 *
 * `'ephemeral'` (default) omits `ttl` on the wire — spec default is 5m.
 * `'1h'` requests the extended cache tier (`ttl: '1h'`) unconditionally --
 * live verification against the Anthropic Messages API found every
 * currently-active model (Haiku 4.5 through Opus 4.8 and Sonnet 5) accepts
 * it, so there is no known model-specific allowlist to gate on. If a future
 * model rejects it, the 400 from Anthropic surfaces directly to the caller
 * rather than being silently masked by an incomplete allowlist.
 */
export type CacheRetention = 'ephemeral' | '1h';
/**
 * Per-anchor override of {@link CacheRetention}. Keys are the three cache
 * anchors this converter places `cache_control` on — the system text
 * block, the last tool definition, and the trailing user message (a
 * single anchor; this converter marks only one trailing user message with
 * cache_control, not a sliding multi-turn window). Missing keys inherit
 * the top-level retention.
 *
 * These render on the wire in a fixed order — `tool` -> `system` ->
 * `user.last` — and Anthropic requires cache entries with a longer TTL to
 * appear before shorter ones. Resolution (see `resolveCacheRetention`)
 * normalizes for this automatically: setting one anchor to `'1h'`
 * promotes every anchor before it on the wire to `'1h'` as well, so any
 * combination of overrides here produces a legal request body.
 */
export type CacheRetentionByBlock = Partial<
  Record<'system' | 'tool' | 'user.last', CacheRetention>
>;
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
   * Remove assistant thinking blocks whose opaque signature is missing or
   * empty. Completed turns can safely omit thinking during replay. The active
   * tool loop fails instead because Claude requires all of its thinking blocks
   * to be passed back complete and unmodified.
   */
  dropUnsignedAssistantThinking?: boolean;
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
   * Strip a trailing assistant message that would otherwise be sent as an
   * "assistant-turn prefill" (a request whose final message has
   * `role: 'assistant'`). Anthropic Opus/Sonnet 4.6+ (and every 5.x
   * family — Fable 5, Mythos 5, …) reject prefill outright:
   *
   *   "This model does not support assistant message prefill. The
   *    conversation must end with a user message."
   *
   * Per Anthropic's own migration guidance this is a model-generation
   * change, not a backend quirk — it 400s identically on the native API,
   * Vertex AI, and Bedrock for every 4.6+ model.
   *
   * A trailing assistant message reaches the converter when Gemini history
   * ends on a model turn with no follow-up (e.g. context-window trimming
   * drops the next user turn, or a subagent's transcript is replayed
   * mid-turn). Two cases are handled:
   *   - The trailing assistant message is empty/whitespace-only (a
   *     leftover prefill artifact with no real content) — drop it.
   *   - The trailing assistant message carries real content (text,
   *     tool_use, thinking) — keep it in history but append a synthetic
   *     user turn so the request satisfies "must end with a user message"
   *     without discarding anything the model already said.
   *
   * Only meaningful when the active model requires adaptive thinking
   * (Claude 4.6+); older models accept prefill on every backend, so this
   * should be gated on `modelSupportsAdaptiveThinking()` in the caller.
   */
  stripTrailingAssistantPrefill?: boolean;
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
  /**
   * The cross-session-stable prefix of the system prompt (everything the
   * client assembles before appending volatile tails like git status or
   * session-start context). When it exactly matches the beginning of the
   * request's system text and a suffix follows, the system prompt is split
   * into two text blocks with one cache breakpoint each, making the stable
   * prefix independently cacheable. No match (subagent prompts, stale
   * prefix) falls back to the single-block layout — fail-open, never worse
   * than before. Only meaningful when `enableCacheControl` is on.
   */
  staticSystemPrefix?: string;
  /**
   * Default Anthropic `cache_control` retention for every cache anchor
   * (system text, last tool, trailing user message) unless overridden
   * per-anchor by {@link cacheRetentionByBlock}. `'ephemeral'` (default)
   * omits `ttl` on the wire (spec default is 5m); `'1h'` requests the
   * extended cache tier. See {@link CacheRetention}.
   */
  cacheRetention?: CacheRetention;
  /**
   * Per-anchor override of {@link cacheRetention}. See
   * {@link CacheRetentionByBlock}.
   */
  cacheRetentionByBlock?: CacheRetentionByBlock;
}
export declare class AnthropicContentConverter {
  private schemaCompliance;
  private enableCacheControl;
  /**
   * Per-request tool ID sanitization state (see {@link resolveToolUseId}).
   * The converter instance is long-lived across requests (constructed once
   * per generator), so this state is reset at the top of every
   * `convertGeminiRequestToAnthropic` call rather than at construction.
   */
  private readonly toolIdMap;
  private readonly usedToolIds;
  private generatedToolIdCounter;
  constructor(
    _model: string,
    schemaCompliance?: SchemaComplianceMode,
    enableCacheControl?: boolean,
  );
  convertGeminiRequestToAnthropic(
    request: GenerateContentParameters,
    options?: ConvertGeminiRequestToAnthropicOptions,
  ): {
    system?: AnthropicTextBlockParam[] | string;
    messages: AnthropicMessageParam[];
  };
  convertGeminiToolsToAnthropic(
    geminiTools: ToolListUnion,
    options?: {
      enableCacheControl?: boolean;
      useGlobalCacheScope?: boolean;
      cacheRetention?: CacheRetention;
      cacheRetentionByBlock?: CacheRetentionByBlock;
    },
  ): Promise<AnthropicToolParam[]>;
  convertAnthropicResponseToGemini(
    response: Anthropic.Message,
  ): GenerateContentResponse;
  private processContents;
  private processContent;
  private createToolResultBlock;
  private resetToolIdState;
  /**
   * Resolve a `functionCall.id` / `functionResponse.id` into a wire-safe
   * `tool_use.id` / `tool_result.tool_use_id`. Anthropic validates both
   * fields against `^[a-zA-Z0-9_-]+$` server-side (HTTP 400 otherwise) and
   * rejects the empty string the same way, since `+` requires at least one
   * character. The Gemini lingua-franca's `id` field has no such
   * constraint -- it can carry another provider's ID scheme, a
   * composite/namespaced ID, or be entirely absent.
   *
   * The same source ID always resolves to the same wire ID within a
   * request (memoized in `toolIdMap`), so a `tool_use`/`tool_result` pair
   * that shares a source ID still links up correctly after sanitization.
   * State is scoped to a single `convertGeminiRequestToAnthropic` call
   * (reset via {@link resetToolIdState}), since the converter instance
   * itself is long-lived across requests.
   */
  private resolveToolUseId;
  private sanitizeToolUseId;
  private nextGeneratedToolId;
  private makeUniqueToolUseId;
  private createMediaBlockFromPart;
  private isSupportedAnthropicImageMimeType;
  private extractTextFromContentUnion;
  private extractFunctionResponseContent;
  private safeInputToArgs;
  mapAnthropicFinishReasonToGemini(
    reason?: string | null,
  ): FinishReason | undefined;
  private isContentObject;
  /**
   * Resolve the effective {@link CacheRetention} for one cache anchor,
   * normalized so retention is monotonically non-increasing in wire order.
   *
   * Render order is `tools` -> `system` -> `messages`, so this converter's
   * three anchors sit on the wire in exactly that order: `tool` -> `system`
   * -> `user.last`. Anthropic requires "cache entries with longer TTL must
   * appear before shorter TTLs" — an anchor at the spec's 5-minute default
   * (no `ttl`) is a short-TTL entry for this rule's purposes, so a raw
   * per-anchor override like `cacheRetentionByBlock: { system: '1h' }`
   * would otherwise leave the (still 5m-default) `tool` anchor ahead of a
   * 1h `system` anchor on the wire — an ordering violation Anthropic 400s
   * on.
   *
   * Resolving with a scan instead of a straight per-anchor lookup avoids
   * that: `anchor` resolves to `'1h'` if `anchor` itself OR any anchor
   * later on the wire resolves to `'1h'`. That makes every
   * `cacheRetentionByBlock` configuration legal — anchors before a `'1h'`
   * anchor are promoted to `'1h'` too — without adding a new error surface
   * or rejecting any input. `{ tool: '1h' }` alone is unaffected (nothing
   * follows it that needs promoting); `{ system: '1h' }` alone now also
   * promotes `tool` to `'1h'`, which is exactly the "cache my big system
   * prompt for an hour" usage the per-anchor override exists for.
   */
  private resolveCacheRetention;
  /**
   * Build system content blocks with cache_control.
   * Anthropic prompt caching requires cache_control on system content.
   * When `useGlobalCacheScope` is set, attach `scope: 'global'` so the
   * system prefix participates in cross-session caching under the
   * `prompt-caching-scope-2026-01-05` beta. Otherwise emit the standard
   * per-session shape so non-Anthropic baseURLs aren't sent a scope
   * extension they may not recognize.
   *
   * When `staticSystemPrefix` matches the beginning of the system text and
   * a suffix follows (git status, session-start context — the volatile
   * tails the client appends after the stable prompt), the text is split
   * into two blocks carrying one breakpoint each:
   *   1. the stable prefix — scoped per `useGlobalCacheScope`, so new
   *      sessions reuse it even though their suffix differs;
   *   2. the end of the full system prompt — always the per-session
   *      `{ type: 'ephemeral' }` shape. The suffix varies across sessions,
   *      so a global-scope entry here would churn cache for zero hits
   *      (same reasoning as `addCacheControlToMessages`). Within a session
   *      it still caches the suffix, and when the suffix changes mid-session
   *      (/cd refreshes git status, session-start context lands) the prefix
   *      breakpoint keeps the big block from re-billing.
   * The split only shapes the outgoing request; stored history and
   * non-Anthropic transports keep seeing a single system string.
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
  private dropUnsignedThinkingFromAssistantMessages;
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
   * Strip a trailing empty-content assistant message, or append a
   * synthetic user turn to satisfy Anthropic's "must end with a user
   * message" requirement (Opus/Sonnet 4.6+, every 5.x family) when the
   * conversation would otherwise end on a non-empty assistant message.
   * See {@link ConvertGeminiRequestToAnthropicOptions.stripTrailingAssistantPrefill}.
   */
  private stripTrailingAssistantPrefill;
  private isEmptyAssistantMessage;
  /**
   * Add cache_control to the last user message's content.
   * This enables prompt caching for the conversation context.
   *
   * Deliberately emits the per-session `{ type: 'ephemeral' }` shape only —
   * no `scope: 'global'`. The last user message changes every turn (it's
   * the live prompt and any tool_result blocks from the immediately prior
   * round), so cross-session reuse here has effectively zero hit rate and
   * paying the global-scope overhead would just churn cache. The static
   * system prefix and tool prefixes (which DO repeat across sessions) carry
   * `scope: 'global'` instead.
   */
  private addCacheControlToMessages;
}
export {};
