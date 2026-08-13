/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoadedSettings, SettingScope } from '../../config/settings.js';
import { type HistoryItemWithoutId } from '../types.js';
import type { Config } from '@qwen-code/qwen-code-core';
interface UseThemeCommandReturn {
    isThemeDialogOpen: boolean;
    openThemeDialog: () => void;
    handleThemeSelect: (themeName: string | undefined, scope: SettingScope) => void;
    handleThemeHighlight: (themeName: string | undefined) => void;
}
export declare const useThemeCommand: (loadedSettings: LoadedSettings, setThemeError: (error: string | null) => void, addItem: (item: HistoryItemWithoutId, timestamp: number) => void, initialThemeError: string | null, config?: Config) => UseThemeCommandReturn;
export {};
