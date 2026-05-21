/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../core/contentGenerator.js';
import type { ProviderConfig, ProviderInstallPlan, ProviderModelConfig, ProviderSetupInputs } from './types.js';
export declare function resolveOwnsModel(config: ProviderConfig): ((model: ProviderModelConfig) => boolean) | undefined;
/**
 * Returns the provider's metadata key (same as `config.id`).
 * Only defined for providers with a static `models` list.
 */
export declare function resolveMetadataKey(config: ProviderConfig): string | undefined;
/**
 * Namespace prefix used for all provider metadata in settings.
 * e.g. `providerMetadata.coding-plan.version`
 */
export declare const PROVIDER_METADATA_NS = "providerMetadata";
export declare function buildInstallPlan(config: ProviderConfig, inputs: ProviderSetupInputs): ProviderInstallPlan;
export declare function computeModelListVersion(models: ProviderModelConfig[]): string;
/** Resolve the placeholder/default base URL for a chosen protocol. */
export declare function getDefaultBaseUrlForProtocol(protocol: AuthType | undefined): string;
export declare function resolveBaseUrl(config: ProviderConfig, selectedBaseUrl?: string): string;
export declare function getDefaultModelIds(config: ProviderConfig): string[];
export declare function shouldShowStep(config: ProviderConfig, step: 'protocol' | 'baseUrl' | 'apiKey' | 'models' | 'advancedConfig'): boolean;
export declare function providerMatchesCredentials(config: ProviderConfig, baseUrl: string | undefined, envKey: string | undefined): boolean;
export declare function buildProviderTemplate(config: ProviderConfig, baseUrl?: string): ProviderModelConfig[];
