/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../../config/settings.js';
export interface ModelUpdateDiff {
    added: string[];
    removed: string[];
    currentModelAffected: boolean;
    fallbackModel?: string;
}
export type UpdateChoice = 'update' | 'later' | 'skip';
export interface ProviderUpdateEntry {
    providerLabel: string;
    diff: ModelUpdateDiff;
}
export interface ProviderUpdateRequest {
    entries: ProviderUpdateEntry[];
    onConfirm: (choice: UpdateChoice) => void;
}
/**
 * Hook for detecting and handling provider model template updates.
 * Checks ALL providers with static model lists for version changes.
 */
export declare function useProviderUpdates(settings: LoadedSettings, config: Config, addItem: (item: {
    type: 'info' | 'error' | 'warning';
    text: string;
}, timestamp: number) => void): {
    providerUpdateRequest: ProviderUpdateRequest | undefined;
    dismissProviderUpdate: () => void;
};
