/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  GenerateContentResponse,
  type CountTokensParameters,
  type CountTokensResponse,
  type EmbedContentParameters,
  type EmbedContentResponse,
  type GenerateContentParameters,
} from '@google/genai';
import type { Config } from '../../config/config.js';
import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from '../contentGenerator.js';
/**
 * A decorator that wraps a ContentGenerator to add logging to API calls.
 */
export declare class LoggingContentGenerator implements ContentGenerator {
  private readonly wrapped;
  private readonly config;
  private openaiLogger?;
  private schemaCompliance?;
  private modalities?;
  private splitToolMedia?;
  private toolResultContentFormat?;
  private readonly generatorAuthType;
  private readonly genAiProviderName;
  private readonly genAiOperationName;
  constructor(
    wrapped: ContentGenerator,
    config: Config,
    generatorConfig: ContentGeneratorConfig,
  );
  getWrapped(): ContentGenerator;
  private logApiRequest;
  private _logApiResponse;
  private _logApiError;
  private safelyLogApiError;
  private safelyLogApiResponse;
  generateContent(
    req: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse>;
  generateContentStream(
    req: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>>;
  private startCaptureSession;
  private loggingStreamWrapper;
  private buildOpenAIRequestForLogging;
  private createLoggingRequestContext;
  private logOpenAIInteraction;
  private safelyLogOpenAIInteraction;
  private convertGeminiResponseToOpenAIForLogging;
  private consolidateGeminiResponsesForLogging;
  private extractResponseText;
  private forEachVisibleResponseText;
  private getVisibleResponsePartText;
  private shouldCollectSensitiveSpanAttributes;
  countTokens(req: CountTokensParameters): Promise<CountTokensResponse>;
  embedContent(req: EmbedContentParameters): Promise<EmbedContentResponse>;
  useSummarizedThinking(): boolean;
  private toContents;
  private toContent;
  private toParts;
  private toPart;
}
