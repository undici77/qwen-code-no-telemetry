/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import type { OpenAIResponseParsingOptions } from '../responseParsingOptions.js';
import { DefaultOpenAICompatibleProvider } from './default.js';
export declare class MiniMaxOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
    static isMiniMaxProvider(config: ContentGeneratorConfig): boolean;
    getResponseParsingOptions(): OpenAIResponseParsingOptions;
}
