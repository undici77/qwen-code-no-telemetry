/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoadedSettings } from './settings.js';
/**
 * Drop-in replacement for `loadSettings(workspaceDir)` on hot paths that use
 * its default options. Callers needing `LoadSettingsOptions` must keep using
 * `loadSettings()` directly.
 */
export declare function loadSettingsCached(
  workspaceDir: string,
): LoadedSettings;
export declare function clearSettingsCacheForTesting(): void;
