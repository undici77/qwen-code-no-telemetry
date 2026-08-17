/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  Content,
  GenerateContentConfig,
  GenerateContentResponseUsageMetadata,
  Part,
} from '@google/genai';
import type { Config } from '../config/config.js';
import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from './contentGenerator.js';
/**
 * The pair of generator and retry-authType to use for a request targeting
 * a specific model. When the requested model differs from the main session
 * model, both fields are resolved against that model's provider so that
 * per-model `extra_body` / `samplingParams` / reasoning settings — and
 * provider-specific retry/quota behaviour — do not leak from the main
 * session.
 */
export interface ResolvedGeneratorForModel {
  contentGenerator: ContentGenerator;
  contentGeneratorConfig: ContentGeneratorConfig;
  retryAuthType: string | undefined;
  retryErrorCodes?: readonly number[];
  model: string;
}
/**
 * Options for the generateText utility function.
 */
export interface GenerateTextOptions {
  /** The input prompt or history. */
  contents: Content[];
  /** The specific model to use for this task. */
  model: string;
  /**
   * Task-specific system instructions. Passed through to the underlying
   * content generator without the geminiClient main-prompt fallback or
   * user-memory wrapping that `getCustomSystemPrompt` applies.
   */
  systemInstruction?: GenerateContentConfig['systemInstruction'];
  /**
   * Overrides for generation configuration (e.g., temperature, thinkingConfig,
   * or cache-prefix-preserving tool declarations).
   */
  config?: Omit<GenerateContentConfig, 'systemInstruction' | 'abortSignal'>;
  /** Signal for cancellation. */
  abortSignal: AbortSignal;
  /**
   * A unique ID for the prompt, used for logging/telemetry correlation.
   */
  promptId?: string;
  /**
   * The maximum number of attempts for the request.
   */
  maxAttempts?: number;
  /**
   * Stream the response instead of awaiting the whole non-streaming body.
   * Defaults to `false` (unchanged non-streaming behavior). Opt in to keep the
   * HTTP connection alive against BFF gateways whose `proxy_read_timeout` would
   * otherwise kill a slow inference before the first byte arrives. The streamed
   * deltas are collected into the same `{ text, usage }` result.
   */
  stream?: boolean;
  /**
   * Let the OpenAI adapter mark the unchanged history prefix for cache reuse.
   * This is only for requests ending in a non-reusable trailing directive;
   * the adapter deliberately excludes the final message from cache marking.
   */
  promptCacheSharing?: boolean;
  /**
   * When true, throw instead of silently falling back to the main generator if
   * a distinct generator for `model` can't be created (model not registered, or
   * generator creation fails — e.g. a missing cross-provider credential). The
   * vision bridge sets this so image payloads are never routed at the text-only
   * primary while a notice names a different vision endpoint; it fails the
   * conversion closed instead.
   */
  failClosed?: boolean;
}
/**
 * Result of a generateText call.
 */
export interface GenerateTextResult {
  text: string;
  usage: GenerateContentResponseUsageMetadata | undefined;
  /** Whether the response contained a function call. No call is executed here. */
  hadToolCall?: boolean;
}
/**
 * Options for the generateJson utility function.
 */
export interface GenerateJsonOptions {
  /** The input prompt or history. */
  contents: Content[];
  /** The required JSON schema for the output. */
  schema: Record<string, unknown>;
  /** The specific model to use for this task. */
  model: string;
  /**
   * Task-specific system instructions.
   * If omitted, no system instruction is sent.
   */
  systemInstruction?: string | Part | Part[] | Content;
  /**
   * Overrides for generation configuration (e.g., temperature).
   */
  config?: Omit<
    GenerateContentConfig,
    | 'systemInstruction'
    | 'responseJsonSchema'
    | 'responseMimeType'
    | 'tools'
    | 'abortSignal'
  >;
  /** Signal for cancellation. */
  abortSignal: AbortSignal;
  /**
   * A unique ID for the prompt, used for logging/telemetry correlation.
   */
  promptId?: string;
  /**
   * The maximum number of attempts for the request.
   */
  maxAttempts?: number;
}
/**
 * A client dedicated to stateless, utility-focused LLM calls.
 */
export declare class BaseLlmClient {
  private readonly contentGenerator;
  private readonly config;
  /**
   * Cache of per-model ContentGenerators keyed by model ID. Avoids rebuilding
   * the generator (SDK instantiation, config resolution) on every side query.
   * Cleared via {@link clearPerModelGeneratorCache} when the session resets.
   */
  private readonly perModelGeneratorCache;
  constructor(contentGenerator: ContentGenerator, config: Config);
  private getCurrentContentGenerator;
  generateJson(options: GenerateJsonOptions): Promise<Record<string, unknown>>;
  /**
   * Free-form text generation primitive used by `runSideQuery` text mode.
   *
   * Distinct from `GeminiClient.generateContent`: this calls the underlying
   * `ContentGenerator` directly, so the caller's `systemInstruction` is sent
   * through verbatim — no `getCustomSystemPrompt` wrapping (which would append
   * user memory) and no main-session-prompt fallback when omitted. Side queries
   * need that contract; the main turn does not.
   */
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;
  generateEmbedding(texts: string[]): Promise<number[][]>;
  /**
   * Resolve the ContentGenerator and retry authType for a request targeting
   * a specific model.
   *
   * When the requested model matches the main session model, returns the
   * constructor-injected generator and the main session's authType. When it
   * differs (e.g. a fast model on a different provider), constructs and caches
   * a per-model generator with that provider's auth, baseUrl, sampling, and
   * extra_body settings — and reports the target provider as the retry
   * authType so quota detection and provider-specific retry logic line up.
   *
   * Falls back to the main generator when the target model is not registered
   * or generator creation fails (e.g. tests without full auth setup).
   */
  resolveForModel(
    model: string,
    opts?: {
      failClosed?: boolean;
    },
  ): Promise<ResolvedGeneratorForModel>;
  /**
   * Drop cached per-model ContentGenerators. Called on session reset so that
   * the next side query picks up updated provider settings.
   */
  clearPerModelGeneratorCache(): void;
  /**
   * Resolve a model across all authTypes. Handles the case where the target
   * model is registered under a different authType than the main model
   * (e.g. main=QWEN_OAUTH, fast=USE_ANTHROPIC).
   */
  private resolveModelAcrossAuthTypes;
  private createRuntimeViewForModel;
  private resolveModelSelector;
}
