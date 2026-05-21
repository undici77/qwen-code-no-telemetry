/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '@qwen-code/qwen-code-core';
import type { ProviderConfig, ProviderSetupInputs } from '@qwen-code/qwen-code-core';
export type SetupStep = 'protocol' | 'baseUrl' | 'apiKey' | 'models' | 'advancedConfig' | 'review';
export interface ProviderSetupState {
    provider: ProviderConfig | null;
    step: SetupStep | null;
    stepIndex: number;
    totalSteps: number;
    protocol: AuthType;
    baseUrl: string;
    baseUrlPlaceholder: string;
    baseUrlOptionIndex: number;
    baseUrlError: string | null;
    apiKey: string;
    apiKeyError: string | null;
    modelIds: string;
    modelIdsError: string | null;
    thinkingEnabled: boolean;
    modalityEnabled: boolean;
    modalityImage: boolean;
    modalityVideo: boolean;
    modalityAudio: boolean;
    modalityPdf: boolean;
    contextWindowSize: string;
    focusedConfigIndex: number;
    previewJson: string;
}
export declare function useProviderSetupFlow(onSubmit: (config: ProviderConfig, inputs: ProviderSetupInputs) => Promise<void>): {
    state: ProviderSetupState;
    start: (config: ProviderConfig, initialProtocol?: AuthType, existingEnv?: Record<string, string>) => void;
    reset: () => void;
    goBack: () => boolean;
    selectProtocol: (selectedProtocol: AuthType) => void;
    selectBaseUrl: (selectedUrl: string) => void;
    highlightBaseUrl: (url: string) => void;
    submitBaseUrl: () => boolean;
    changeBaseUrl: (value: string) => void;
    changeApiKey: (value: string) => void;
    submitApiKey: (keyOverride?: string) => boolean;
    changeModelIds: (value: string) => void;
    submitModelIds: () => boolean;
    moveAdvancedFocusUp: () => void;
    moveAdvancedFocusDown: () => void;
    toggleFocusedAdvancedOption: () => void;
    changeContextWindowSize: (value: string) => void;
    submitAdvancedConfig: () => void;
    submit: () => void;
};
export type ProviderSetupFlow = ReturnType<typeof useProviderSetupFlow>;
