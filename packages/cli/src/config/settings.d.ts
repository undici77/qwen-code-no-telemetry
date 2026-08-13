/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Settings, type MemoryImportFormat } from './settingsSchema.js';
import { getSystemDefaultsPath, getSystemSettingsPath } from './storage-paths-lite.js';
export { DEFAULT_EXCLUDED_ENV_VARS, ENV_CORRUPTED_PATH, ENV_WAS_RECOVERED, getHomeEnvFallbackVars, loadEnvironment, preResolveHomeEnvOverrides, reloadEnvironment, resetEnvironmentTrackingForTesting, resetHomeEnvBootstrapForTesting, setUpCloudShellEnvironment, SETTINGS_DIRECTORY_NAME, } from './environment.js';
export { getSystemDefaultsPath, getSystemSettingsPath };
export type { EnvReloadResult } from './environment.js';
export type { Settings, MemoryImportFormat };
export declare function getUserSettingsPath(): string;
export declare function getUserSettingsDir(): string;
export declare const SETTINGS_VERSION = 4;
export declare const SETTINGS_VERSION_KEY = "$version";
/**
 * Migrate legacy tool permission settings (tools.core / tools.allowed / tools.exclude)
 * to the new permissions.allow / permissions.ask / permissions.deny format.
 *
 * Conversion rules:
 *   tools.allowed  → permissions.allow (bypass confirmation)
 *   tools.exclude  → permissions.deny  (block tools)
 *   tools.core     → permissions.allow (only listed tools enabled)
 *                    + permissions.deny with a wildcard deny-all if needed
 *
 * Returns the updated settings object, or null if no migration is needed.
 */
export declare function migrateLegacyPermissions(settings: Record<string, unknown>): Record<string, unknown> | null;
export type { DnsResolutionOrder } from './settingsSchema.js';
export declare enum SettingScope {
    User = "User",
    Workspace = "Workspace",
    System = "System",
    SystemDefaults = "SystemDefaults"
}
export interface CheckpointingSettings {
    enabled?: boolean;
}
export interface AccessibilitySettings {
    enableLoadingPhrases?: boolean;
    screenReader?: boolean;
}
export interface SettingsError {
    message: string;
    path: string;
}
export interface SettingsFile {
    settings: Settings;
    originalSettings: Settings;
    path: string;
    rawJson?: string;
}
/**
 * Collects warnings for ignored legacy and unknown settings keys,
 * as well as migration warnings.
 *
 * For `$version: 2` settings files, we do not apply implicit migrations.
 * Instead, we surface actionable, de-duplicated warnings in the terminal UI.
 */
export declare function getSettingsWarnings(loadedSettings: LoadedSettings): string[];
export declare class LoadedSettings {
    constructor(system: SettingsFile, systemDefaults: SettingsFile, user: SettingsFile, workspace: SettingsFile, isTrusted: boolean, migratedInMemoryScopes: Set<SettingScope>, migrationWarnings?: string[], corruptedPath?: string | undefined, wasRecovered?: boolean, workspaceSettingsActive?: boolean);
    readonly system: SettingsFile;
    readonly systemDefaults: SettingsFile;
    readonly user: SettingsFile;
    readonly workspace: SettingsFile;
    readonly isTrusted: boolean;
    readonly migratedInMemoryScopes: Set<SettingScope>;
    readonly migrationWarnings: string[];
    readonly corruptedPath: string | undefined;
    readonly wasRecovered: boolean;
    readonly workspaceSettingsActive: boolean;
    corruptionDialogDismissed: boolean;
    private _merged;
    get merged(): Settings;
    private computeMergedSettings;
    forScope(scope: SettingScope): SettingsFile;
    setValue(scope: SettingScope, key: string, value: unknown, assertCanCommit?: () => void, opts?: {
        throwOnWriteFailure?: boolean;
    }): void;
    setValues(writes: ReadonlyArray<{
        scope: SettingScope;
        key: string;
        value: unknown;
    }>, onScopeCommitted?: (scope: SettingScope) => void, assertCanCommit?: () => void): void;
    recomputeMerged(): void;
    reloadScopeFromDisk(scope: SettingScope): void;
    /**
     * Get user-level hooks from user settings (not merged with workspace).
     * These hooks should always be loaded regardless of folder trust.
     */
    getUserHooks(): Record<string, unknown> | undefined;
    /**
     * Get project-level hooks from workspace settings (not merged).
     * Returns undefined if workspace is not trusted (hooks filtered out).
     */
    getProjectHooks(): Record<string, unknown> | undefined;
}
/**
 * Creates a minimal LoadedSettings instance with empty settings.
 * Used in stream-json mode where settings are ignored.
 */
export declare function createMinimalSettings(): LoadedSettings;
export declare const CORRUPTED_SUFFIX = ".corrupted";
/**
 * Load and merge settings from all scopes:
 * System Defaults → User (~/.qwen/settings.json) → Workspace → System.
 */
export interface LoadSettingsOptions {
    consumeCorruptionEnvVars?: boolean;
    skipLoadEnvironment?: boolean;
    skipWorkspaceSettings?: boolean;
    workspaceTrusted?: boolean;
}
export declare function loadSettings(workspaceDir?: string, consumeCorruptionEnvVars?: boolean | LoadSettingsOptions): LoadedSettings;
export declare function saveSettings(settingsFile: SettingsFile, updates?: Record<string, unknown>, replacePath?: readonly string[], opts?: {
    throwOnWriteFailure?: boolean;
}): void;
