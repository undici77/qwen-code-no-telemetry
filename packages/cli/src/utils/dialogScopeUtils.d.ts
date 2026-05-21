/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoadedSettings } from '../config/settings.js';
import { SettingScope } from '../config/settings.js';
/**
 * Shared scope labels for dialog components that need to display setting scopes
 */
export declare const SCOPE_LABELS: {
    readonly User: "User Settings";
    readonly Workspace: "Workspace Settings";
};
/**
 * Helper function to get scope items for radio button selects
 */
export declare function getScopeItems(): ({
    label: "User Settings";
    value: SettingScope;
} | {
    label: "Workspace Settings";
    value: SettingScope;
})[];
/**
 * Generate scope message for a specific setting
 */
export declare function getScopeMessageForSetting(settingKey: string, selectedScope: SettingScope, settings: LoadedSettings): string;
