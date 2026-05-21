/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType, type Config } from '@qwen-code/qwen-code-core';
export type AvailableModel = {
    id: string;
    label: string;
    description?: string;
    isVision?: boolean;
};
/**
 * Get available Qwen models
 * coder-model now has vision capabilities by default.
 */
export declare function getFilteredQwenModels(): AvailableModel[];
/**
 * Currently we use the single model of `OPENAI_MODEL` in the env.
 * In the future, after settings.json is updated, we will allow users to configure this themselves.
 */
export declare function getOpenAIAvailableModelFromEnv(): AvailableModel | null;
export declare function getAnthropicAvailableModelFromEnv(): AvailableModel | null;
/**
 * Get available models for the given authType.
 *
 * If a Config object is provided, uses config.getAvailableModelsForAuthType().
 * Falls back to environment variables only when no config is provided.
 */
export declare function getAvailableModelsForAuthType(authType: AuthType, config?: Config): AvailableModel[];
