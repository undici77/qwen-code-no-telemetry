import OpenAI from 'openai';
import type { GenerateContentConfig } from '@google/genai';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import type { DashScopeRequestMetadata } from './types.js';
import { DefaultOpenAICompatibleProvider } from './default.js';
export type DashScopeThinkingKnobSelection = {
  source: 'extra_body' | 'samplingParams' | 'reasoning';
  field: 'enable_thinking' | 'reasoning_effort' | 'thinking_budget';
  value: unknown;
};
/**
 * Select the effective tiered-Qwen thinking knob using the same layer and
 * same-layer precedence as the request builder. Keeping this decision shared
 * lets UI reporters describe the value that will actually reach the wire.
 */
export declare function selectDashScopeThinkingKnob(
  model: string | undefined,
  extraBody: Record<string, unknown> | undefined,
  samplingParams: Record<string, unknown> | undefined,
  reasoningEffort: unknown,
): DashScopeThinkingKnobSelection | undefined;
/**
 * Official DashScope regional API hosts (matched exactly or as a parent
 * domain of the endpoint hostname). Shared with the WebSearch side channel's
 * endpoint gate (tools/web-search.ts) so a new region is added in one place.
 */
export declare const DASHSCOPE_REGIONAL_HOSTS: readonly string[];
export declare class DashScopeOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
  constructor(
    contentGeneratorConfig: ContentGeneratorConfig,
    cliConfig: Config,
  );
  /**
   * Determines whether to use the DashScope-compatible provider.
   * Covers the official regional hosts (DASHSCOPE_REGIONAL_HOSTS),
   * Token Plan endpoints under token-plan.<region>.maas.aliyuncs.com,
   * internal Alibaba domains (*.alibaba-inc.com, *.aliyun-inc.com),
   * and proxy matches.
   *
   * Note: any *.alibaba-inc.com / *.aliyun-inc.com host is treated as a
   * DashScope-compatible endpoint by design. Keep this generic and avoid
   * embedding individual private gateway hostnames in provider detection.
   */
  static isDashScopeProvider(
    contentGeneratorConfig: ContentGeneratorConfig,
  ): boolean;
  buildHeaders(): Record<string, string | undefined>;
  buildClient(): OpenAI;
  /**
   * Build and configure the request for DashScope API.
   *
   * This method applies DashScope-specific configurations including:
   * - Cache control for the system message, last tool message (when tools are configured),
   *   and the latest history message
   * - Output token limits based on model capabilities
   * - Vision model specific parameters (vl_high_resolution_images)
   * - Request metadata for session tracking
   *
   * @param request - The original chat completion request parameters
   * @param userPromptId - Unique identifier for the user prompt for session tracking
   * @returns Configured request with DashScope-specific parameters applied
   */
  buildRequest(
    request: OpenAI.Chat.ChatCompletionCreateParams,
    userPromptId: string,
  ): OpenAI.Chat.ChatCompletionCreateParams;
  /**
   * Shared tail for the vision and text branches: merge user extra_body
   * last, then resolve thinking-knob conflicts against the wire model.
   */
  private mergeExtraBodyAndResolveKnobs;
  private resolveWireModel;
  /**
   * Translate the unified reasoning effort into the wire shape the model
   * accepts. The qwen3.8-max family takes the tiered `reasoning_effort`
   * directly; older qwen hybrid models expose only the on/off
   * `enable_thinking` switch, so the effort ladder collapses to on/off
   * there. Gated to qwen-family wire models (mirroring the pipeline's
   * disable gate) so the qwen-specific fields never leak to a non-qwen
   * model sharing the DashScope endpoint.
   */
  private buildQwenEffortConfig;
  /**
   * Resolve thinking knobs that conflict with a shipping `reasoning_effort`.
   * Preset extra_body injects `enable_thinking` for models declared with
   * enableThinking (provider-config.ts), and user extra_body merges last.
   * Only the qwen3.8-max family reads `reasoning_effort` itself — there an
   * effort tier ships alone: an `enable_thinking: true` alongside an effort
   * tier is a second competing knob (the shape the nested-`reasoning` strip
   * in buildRequest exists to prevent), and DashScope rejects
   * `reasoning_effort` combined with `thinking_budget`. The `'none'`
   * disable and a winning `thinking_budget` intentionally keep a co-present
   * `enable_thinking: true`. Explicit same-layer effort/budget pairs retain
   * reasoning_effort, matching the provider's behavior before cross-layer
   * resolution. An explicit `enable_thinking: false` is the documented
   * extra_body escape hatch winning over the config tier, so it is honoured
   * as the family's canonical disable (`reasoning_effort: 'none'`, preserved
   * by the pipeline's disable strip) rather than silently deleted; a
   * higher-priority `enable_thinking: true` conversely keeps the shipping
   * tier. Older qwen
   * hybrids read `enable_thinking` / `thinking_budget`, not
   * `reasoning_effort`, so when an opaque reasoning_effort override
   * conflicts with a meaningful thinking_budget the inert field goes and
   * the knobs the model reads survive. Non-qwen models treat
   * `reasoning_effort` as an opaque sampling override and keep every knob.
   */
  private dropConflictingThinkingKnobs;
  private warnConflictingKnobDrop;
  private conflictingKnobDropWarned;
  buildMetadata(userPromptId: string): DashScopeRequestMetadata;
  getDefaultGenerationConfig(): GenerateContentConfig;
  /**
   * Add cache control flag to specified message(s) for DashScope providers
   */
  private addDashScopeCacheControl;
  private addCacheControlToTools;
  /**
   * Add cache control to message content, handling both string and array formats
   */
  private addCacheControlToContent;
  /**
   * Normalize content to array format
   */
  private normalizeContentToArray;
  /**
   * Add cache control to the content array
   */
  private addCacheControlToContentArray;
  /**
   * True for glm-* models (e.g. glm-4.5, glm-5.2). Uses the same `^glm-` prefix
   * convention as the GLM matchers in tokenLimits.ts, keeping model detection
   * consistent across the codebase.
   */
  private isGlmModel;
  /**
   * Whether the request is in "function-calling mode" — it declares `tools`, or
   * its history already contains a tool result / assistant tool_call. glm needs
   * one of these present to parse structured content-part arrays.
   */
  private hasFunctionCallingContext;
  /**
   * Collapse text-only content arrays back to a plain string, leaving
   * media-bearing parts (image/audio/...) as arrays. Used for glm tool-less
   * requests, where the array form would otherwise be dropped server-side.
   * Multiple text parts are joined with a blank line, matching the DeepSeek
   * provider's flattening (separate parts read as separate blocks).
   * Only called on the flatten branch, which skips cache control, so no part
   * here carries a `cache_control` marker.
   */
  private flattenTextContent;
  /**
   * Vision-capable model patterns.
   * Supports exact matches and prefix patterns for easy extension.
   */
  private static readonly VISION_MODEL_EXACT_MATCHES;
  private static readonly VISION_MODEL_PREFIX_PATTERNS;
  private isVisionModel;
  /**
   * Check if cache control should be disabled based on configuration.
   *
   * @returns true if cache control should be enabled, false otherwise
   */
  private shouldEnableCacheControl;
}
