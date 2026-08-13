/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { ModelsConfig } from '@qwen-code/qwen-code-core';
import { loadSettings } from '../../config/settings.js';
import { getAuthTypeFromEnv, resolveCliGenerationConfig, } from '../../utils/modelConfigUtils.js';
import { snapshotProcessEnv } from '../env-snapshot.js';
import { isStreamingVoiceModel, resolveVoiceTranscriptionConfig, } from '../../services/voice-transcriber.js';
function readVoiceModel(settings) {
    const raw = settings.merged.voiceModel;
    if (typeof raw !== 'string')
        return undefined;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
/**
 * Build a `ModelsConfig` from workspace settings, mirroring
 * `workspace-providers-status.ts` so the daemon resolves the same configured
 * models the CLI would — without constructing a full CLI `Config`.
 */
function buildModelsConfig(settings, env) {
    const merged = settings.merged;
    const selectedAuthType = merged.security?.auth?.selectedType ?? getAuthTypeFromEnv(env);
    const resolvedCliConfig = resolveCliGenerationConfig({
        argv: {},
        settings: merged,
        selectedAuthType,
        env,
    });
    return new ModelsConfig({
        initialAuthType: selectedAuthType,
        modelProvidersConfig: merged.modelProviders,
        providerProtocolConfig: merged.providerProtocol,
        generationConfig: resolvedCliConfig.generationConfig,
        generationConfigSources: resolvedCliConfig.sources,
    });
}
/**
 * Load and validate the workspace's voice configuration. Throws when voice is
 * not usable (no `voiceModel` configured, model not transcribable, missing
 * baseUrl/apiKey) — the throw message is a safe, user-facing reason.
 */
export function loadDaemonVoiceContext(workspaceCwd, options = {}) {
    const settings = loadSettings(workspaceCwd, options.env
        ? {
            skipLoadEnvironment: true,
            skipWorkspaceSettings: options.workspaceTrusted === false,
            workspaceTrusted: options.workspaceTrusted,
        }
        : options.workspaceTrusted === false
            ? {
                consumeCorruptionEnvVars: true,
                skipLoadEnvironment: true,
                skipWorkspaceSettings: true,
                workspaceTrusted: false,
            }
            : options.workspaceTrusted === true
                ? { workspaceTrusted: true }
                : true);
    const voiceModel = readVoiceModel(settings);
    if (!voiceModel) {
        throw new Error('No voice model is configured for this workspace.');
    }
    const models = buildModelsConfig(settings, options.env ?? snapshotProcessEnv());
    // Validates transcribable + baseUrl + apiKey presence (throws otherwise).
    resolveVoiceTranscriptionConfig({
        config: models,
        settings,
        voiceModel,
        env: options.env,
    });
    return {
        settings,
        models,
        ...(options.env ? { env: options.env } : {}),
        voiceModel,
        streaming: isStreamingVoiceModel(voiceModel),
    };
}
//# sourceMappingURL=resolve-voice-config.js.map