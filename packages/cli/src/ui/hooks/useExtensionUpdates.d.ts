/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExtensionManager } from '@qwen-code/qwen-code-core';
import { ExtensionUpdateState } from '../state/extensions.js';
import type { UseHistoryManagerReturn } from './useHistoryManager.js';
import { type ConfirmationRequest, type SettingInputRequest, type PluginChoiceRequest } from '../types.js';
type ConfirmationRequestWrapper = {
    prompt: React.ReactNode;
    onConfirm: (confirmed: boolean) => void;
};
type ConfirmationRequestAction = {
    type: 'add';
    request: ConfirmationRequestWrapper;
} | {
    type: 'remove';
    request: ConfirmationRequestWrapper;
};
export declare const useConfirmUpdateRequests: () => {
    addConfirmUpdateExtensionRequest: (original: ConfirmationRequest) => void;
    confirmUpdateExtensionRequests: ConfirmationRequestWrapper[];
    dispatchConfirmUpdateExtensionRequests: import("react").ActionDispatch<[action: ConfirmationRequestAction]>;
};
type SettingInputRequestWrapper = {
    settingName: string;
    settingDescription: string;
    sensitive: boolean;
    onSubmit: (value: string) => void;
    onCancel: () => void;
};
type SettingInputRequestAction = {
    type: 'add';
    request: SettingInputRequestWrapper;
} | {
    type: 'remove';
    request: SettingInputRequestWrapper;
};
export declare const useSettingInputRequests: () => {
    addSettingInputRequest: (original: SettingInputRequest) => void;
    settingInputRequests: SettingInputRequestWrapper[];
    dispatchSettingInputRequests: import("react").ActionDispatch<[action: SettingInputRequestAction]>;
};
type PluginChoiceRequestWrapper = {
    marketplaceName: string;
    plugins: Array<{
        name: string;
        description?: string;
    }>;
    onSelect: (pluginName: string) => void;
    onCancel: () => void;
};
type PluginChoiceRequestAction = {
    type: 'add';
    request: PluginChoiceRequestWrapper;
} | {
    type: 'remove';
    request: PluginChoiceRequestWrapper;
};
export declare const usePluginChoiceRequests: () => {
    addPluginChoiceRequest: (original: PluginChoiceRequest) => void;
    pluginChoiceRequests: PluginChoiceRequestWrapper[];
    dispatchPluginChoiceRequests: import("react").ActionDispatch<[action: PluginChoiceRequestAction]>;
};
export declare const useExtensionUpdates: (extensionManager: ExtensionManager, addItem: UseHistoryManagerReturn["addItem"], cwd: string) => {
    extensionsUpdateState: Map<string, ExtensionUpdateState>;
    extensionsUpdateStateInternal: Map<string, import("../state/extensions.js").ExtensionUpdateStatus>;
    dispatchExtensionStateUpdate: import("react").ActionDispatch<[action: import("../state/extensions.js").ExtensionUpdateAction]>;
};
export {};
