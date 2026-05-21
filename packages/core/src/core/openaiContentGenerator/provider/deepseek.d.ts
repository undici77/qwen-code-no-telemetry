/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type OpenAI from 'openai';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DefaultOpenAICompatibleProvider } from './default.js';
import type { GenerateContentConfig } from '@google/genai';
/**
 * Hostname-only check used to decide whether `reasoning.effort` should be
 * rewritten into DeepSeek's flat `reasoning_effort` body parameter, and
 * whether to emit `thinking: { type: 'disabled' }` when reasoning is
 * turned off. The broader `isDeepSeekProvider` falls back to model-name
 * matching to cover self-hosted deployments (sglang/vllm/ollama) — that
 * fallback is right for content-part flattening (a model-format
 * constraint) but trusting it for the body-shape rewrite would push a
 * DeepSeek extension at strict OpenAI-compat backends that may not
 * accept it. Keep the two decisions separated.
 *
 * Parses the baseUrl with `new URL(...)` and matches the hostname
 * against `api.deepseek.com` (and its subdomains) exactly — a naive
 * substring check would false-positive on hostile hosts like
 * `https://api.deepseek.com.evil.com/v1`. Invalid URLs are treated as
 * non-DeepSeek. Mirrors `isDeepSeekAnthropicHostname` on the Anthropic
 * side.
 *
 * Exposed as a free function so consumers (the pipeline post-processing
 * hook, in particular) can run the check without coupling to the
 * concrete `DeepSeekOpenAICompatibleProvider` class.
 */
export declare function isDeepSeekHostname(contentGeneratorConfig: ContentGeneratorConfig): boolean;
/**
 * Broad detection used to select the DeepSeek provider class for
 * content-part flattening: hostname OR model-name. Self-hosted
 * deployments (sglang/vllm/ollama) running DeepSeek models share the
 * same input-format constraint, so the model-name fallback is
 * intentional. For decisions that depend on the wire shape DeepSeek's
 * own API exposes (e.g. `reasoning_effort`, `thinking`), use
 * `isDeepSeekHostname` instead — see https://github.com/QwenLM/qwen-code/issues/3613.
 */
export declare function isDeepSeekProvider(contentGeneratorConfig: ContentGeneratorConfig): boolean;
export declare class DeepSeekOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
    constructor(contentGeneratorConfig: ContentGeneratorConfig, cliConfig: Config);
    /**
     * Backward-compatible static delegates for the free `isDeepSeek*`
     * helpers. New call sites should import the free functions directly to
     * avoid coupling to this class.
     */
    static isDeepSeekProvider: typeof isDeepSeekProvider;
    static isDeepSeekHostname: typeof isDeepSeekHostname;
    /**
     * DeepSeek's API requires message content to be a plain string, not an
     * array of content parts. Flatten any text-part arrays into joined
     * strings; non-text parts (image_url, audio, …) are replaced with a
     * `[Unsupported content type: <type>]` placeholder so the request still
     * goes through with a textual breadcrumb rather than silently dropping
     * the part or raising mid-conversation. Also translate the standard
     * `reasoning.effort` config into DeepSeek's flat `reasoning_effort`
     * body parameter — but only on actual DeepSeek hostnames, since the
     * model-name fallback above can match self-hosted/strict OpenAI-compat
     * backends that don't accept the DeepSeek extension.
     */
    buildRequest(request: OpenAI.Chat.ChatCompletionCreateParams, userPromptId: string): OpenAI.Chat.ChatCompletionCreateParams;
    getDefaultGenerationConfig(): GenerateContentConfig;
}
