/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Provider registry — imports all provider definitions and assembles the
 * lookup tables used by the UI and CLI commands.
 */
import type { ProviderConfig } from './types.js';
import { codingPlanProvider } from './presets/alibaba-coding-plan.js';
import { tokenPlanProvider } from './presets/alibaba-token-plan.js';
import { alibabaStandardProvider } from './presets/alibaba-standard.js';
import { openRouterProvider } from './presets/openrouter.js';
import { requestyProvider } from './presets/requesty.js';
import { deepseekProvider } from './presets/deepseek.js';
import { grokProvider } from './presets/grok.js';
import { minimaxProvider } from './presets/minimax.js';
import { zaiProvider } from './presets/zai.js';
import { idealabProvider } from './presets/idealab.js';
import { modelscopeProvider } from './presets/modelscope.js';
import { customProvider } from './presets/custom-provider.js';
export {
  codingPlanProvider,
  tokenPlanProvider,
  alibabaStandardProvider,
  openRouterProvider,
  requestyProvider,
  deepseekProvider,
  grokProvider,
  minimaxProvider,
  zaiProvider,
  idealabProvider,
  modelscopeProvider,
  customProvider,
};
export {
  CUSTOM_API_KEY_ENV_PREFIX,
  generateCustomEnvKey,
} from './presets/custom-provider.js';
/** All known providers, in display order. */
export declare const ALL_PROVIDERS: readonly ProviderConfig[];
/** Providers grouped by uiGroup. */
export declare const ALIBABA_PROVIDERS: ProviderConfig[];
export declare const THIRD_PARTY_PROVIDERS: ProviderConfig[];
export declare function findProviderById(
  id: string,
): ProviderConfig | undefined;
/** Find a provider by model credentials (baseUrl + envKey). */
export declare function findProviderByCredentials(
  baseUrl: string | undefined,
  envKey: string | undefined,
): ProviderConfig | undefined;
/** All known provider base URLs (for preconnect, validation, etc.). */
export declare function getAllProviderBaseUrls(): string[];
