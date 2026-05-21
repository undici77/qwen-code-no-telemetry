/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../../config/settings.js';
import type { UseHistoryManagerReturn } from '../hooks/useHistoryManager.js';
import type { UIState } from '../contexts/UIStateContext.js';
import { type StatusLinePresetConfig } from '../statusLinePresets.js';
interface StatusLineDialogProps {
    settings: LoadedSettings;
    config: Config;
    uiState: UIState;
    addItem: UseHistoryManagerReturn['addItem'];
    onSaved?: (config: StatusLinePresetConfig) => void;
    onClose: () => void;
    availableTerminalHeight?: number;
}
export declare function StatusLineDialog({ settings, config, uiState, addItem, onSaved, onClose, availableTerminalHeight, }: StatusLineDialogProps): React.JSX.Element;
export {};
