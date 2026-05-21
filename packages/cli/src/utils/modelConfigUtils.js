/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType, MODEL_GENERATION_CONFIG_FIELDS, resolveModelConfig, } from '@qwen-code/qwen-code-core';
/**
 * Env var names that hold model selections for each auth type.
 * Mirrors the model-var mappings in core's AUTH_ENV_MAPPINGS.
 */
const AUTH_ENV_MODEL_VARS = {
    [AuthType.USE_OPENAI]: ['OPENAI_MODEL', 'QWEN_MODEL'],
    [AuthType.USE_GEMINI]: ['GEMINI_MODEL'],
    [AuthType.USE_VERTEX_AI]: ['GOOGLE_MODEL'],
    [AuthType.USE_ANTHROPIC]: ['ANTHROPIC_MODEL'],
    [AuthType.QWEN_OAUTH]: [],
};
function getIgnoredTopLevelGenerationConfigFields(settingsGenerationConfig, modelProvider) {
    if (!settingsGenerationConfig || !modelProvider) {
        return [];
    }
    const providerGenerationConfig = modelProvider.generationConfig ?? {};
    return MODEL_GENERATION_CONFIG_FIELDS.filter((field) => Object.hasOwn(settingsGenerationConfig, field) &&
        !Object.hasOwn(providerGenerationConfig, field));
}
function buildIgnoredTopLevelGenerationConfigWarning(authType, modelProvider, ignoredFields) {
    if (ignoredFields.length === 0) {
        return undefined;
    }
    const fieldList = ignoredFields
        .map((field) => `model.generationConfig.${field}`)
        .join(', ');
    const isSingular = ignoredFields.length === 1;
    const verb = isSingular ? 'is' : 'are';
    const fieldReference = isSingular ? 'this field' : 'these fields';
    const pronoun = isSingular ? 'it' : 'them';
    return `Warning: ${fieldList} ${verb} ignored for provider model "${modelProvider.id}" from modelProviders.${authType}. Move ${fieldReference} to modelProviders.${authType}[].generationConfig for that model if you want ${pronoun} to apply.`;
}
export function getAuthTypeFromEnv() {
    if (process.env['QWEN_OAUTH']) {
        return AuthType.QWEN_OAUTH;
    }
    if (process.env['OPENAI_API_KEY']) {
        return AuthType.USE_OPENAI;
    }
    if (process.env['GEMINI_API_KEY']) {
        return AuthType.USE_GEMINI;
    }
    if (process.env['GOOGLE_API_KEY']) {
        return AuthType.USE_VERTEX_AI;
    }
    if (process.env['ANTHROPIC_API_KEY']) {
        return AuthType.USE_ANTHROPIC;
    }
    // Default to OpenAI for the no-telemetry version if no other type is specified.
    // This ensures compatibility with common development and test environments
    // where OPENAI_API_KEY might be provided but other markers are missing.
    return AuthType.USE_OPENAI;
}
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
export function resolveCliGenerationConfig(inputs) {
    const { argv, settings, selectedAuthType } = inputs;
    const env = inputs.env ?? process.env;
    const authType = selectedAuthType;
    // Resolve the target model based on strict precedence:
    // argv.model > settings.model.name > auth-specific env model vars
    // Env vars are ONLY considered when neither argv.model nor settings.model.name is set.
    let resolvedModel;
    let sourceEnvVar;
    if (argv.model) {
        resolvedModel = argv.model;
    }
    else if (settings.model?.name) {
        resolvedModel = settings.model.name;
    }
    else if (authType && AUTH_ENV_MODEL_VARS[authType]) {
        // Only check env vars for the current auth type
        for (const envVar of AUTH_ENV_MODEL_VARS[authType]) {
            if (env[envVar]) {
                resolvedModel = env[envVar];
                sourceEnvVar = envVar;
                break;
            }
        }
    }
    // Find a matching provider for the resolved model (for metadata: generationConfig, envKey, etc.)
    // When resolvedModel is from settings and matches a provider, modelProvider.id == settings.model.name,
    // so the resolver correctly uses the settings-selected model (no override occurs).
    // The old candidate-loop code that fell through to OPENAI_MODEL is gone.
    let modelProvider;
    if (resolvedModel && authType && settings.modelProviders) {
        const providers = settings.modelProviders[authType];
        if (providers && Array.isArray(providers)) {
            modelProvider = providers.find((p) => p.id === resolvedModel);
        }
    }
    // Filter env to prevent auth-specific model env vars from overriding higher-priority sources.
    // sourceEnvVar is only set when the model was actually resolved from an env var (lines 119-128),
    // so this is source-based filtering, not value-based. If model came from argv or settings,
    // sourceEnvVar is undefined and ALL model env vars are stripped.
    // Build a list of ALL model env vars across all auth types.
    const allModelEnvVars = Object.values(AUTH_ENV_MODEL_VARS).flat();
    const filteredEnv = { ...env };
    if (sourceEnvVar) {
        // Keep only the env var that was actually used
        for (const envVar of allModelEnvVars) {
            if (envVar !== sourceEnvVar) {
                delete filteredEnv[envVar];
            }
        }
    }
    else {
        // Model was not resolved from env - strip ALL model env vars
        for (const envVar of allModelEnvVars) {
            delete filteredEnv[envVar];
        }
    }
    const configSources = {
        authType,
        cli: {
            model: argv.model,
            apiKey: argv.openaiApiKey,
            baseUrl: argv.openaiBaseUrl,
        },
        settings: {
            model: settings.model?.name,
            apiKey: settings.security?.auth?.apiKey,
            baseUrl: settings.security?.auth?.baseUrl,
            generationConfig: settings.model?.generationConfig,
        },
        modelProvider,
        env: filteredEnv,
    };
    const resolved = resolveModelConfig(configSources);
    // Provider-backed models are synced again during Config.refreshAuth(), which
    // reapplies provider defaults after the initial resolver fallback.
    const ignoredGenerationConfigWarning = authType && modelProvider
        ? buildIgnoredTopLevelGenerationConfigWarning(authType, modelProvider, getIgnoredTopLevelGenerationConfigFields(settings.model?.generationConfig, modelProvider))
        : undefined;
    // Resolve OpenAI logging config (CLI-specific, not part of core resolver)
    const enableOpenAILogging = (typeof argv.openaiLogging === 'undefined'
        ? settings.model?.enableOpenAILogging
        : argv.openaiLogging) ?? false;
    const openAILoggingDir = argv.openaiLoggingDir || settings.model?.openAILoggingDir;
    // Build the full generation config
    // Note: we merge the resolved config with logging settings
    const generationConfig = {
        ...resolved.config,
        enableOpenAILogging,
        openAILoggingDir,
    };
    return {
        model: resolved.config.model || '',
        apiKey: resolved.config.apiKey || '',
        baseUrl: resolved.config.baseUrl || '',
        generationConfig,
        sources: resolved.sources,
        warnings: [
            ...resolved.warnings,
            ...(ignoredGenerationConfigWarning
                ? [ignoredGenerationConfigWarning]
                : []),
        ],
    };
}
//# sourceMappingURL=modelConfigUtils.js.map