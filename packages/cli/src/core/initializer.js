/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { IdeClient, IdeConnectionEvent, IdeConnectionType, logIdeConnection, } from '@qwen-code/qwen-code-core';
import {} from '../config/settings.js';
import { performInitialAuth } from './auth.js';
import { validateTheme } from './theme.js';
import { initializeI18n } from '../i18n/index.js';
/**
 * Orchestrates the application's startup initialization.
 * This runs BEFORE the React UI is rendered.
 * @param config The application config.
 * @param settings The loaded application settings.
 * @returns The results of the initialization.
 */
export async function initializeApp(config, settings) {
    // Initialize i18n system
    const languageSetting = process.env['QWEN_CODE_LANG'] ||
        settings.merged.general?.language ||
        'auto';
    await initializeI18n(languageSetting);
    // Use authType from modelsConfig which respects CLI --auth-type argument
    // over settings.security.auth.selectedType
    const authType = config.getModelsConfig().getCurrentAuthType();
    const authError = await performInitialAuth(config, authType);
    const themeError = validateTheme(settings);
    const shouldOpenAuthDialog = !config.getModelsConfig().wasAuthTypeExplicitlyProvided() || !!authError;
    if (config.getIdeMode()) {
        const ideClient = await IdeClient.getInstance();
        await ideClient.connect();
        logIdeConnection(config, new IdeConnectionEvent(IdeConnectionType.START));
    }
    return {
        authError,
        themeError,
        shouldOpenAuthDialog,
        geminiMdFileCount: config.getGeminiMdFileCount(),
    };
}
//# sourceMappingURL=initializer.js.map