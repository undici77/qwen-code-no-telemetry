/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { ApprovalMode } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../../config/settings.js';
import { SettingScope } from '../../config/settings.js';
interface ApprovalModeDialogProps {
    /** Callback function when an approval mode is selected */
    onSelect: (mode: ApprovalMode | undefined, scope: SettingScope) => void;
    /** The settings object */
    settings: LoadedSettings;
    /** Current approval mode */
    currentMode: ApprovalMode;
    /** Available terminal height for layout calculations */
    availableTerminalHeight?: number;
}
export declare function ApprovalModeDialog({ onSelect, settings, currentMode, availableTerminalHeight: _availableTerminalHeight, }: ApprovalModeDialogProps): React.JSX.Element;
export {};
