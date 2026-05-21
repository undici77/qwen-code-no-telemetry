/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType, type ContentGeneratorConfig, type ContentGeneratorConfigSources } from '@qwen-code/qwen-code-core';
import type { Settings } from '../config/settings.js';
export interface CliGenerationConfigInputs {
    argv: {
        model?: string | undefined;
        openaiApiKey?: string | undefined;
        openaiBaseUrl?: string | undefined;
        openaiLogging?: boolean | undefined;
        openaiLoggingDir?: string | undefined;
    };
    settings: Settings;
    selectedAuthType: AuthType | undefined;
    /**
     * Injectable env for testability. Defaults to process.env at callsites.
     */
    env?: Record<string, string | undefined>;
}
export interface ResolvedCliGenerationConfig {
    /** The resolved model id (may be empty string if not resolvable at CLI layer) */
    model: string;
    /** API key for OpenAI-compatible auth */
    apiKey: string;
    /** Base URL for OpenAI-compatible auth */
    baseUrl: string;
    /** The full generation config to pass to core Config */
    generationConfig: Partial<ContentGeneratorConfig>;
    /** Source attribution for each resolved field */
    sources: ContentGeneratorConfigSources;
    /** Warnings generated during resolution */
    warnings: string[];
}
export declare function getAuthTypeFromEnv(): AuthType | undefined;
/**
 * Unified resolver for CLI generation config.
 *
 * Model precedence (all auth types):
 * - argv.model > settings.model.name > auth-specific env model vars
 *
 * Env var mapping by auth type (mirrors core's AUTH_ENV_MAPPINGS):
 * - USE_OPENAI: OPENAI_MODEL, QWEN_MODEL
 * - USE_GEMINI: GEMINI_MODEL
 * - USE_VERTEX_AI: GOOGLE_MODEL
 * - USE_ANTHROPIC: ANTHROPIC_MODEL
 *
 * When model is resolved from argv or settings, all model env vars are stripped
 * from the env passed to core's resolveModelConfig to prevent incorrect overrides.
 * When model is resolved from an auth-specific env var, only that env var is
 * kept in the filtered env so core can access the provider metadata.
 */
export declare function resolveCliGenerationConfig(inputs: CliGenerationConfigInputs): ResolvedCliGenerationConfig;
