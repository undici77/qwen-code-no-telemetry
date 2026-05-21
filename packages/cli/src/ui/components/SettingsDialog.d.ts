/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { LoadedSettings } from '../../config/settings.js';
import { SettingScope } from '../../config/settings.js';
import { type Config } from '@qwen-code/qwen-code-core';
interface SettingsDialogProps {
    settings: LoadedSettings;
    onSelect: (settingName: string | undefined, scope: SettingScope) => void;
    onRestartRequest?: () => void;
    availableTerminalHeight?: number;
    config?: Config;
}
export declare function SettingsDialog({ settings, onSelect, onRestartRequest, availableTerminalHeight, config, }: SettingsDialogProps): React.JSX.Element;
export {};
