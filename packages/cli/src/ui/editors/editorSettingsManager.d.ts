/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type EditorType } from '@qwen-code/qwen-code-core';
export interface EditorDisplay {
    name: string;
    type: EditorType | 'not_set';
    disabled: boolean;
}
export declare const EDITOR_DISPLAY_NAMES: Record<EditorType, string>;
declare class EditorSettingsManager {
    private readonly availableEditors;
    constructor();
    getAvailableEditorDisplays(): EditorDisplay[];
}
export declare const editorSettingsManager: EditorSettingsManager;
export {};
