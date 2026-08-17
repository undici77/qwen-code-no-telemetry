/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type GenAiOperationName = 'chat' | 'generate_content';
export type GenAiOutputType = 'text' | 'json' | 'image' | 'speech';
export type GenAiAuthType =
  | 'openai'
  | 'qwen-oauth'
  | 'gemini'
  | 'vertex-ai'
  | 'anthropic';
interface ProviderConfig {
  authType?: GenAiAuthType;
  baseUrl?: string;
  apiKeyEnvKey?: string;
}
export declare function resolveGenAiProviderName(
  config: ProviderConfig,
  dashscopeProxyBaseUrl?: string,
): string;
export declare function resolveGenAiOperationName(
  authType: GenAiAuthType | undefined,
): GenAiOperationName;
export declare function resolveGenAiOutputType(
  authType: GenAiAuthType | undefined,
  config:
    | {
        responseMimeType?: string;
        responseModalities?: readonly unknown[];
      }
    | undefined,
): GenAiOutputType | undefined;
export {};
