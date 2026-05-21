/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type OpenAI from 'openai';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DefaultOpenAICompatibleProvider } from './default.js';
import type { OpenAIRequestContextOverrides } from './types.js';
export declare function isMiMoProvider(contentGeneratorConfig: ContentGeneratorConfig): boolean;
export declare class MiMoOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
    constructor(contentGeneratorConfig: ContentGeneratorConfig, cliConfig: Config);
    static isMiMoProvider: typeof isMiMoProvider;
    buildRequest(request: OpenAI.Chat.ChatCompletionCreateParams, userPromptId: string): OpenAI.Chat.ChatCompletionCreateParams;
    getRequestContextOverrides(): OpenAIRequestContextOverrides;
}
