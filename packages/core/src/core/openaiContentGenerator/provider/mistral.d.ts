/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type OpenAI from 'openai';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DefaultOpenAICompatibleProvider } from './default.js';
export declare function isMistralProvider(config: ContentGeneratorConfig): boolean;
/**
 * Mistral's OpenAI-compatible endpoint rejects non-standard
 * `messages[].reasoning_content` fields. Keep shared conversation history
 * intact and remove the field only at the outbound request boundary.
 */
export declare class MistralOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
    static isMistralProvider: typeof isMistralProvider;
    buildRequest(request: OpenAI.Chat.ChatCompletionCreateParams, userPromptId: string): OpenAI.Chat.ChatCompletionCreateParams;
}
