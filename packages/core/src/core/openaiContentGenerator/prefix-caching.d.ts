/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type OpenAI from 'openai';
import { type ContentGeneratorConfig } from '../contentGenerator.js';
export declare function supportsOpenAIPrefixCaching(
  contentGeneratorConfig: ContentGeneratorConfig,
): boolean;
export declare function isOfficialOpenAIEndpoint(
  contentGeneratorConfig: ContentGeneratorConfig,
): boolean;
export declare function supportsExplicitOpenAIPromptCaching(
  model: string,
): boolean;
export declare function applyOfficialOpenAIPromptCaching(
  request: OpenAI.Chat.ChatCompletionCreateParams,
  sessionId: string | undefined,
  cacheSharing: boolean,
  cacheKeyPartition?: string,
): OpenAI.Chat.ChatCompletionCreateParams;
