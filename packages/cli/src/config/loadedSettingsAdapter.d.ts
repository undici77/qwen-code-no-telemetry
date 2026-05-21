/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapter that lets core's `applyProviderInstallPlan` write through
 * `LoadedSettings` while preserving CLI-specific guarantees:
 * - scope resolution via `getPersistScopeForModelSelection`
 * - on-disk `.orig` backup of the target settings file
 * - in-memory snapshot of `settings` / `originalSettings` for rollback
 * - merged-settings recomputation after restore
 */
import type { ProviderSettingsAdapter } from '@qwen-code/qwen-code-core';
import type { LoadedSettings, SettingScope } from './settings.js';
export declare function createLoadedSettingsAdapter(settings: LoadedSettings, scope?: SettingScope): ProviderSettingsAdapter;
