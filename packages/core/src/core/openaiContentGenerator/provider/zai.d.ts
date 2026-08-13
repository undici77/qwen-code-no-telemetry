/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type OpenAI from 'openai';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DefaultOpenAICompatibleProvider } from './default.js';
/**
 * Hostname check for Z.ai / Zhipu GLM endpoints. GLM's OpenAI-compatible
 * chat-completions endpoint takes a flat `reasoning_effort` field (GLM-5.2+),
 * not the nested `reasoning: { effort }` object the OpenAI pipeline passes
 * through by default — see https://docs.z.ai/guides/capabilities/thinking.
 *
 * Hostname-gated so the reshape never leaks to an unrelated strict
 * OpenAI-compatible backend matched only by model name.
 */
export declare function isZaiHostname(contentGeneratorConfig: ContentGeneratorConfig): boolean;
/**
 * Broader routing check: hostname OR a `glm-*` model name. Only the hostname
 * gate drives the wire reshape (see buildRequest); the model-name fallback just
 * routes obviously-GLM configs through this provider.
 */
export declare function isZaiProvider(contentGeneratorConfig: ContentGeneratorConfig): boolean;
export declare class ZaiOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
    static isZaiProvider: typeof isZaiProvider;
    static isZaiHostname: typeof isZaiHostname;
    private nonZaiHostnameFlattenWarned;
    buildRequest(request: OpenAI.Chat.ChatCompletionCreateParams, userPromptId: string): OpenAI.Chat.ChatCompletionCreateParams;
}
