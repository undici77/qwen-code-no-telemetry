/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { OpenAIContentGenerator } from './openaiContentGenerator.js';
import { DashScopeOpenAICompatibleProvider, DeepSeekOpenAICompatibleProvider, ModelScopeOpenAICompatibleProvider, MiMoOpenAICompatibleProvider, MiniMaxOpenAICompatibleProvider, MistralOpenAICompatibleProvider, OpenRouterOpenAICompatibleProvider, DefaultOpenAICompatibleProvider, } from './provider/index.js';
export { OpenAIContentGenerator } from './openaiContentGenerator.js';
export { ContentGenerationPipeline } from './pipeline.js';
export { DashScopeOpenAICompatibleProvider, DeepSeekOpenAICompatibleProvider, MiMoOpenAICompatibleProvider, MiniMaxOpenAICompatibleProvider, MistralOpenAICompatibleProvider, OpenRouterOpenAICompatibleProvider, } from './provider/index.js';
export { OpenAIContentConverter } from './converter.js';
/**
 * Create an OpenAI-compatible content generator with the appropriate provider
 */
export function createOpenAIContentGenerator(contentGeneratorConfig, cliConfig) {
    const provider = determineProvider(contentGeneratorConfig, cliConfig);
    return new OpenAIContentGenerator(contentGeneratorConfig, cliConfig, provider);
}
/**
 * Determine the appropriate provider based on configuration
 */
export function determineProvider(contentGeneratorConfig, cliConfig) {
    const config = contentGeneratorConfig || cliConfig.getContentGeneratorConfig();
    // Check for DashScope provider
    if (DashScopeOpenAICompatibleProvider.isDashScopeProvider(config)) {
        return new DashScopeOpenAICompatibleProvider(contentGeneratorConfig, cliConfig);
    }
    if (DeepSeekOpenAICompatibleProvider.isDeepSeekProvider(config)) {
        return new DeepSeekOpenAICompatibleProvider(contentGeneratorConfig, cliConfig);
    }
    if (MiMoOpenAICompatibleProvider.isMiMoProvider(config)) {
        return new MiMoOpenAICompatibleProvider(contentGeneratorConfig, cliConfig);
    }
    // Check for OpenRouter provider
    if (OpenRouterOpenAICompatibleProvider.isOpenRouterProvider(config)) {
        return new OpenRouterOpenAICompatibleProvider(contentGeneratorConfig, cliConfig);
    }
    // Check for ModelScope provider
    if (ModelScopeOpenAICompatibleProvider.isModelScopeProvider(config)) {
        return new ModelScopeOpenAICompatibleProvider(contentGeneratorConfig, cliConfig);
    }
    // Check for MiniMax provider
    if (MiniMaxOpenAICompatibleProvider.isMiniMaxProvider(config)) {
        return new MiniMaxOpenAICompatibleProvider(contentGeneratorConfig, cliConfig);
    }
    // Check for Mistral provider
    if (MistralOpenAICompatibleProvider.isMistralProvider(config)) {
        return new MistralOpenAICompatibleProvider(contentGeneratorConfig, cliConfig);
    }
    // Default provider for standard OpenAI-compatible APIs
    return new DefaultOpenAICompatibleProvider(contentGeneratorConfig, cliConfig);
}
export { EnhancedErrorHandler } from './errorHandler.js';
//# sourceMappingURL=index.js.map