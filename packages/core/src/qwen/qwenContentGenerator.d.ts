/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { OpenAIContentGenerator } from '../core/openaiContentGenerator/index.js';
import type { IQwenOAuth2Client } from './qwenOAuth2.js';
import { type Config } from '../config/config.js';
import type { GenerateContentParameters, GenerateContentResponse, CountTokensParameters, CountTokensResponse, EmbedContentParameters, EmbedContentResponse } from '@google/genai';
import type { ContentGeneratorConfig } from '../core/contentGenerator.js';
/**
 * Qwen Content Generator that uses Qwen OAuth tokens with automatic refresh
 */
export declare class QwenContentGenerator extends OpenAIContentGenerator {
    private readonly debugLogger;
    private qwenClient;
    private sharedManager;
    private currentToken?;
    constructor(qwenClient: IQwenOAuth2Client, contentGeneratorConfig: ContentGeneratorConfig, cliConfig: Config);
    /**
     * Get the current endpoint URL with proper protocol and /v1 suffix
     */
    private getCurrentEndpoint;
    /**
     * Override error logging behavior to suppress auth errors during token refresh
     */
    protected shouldSuppressErrorLogging(error: unknown, _request: GenerateContentParameters): boolean;
    /**
     * Get valid token and endpoint using the shared token manager
     */
    private getValidToken;
    /**
     * Execute an operation with automatic credential management and retry logic.
     * This method handles:
     * - Dynamic token and endpoint retrieval
     * - Client configuration updates
     * - Retry logic on authentication errors with token refresh
     *
     * @param operation - The operation to execute with updated client configuration
     * @returns The result of the operation
     */
    private executeWithCredentialManagement;
    /**
     * Override to use dynamic token and endpoint with automatic retry
     */
    generateContent(request: GenerateContentParameters, userPromptId: string): Promise<GenerateContentResponse>;
    /**
     * Override to use dynamic token and endpoint with automatic retry
     */
    generateContentStream(request: GenerateContentParameters, userPromptId: string): Promise<AsyncGenerator<GenerateContentResponse>>;
    /**
     * Override to use dynamic token and endpoint with automatic retry
     */
    countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;
    /**
     * Override to use dynamic token and endpoint with automatic retry
     */
    embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;
    /**
     * Check if an error is related to authentication/authorization
     */
    private isAuthError;
    /**
     * Get the current cached token (may be expired)
     */
    getCurrentToken(): string | null;
    /**
     * Clear the cached token
     */
    clearToken(): void;
}
