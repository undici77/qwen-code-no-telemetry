/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { SettingScope, type LoadedSettings } from './settings.js';
export declare function hasOwnModelProviders(settingsObj: unknown): boolean;
/**
 * Returns which writable scope (Workspace/User) owns the effective modelProviders
 * configuration.
 *
 * Note: Workspace scope is only considered when the workspace is trusted.
 */
export declare function getModelProvidersOwnerScope(settings: LoadedSettings): SettingScope | undefined;
/**
 * Choose the settings scope to persist a model selection.
 * Prefer persisting back to the scope that contains the effective modelProviders
 * config, otherwise fall back to the legacy trust-based heuristic.
 */
export declare function getPersistScopeForModelSelection(settings: LoadedSettings): SettingScope;
