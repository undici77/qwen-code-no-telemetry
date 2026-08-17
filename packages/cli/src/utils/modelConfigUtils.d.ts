/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  AuthType,
  type ContentGeneratorConfig,
  type ContentGeneratorConfigSources,
  type ModelProvidersConfig,
  type ProviderModelConfig,
  type ProviderProtocolConfig,
} from '@qwen-code/qwen-code-core';
import type { Settings } from '../config/settings.js';
/**
 * Collect every modelProviders entry whose provider id resolves (via
 * providerProtocol) to the given protocol, in declaration order. Mirrors
 * {@link ModelRegistry}: a built-in key resolves to itself, a custom id resolves
 * through providerProtocol. Lets credential/metadata lookups find a custom
 * provider's models under their resolved protocol instead of only the protocol
 * key. For built-in-only configs this equals `modelProviders[protocol]`.
 */
export declare function collectProviderModelsForProtocol(
  modelProviders: ModelProvidersConfig | undefined,
  providerProtocol: ProviderProtocolConfig | undefined,
  protocol: string,
): ProviderModelConfig[];
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
  /** Exact selected modelProviders baseUrl; null selects an implicit route. */
  registryBaseUrl?: string | null;
  /** Source attribution for each resolved field */
  sources: ContentGeneratorConfigSources;
  /** Warnings generated during resolution */
  warnings: string[];
}
export declare function getAuthTypeFromEnv(
  env?: Record<string, string | undefined>,
): AuthType | undefined;
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
export declare function resolveCliGenerationConfig(
  inputs: CliGenerationConfigInputs,
): ResolvedCliGenerationConfig;
