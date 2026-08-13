/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ModelConfig } from './types.js';
type AuthType = import('../core/authTypes.js').AuthType;
/**
 * Field keys for model-scoped generation config.
 *
 * Kept in a small standalone module to avoid circular deps. The `import('...')`
 * usage is type-only and does not emit runtime imports.
 */
export declare const MODEL_GENERATION_CONFIG_FIELDS: readonly ["samplingParams", "timeout", "maxRetries", "retryInitialDelayMs", "retryMaxDelayMs", "retryErrorCodes", "enableCacheControl", "forceGlobalCacheScope", "cacheRetention", "cacheRetentionByBlock", "schemaCompliance", "reasoning", "contextWindowSize", "customHeaders", "extra_body", "thinkingMandatory", "modalities", "splitToolMedia", "toolResultContentFormat"];
/**
 * Credential-related fields that are part of ContentGeneratorConfig
 * but not ModelGenerationConfig.
 */
export declare const CREDENTIAL_FIELDS: readonly ["model", "apiKey", "apiKeyEnvKey", "baseUrl"];
/**
 * All provider-sourced fields that need to be tracked for source attribution
 * and cleared when switching from provider to manual credentials.
 */
export declare const PROVIDER_SOURCED_FIELDS: readonly ["model", "apiKey", "apiKeyEnvKey", "baseUrl", "samplingParams", "timeout", "maxRetries", "retryInitialDelayMs", "retryMaxDelayMs", "retryErrorCodes", "enableCacheControl", "forceGlobalCacheScope", "cacheRetention", "cacheRetentionByBlock", "schemaCompliance", "reasoning", "contextWindowSize", "customHeaders", "extra_body", "thinkingMandatory", "modalities", "splitToolMedia", "toolResultContentFormat"];
/**
 * Environment variable mappings per authType.
 */
export interface AuthEnvMapping {
    apiKey: string[];
    baseUrl: string[];
    model: string[];
}
export declare const AUTH_ENV_MAPPINGS: {
    readonly openai: {
        readonly apiKey: ["OPENAI_API_KEY"];
        readonly baseUrl: ["OPENAI_BASE_URL"];
        readonly model: ["OPENAI_MODEL", "QWEN_MODEL"];
    };
    readonly anthropic: {
        readonly apiKey: ["ANTHROPIC_API_KEY"];
        readonly baseUrl: ["ANTHROPIC_BASE_URL"];
        readonly model: ["ANTHROPIC_MODEL"];
    };
    readonly gemini: {
        readonly apiKey: ["GEMINI_API_KEY"];
        readonly baseUrl: [];
        readonly model: ["GEMINI_MODEL"];
    };
    readonly 'vertex-ai': {
        readonly apiKey: ["GOOGLE_API_KEY"];
        readonly baseUrl: [];
        readonly model: ["GOOGLE_MODEL"];
    };
    readonly 'qwen-oauth': {
        readonly apiKey: [];
        readonly baseUrl: [];
        readonly model: [];
    };
};
export declare const DEFAULT_MODELS: Partial<Record<AuthType, string>>;
/**
 * Hard-coded Qwen OAuth models that are always available.
 * These cannot be overridden by user configuration.
 */
export declare const QWEN_OAUTH_MODELS: ModelConfig[];
/**
 * Derive allowed models from QWEN_OAUTH_MODELS for authorization.
 * This ensures single source of truth (SSOT).
 */
export declare const QWEN_OAUTH_ALLOWED_MODELS: readonly string[];
export {};
