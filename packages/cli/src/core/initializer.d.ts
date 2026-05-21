/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import { type LoadedSettings } from '../config/settings.js';
export interface InitializationResult {
    authError: string | null;
    themeError: string | null;
    shouldOpenAuthDialog: boolean;
    geminiMdFileCount: number;
}
/**
 * Orchestrates the application's startup initialization.
 * This runs BEFORE the React UI is rendered.
 * @param config The application config.
 * @param settings The loaded application settings.
 * @returns The results of the initialization.
 */
export declare function initializeApp(config: Config, settings: LoadedSettings): Promise<InitializationResult>;
