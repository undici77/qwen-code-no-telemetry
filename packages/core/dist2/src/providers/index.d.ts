/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type { BaseUrlOption, ModelSpec, ProviderId, ProviderConfig, ProviderInstallPlan, ProviderInstallState, ProviderModelConfig, ProviderModelProvidersPatch, ProviderSettingsAdapter, ProviderSetupInputs, } from './types.js';
export { buildInstallPlan, buildProviderTemplate, computeModelListVersion, getDefaultBaseUrlForProtocol, getDefaultModelIds, providerMatchesCredentials, PROVIDER_METADATA_NS, resolveBaseUrl, resolveMetadataKey, resolveOwnsModel, shouldShowStep, } from './provider-config.js';
export { ALL_PROVIDERS, ALIBABA_PROVIDERS, alibabaStandardProvider, codingPlanProvider, CUSTOM_API_KEY_ENV_PREFIX, customProvider, deepseekProvider, findProviderByCredentials, findProviderById, generateCustomEnvKey, getAllProviderBaseUrls, idealabProvider, minimaxProvider, modelscopeProvider, openRouterProvider, THIRD_PARTY_PROVIDERS, tokenPlanProvider, zaiProvider, } from './all-providers.js';
export { CODING_PLAN_CHINA_BASE_URL, CODING_PLAN_ENV_KEY, CODING_PLAN_GLOBAL_BASE_URL, } from './presets/alibaba-coding-plan.js';
export { TOKEN_PLAN_BASE_URL, TOKEN_PLAN_ENV_KEY, } from './presets/alibaba-token-plan.js';
export { OPENROUTER_BASE_URL, OPENROUTER_ENV_KEY, } from './presets/openrouter.js';
export { applyProviderInstallPlan, ProviderInstallError, type ApplyProviderInstallPlanOptions, type ApplyProviderInstallPlanResult, } from './install.js';
