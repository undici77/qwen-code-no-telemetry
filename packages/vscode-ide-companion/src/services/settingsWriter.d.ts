/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Settings writer for VSCode extension.
 * Handles bidirectional sync between VSCode Settings and ~/.qwen/settings.json.
 */
import { type ProviderInstallPlan } from '@qwen-code/qwen-code-core';
/**
 * Model providers as key-value map: modelId → baseUrl.
 * This is the format VSCode Settings UI can render as an editable table.
 */
export type VSCodeModelProviders = Record<string, string>;
/**
 * Values extracted from ~/.qwen/settings.json for populating VSCode Settings.
 */
export interface QwenSettingsForVSCode {
    provider: 'coding-plan' | 'api-key';
    apiKey: string;
    codingPlanRegion: 'china' | 'global';
}
/**
 * Write Coding Plan configuration to ~/.qwen/settings.json.
 * Auto-injects model providers from the regional template,
 * preserving any existing non-Coding-Plan entries.
 *
 * @returns The injected models as a VSCode key-value map (modelId → baseUrl)
 */
export declare function writeCodingPlanConfig(region: 'china' | 'global', apiKey: string): VSCodeModelProviders;
/**
 * Write model providers from VSCode Settings (key-value map) to ~/.qwen/settings.json.
 * Used when provider = "api-key" and user edits the modelProviders map.
 *
 * @param params.apiKey - The API key
 * @param params.modelProviders - Map of modelId → baseUrl
 * @param params.activeModel - Currently selected model ID
 */
export declare function writeModelProvidersConfig(params: {
    apiKey: string;
    modelProviders: VSCodeModelProviders;
    activeModel: string;
}): void;
/**
 * Apply a ProviderInstallPlan to ~/.qwen/settings.json.
 * This is the primary entry point for the VSCode interactive auth flow.
 *
 * `applyProviderInstallPlan` is async, so a returned (or thrown) Promise must
 * be awaited — otherwise an `EACCES` from `persist()` or the prototype-pollution
 * guard in `setValue()` would be swallowed and the caller would carry on
 * reconnecting the agent as if the settings write had succeeded.
 */
export declare function applyProviderInstallPlanToFile(plan: ProviderInstallPlan): Promise<void>;
/**
 * Capture a deep-cloned snapshot of the current on-disk settings for rollback,
 * or `null` if the file is missing/unreadable.
 *
 * Unlike `readSettings`, this never throws — callers use it to checkpoint
 * before `applyProviderInstallPlanToFile` so that a *later* step the install
 * plan can't see (e.g. the agent reconnect rejecting a bad API key) can be
 * undone via {@link restoreSettingsSnapshot}. `applyProviderInstallPlan`'s own
 * backup/restore only covers failures *inside* the plan; the
 * disconnect/reconnect in WebViewProvider runs after `cleanupBackup`, so the
 * caller owns that rollback window.
 */
export declare function snapshotSettingsForRollback(): Record<string, unknown> | null;
/**
 * Write a snapshot captured by {@link snapshotSettingsForRollback} back to
 * disk. No-op when the snapshot is `null` (nothing safe to restore).
 */
export declare function restoreSettingsSnapshot(snapshot: Record<string, unknown> | null): void;
/**
 * Read ~/.qwen/settings.json and extract values for VSCode Settings UI.
 * Returns null if no valid configuration found, or if the file is
 * malformed — the panel falls back to the empty/default state instead of
 * crashing the extension on activation. `readSettings` itself now throws
 * on parse failure (so we never silently overwrite a corrupt file in the
 * write paths), so this caller has to catch.
 */
export declare function readQwenSettingsForVSCode(): QwenSettingsForVSCode | null;
/**
 * Clear persisted auth credentials from ~/.qwen/settings.json.
 * Removes API keys, auth type selection, and coding plan metadata
 * so runtime state matches the cleared VS Code settings.
 */
export declare function clearPersistedAuth(): void;
