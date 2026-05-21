/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { LoadedSettings } from '../../config/settings.js';
import { SettingScope } from '../../config/settings.js';
interface ThemeDialogProps {
    /** Callback function when a theme is selected */
    onSelect: (themeName: string | undefined, scope: SettingScope) => void;
    /** Callback function when a theme is highlighted */
    onHighlight: (themeName: string | undefined) => void;
    /** The settings object */
    settings: LoadedSettings;
    availableTerminalHeight?: number;
    terminalWidth: number;
}
export declare function ThemeDialog({ onSelect, onHighlight, settings, availableTerminalHeight, terminalWidth, }: ThemeDialogProps): React.JSX.Element;
export {};
