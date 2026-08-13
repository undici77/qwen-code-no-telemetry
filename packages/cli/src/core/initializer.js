/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { IdeClient, IdeConnectionEvent, IdeConnectionType, logIdeConnection, } from '@qwen-code/qwen-code-core';
import {} from '../config/settings.js';
import { performInitialAuth } from './auth.js';
import { validateTheme } from './theme.js';
import { initializeI18n, resolveLanguageSetting } from '../i18n/index.js';
/**
 * Establishes the startup IDE connection and records the connection telemetry.
 *
 * Callers choose whether to await this on the startup critical path. Headless,
 * stream-json, and ACP/Zed await it before their first request; ordinary TUI
 * startup schedules it post-render through startup prefetch.
 */
export async function connectIdeForStartup(config) {
    if (!config.getIdeMode())
        return;
    const ideClient = await IdeClient.getInstance();
    await ideClient.connect();
    logIdeConnection(config, new IdeConnectionEvent(IdeConnectionType.START));
}
/**
 * Orchestrates the application's startup initialization.
 * This runs BEFORE the React UI is rendered.
 * @param config The application config.
 * @param settings The loaded application settings.
 * @returns The results of the initialization.
 */
export async function initializeApp(config, settings, options = {}) {
    // Initialize i18n system
    await initializeI18n(resolveLanguageSetting(settings.merged.general?.language));
    // Use authType from modelsConfig which respects CLI --auth-type argument
    // over settings.security.auth.selectedType
    const authType = config.getModelsConfig().getCurrentAuthType();
    const authError = await performInitialAuth(config, authType);
    const themeError = validateTheme(settings);
    const shouldOpenAuthDialog = !config.getModelsConfig().wasAuthTypeExplicitlyProvided() || !!authError;
    if (!options.deferIdeConnection) {
        await connectIdeForStartup(config);
    }
    return {
        authError,
        themeError,
        shouldOpenAuthDialog,
        geminiMdFileCount: config.getGeminiMdFileCount(),
    };
}
//# sourceMappingURL=initializer.js.map