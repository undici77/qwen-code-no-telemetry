/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoadedSettings, SettingScope } from '../../config/settings.js';
import { type HistoryItemWithoutId } from '../types.js';
import type { Config, EditorType } from '@qwen-code/qwen-code-core';
interface UseEditorSettingsReturn {
    isEditorDialogOpen: boolean;
    openEditorDialog: () => void;
    handleEditorSelect: (editorType: EditorType | undefined, scope: SettingScope) => void;
    exitEditorDialog: () => void;
}
export declare const useEditorSettings: (loadedSettings: LoadedSettings, setEditorError: (error: string | null) => void, addItem: (item: HistoryItemWithoutId, timestamp: number) => void, config?: Config) => UseEditorSettingsReturn;
export {};
