/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../core/authTypes.js';
import { type ModelProvidersConfig, type ResolvedModelConfig, type AvailableModel } from './types.js';
export { QWEN_OAUTH_MODELS } from './constants.js';
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
    private getDefaultBaseUrl;
    constructor(modelProvidersConfig?: ModelProvidersConfig);
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
     * When baseUrl is provided, looks up by the exact composite key (id+baseUrl).
     * When baseUrl is omitted, tries the plain id first (backward compatible),
     * then scans all entries for the first match by model id.
     */
    getModel(authType: AuthType, modelId: string, baseUrl?: string): ResolvedModelConfig | undefined;
    /**
     * Check if model exists for given authType.
     * When baseUrl is provided, checks the exact composite key.
     * When baseUrl is omitted, checks plain id and scans by model id.
     */
    hasModel(authType: AuthType, modelId: string, baseUrl?: string): boolean;
    /**
     * Get default model for an authType.
     * For qwen-oauth, returns the coder model.
     * For others, returns the first configured model.
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
     */
    reloadModels(modelProvidersConfig?: ModelProvidersConfig): void;
}
