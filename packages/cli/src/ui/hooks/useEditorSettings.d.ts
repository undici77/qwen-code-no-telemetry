/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoadedSettings, SettingScope } from '../../config/settings.js';
import { type HistoryItem } from '../types.js';
import type { EditorType } from '@qwen-code/qwen-code-core';
interface UseEditorSettingsReturn {
    isEditorDialogOpen: boolean;
    openEditorDialog: () => void;
    handleEditorSelect: (editorType: EditorType | undefined, scope: SettingScope) => void;
    exitEditorDialog: () => void;
}
export declare const useEditorSettings: (loadedSettings: LoadedSettings, setEditorError: (error: string | null) => void, addItem: (item: Omit<HistoryItem, "id">, timestamp: number) => void) => UseEditorSettingsReturn;
export {};
