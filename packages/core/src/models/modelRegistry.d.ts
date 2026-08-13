/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../core/contentGenerator.js';
import { type ModelProvidersConfig, type ProviderProtocolConfig, type ResolvedModelConfig, type AvailableModel } from './types.js';
export { QWEN_OAUTH_MODELS } from './constants.js';
/**
 * Resolve the SDK protocol (an {@link AuthType}) that should route a
 * `modelProviders` provider id.
 *
 * Precedence:
 *  1. An explicit {@link ProviderProtocolConfig} entry for the provider id.
 *  2. The provider id itself when it is already a built-in protocol
 *     (e.g. `openai`, `gemini`) — preserves the pre-existing behavior.
 *
 * Returns `undefined` for an unknown provider id with no mapping, or an explicit
 * mapping whose value is not a known protocol, so the caller skips it (keeping
 * the typo guard for hand-edited settings). Pure: callers decide how loudly to
 * report a skip. Additive — configs without `providerProtocol` behave as before.
 */
export declare function resolveProviderProtocol(providerId: string, providerProtocol?: ProviderProtocolConfig): AuthType | undefined;
/**
 * Build a composite registry key from model id and optional baseUrl.
 * Two models with the same id but different baseUrls are distinct entries.
 * When baseUrl is omitted/empty the key is just the id (backward compatible).
 */
export declare function modelRegistryKey(id: string, baseUrl?: string): string;
/**
 * Central registry for managing model configurations.
 * Models are organized by authType.
 */
export declare class ModelRegistry {
    private modelsByAuthType;
    /** providerId -> SDK protocol mapping; persists across reloads. */
    private providerProtocolConfig;
    private getDefaultBaseUrl;
    constructor(modelProvidersConfig?: ModelProvidersConfig, providerProtocolConfig?: ProviderProtocolConfig);
    /**
     * Register every user-configured provider under its resolved SDK protocol.
     * A provider id maps to a protocol via {@link resolveProviderProtocol}
     * (explicit `providerProtocol` entry, or the id itself when it is a built-in
     * protocol). Unmapped unknown ids are skipped with a warning.
     */
    private registerProvidersConfig;
    /**
     * Register models for an authType.
     * Uniqueness is determined by the composite key (id + baseUrl).
     * Two models with the same id but different baseUrls are treated as distinct.
     * If multiple models share both id and baseUrl, the first one takes precedence.
     */
    private registerAuthTypeModels;
    /**
     * Get all models for a specific authType.
     * This is used by /model command to show only relevant models.
     */
    getModelsForAuthType(authType: AuthType): AvailableModel[];
    /**
     * Get model configuration by authType and modelId.
     * When baseUrl is provided, looks up the exact composite key, then a plain
     * entry whose resolved default baseUrl matches.
     * When baseUrl is omitted, tries the plain id first (backward compatible),
     * then scans all entries for the first match by model id.
     */
    getModel(authType: AuthType, modelId: string, baseUrl?: string | null): ResolvedModelConfig | undefined;
    /**
     * Check if model exists for given authType.
     * When baseUrl is provided, checks the exact endpoint or matching default.
     * When baseUrl is omitted, checks plain id and scans by model id.
     */
    hasModel(authType: AuthType, modelId: string, baseUrl?: string): boolean;
    /**
     * Get default model for an authType.
     * For qwen-oauth, returns the coder model.
     * For others, returns the first configured primary-capable model.
     */
    getDefaultModelForAuthType(authType: AuthType): ResolvedModelConfig | undefined;
    /**
     * Resolve model config by applying defaults
     */
    private resolveModelConfig;
    /**
     * Validate model configuration
     */
    private validateModelConfig;
    /**
     * Reload models from updated configuration.
     * Clears existing user-configured models and re-registers from new config.
     * Preserves hard-coded qwen-oauth models.
     *
     * @param providerProtocolConfig - Updated provider->protocol map. `undefined`
     *   PRESERVES the existing map (so a reload carrying only modelProviders does
     *   not lose the mapping); any object value REPLACES it, so passing `{}`
     *   clears the mapping. Callers that want to preserve must omit the argument,
     *   not pass `settings.providerProtocol ?? {}`.
     */
    reloadModels(modelProvidersConfig?: ModelProvidersConfig, providerProtocolConfig?: ProviderProtocolConfig): void;
}
