/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ApprovalMode, Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings, SettingScope } from '../../config/settings.js';
interface UseApprovalModeCommandReturn {
    isApprovalModeDialogOpen: boolean;
    openApprovalModeDialog: () => void;
    handleApprovalModeSelect: (mode: ApprovalMode | undefined, scope: SettingScope) => void;
}
export declare const useApprovalModeCommand: (loadedSettings: LoadedSettings, config: Config) => UseApprovalModeCommandReturn;
export {};
