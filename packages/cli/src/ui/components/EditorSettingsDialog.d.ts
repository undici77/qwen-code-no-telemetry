/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { LoadedSettings } from '../../config/settings.js';
import { SettingScope } from '../../config/settings.js';
import type { EditorType } from '@qwen-code/qwen-code-core';
interface EditorDialogProps {
    onSelect: (editorType: EditorType | undefined, scope: SettingScope) => void;
    settings: LoadedSettings;
    onExit: () => void;
}
export declare function EditorSettingsDialog({ onSelect, settings, onExit, }: EditorDialogProps): React.JSX.Element;
export {};
