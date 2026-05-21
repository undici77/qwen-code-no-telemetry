/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType, type Config, type ProviderConfig, type ProviderSetupInputs } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../../config/settings.js';
import { useQwenAuth } from '../hooks/useQwenAuth.js';
import { AuthState } from '../types.js';
import type { HistoryItem } from '../types.js';
/**
 * Normalize model IDs: split by comma, trim, deduplicate, remove empty.
 */
export declare function normalizeModelIds(modelIdsInput: string): string[];
/** @deprecated Use normalizeModelIds instead. */
export declare const normalizeCustomModelIds: typeof normalizeModelIds;
/**
 * Mask an API key for display: show first 3 and last 4 chars.
 */
export declare function maskApiKey(apiKey: string): string;
export type { QwenAuthState } from '../hooks/useQwenAuth.js';
export type AuthUiState = {
    authError: string | null;
    isAuthDialogOpen: boolean;
    isAuthenticating: boolean;
    pendingAuthType: AuthType | undefined;
    externalAuthState: {
        title: string;
        message: string;
        detail?: string;
    } | null;
    qwenAuthState: ReturnType<typeof useQwenAuth>['qwenAuthState'];
};
export type AuthController = {
    state: AuthUiState;
    actions: {
        setAuthState: (state: AuthState) => void;
        onAuthError: (error: string | null) => void;
        /** Close the /auth dialog without changing the active provider. */
        closeAuthDialog: () => void;
        /** Persist a provider's install plan and switch to it. */
        handleProviderSubmit: (providerConfig: ProviderConfig, inputs: ProviderSetupInputs) => Promise<void>;
        openAuthDialog: () => void;
        cancelAuthentication: () => void;
    };
};
export declare const useAuthCommand: (settings: LoadedSettings, config: Config, addItem: (item: Omit<HistoryItem, "id">, timestamp: number) => void, onAuthChange?: () => void) => {
    authState: AuthState;
    setAuthState: import("react").Dispatch<import("react").SetStateAction<AuthState>>;
    authError: string | null;
    onAuthError: (error: string | null) => void;
    isAuthDialogOpen: boolean;
    isAuthenticating: boolean;
    pendingAuthType: AuthType | undefined;
    externalAuthState: {
        title: string;
        message: string;
        detail?: string;
    } | null;
    qwenAuthState: import("../hooks/useQwenAuth.js").QwenAuthState;
    closeAuthDialog: () => void;
    handleProviderSubmit: (providerConfig: ProviderConfig, inputs: ProviderSetupInputs) => Promise<void>;
    openAuthDialog: () => void;
    cancelAuthentication: () => void;
    state: AuthUiState;
    actions: {
        setAuthState: (state: AuthState) => void;
        onAuthError: (error: string | null) => void;
        /** Close the /auth dialog without changing the active provider. */
        closeAuthDialog: () => void;
        /** Persist a provider's install plan and switch to it. */
        handleProviderSubmit: (providerConfig: ProviderConfig, inputs: ProviderSetupInputs) => Promise<void>;
        openAuthDialog: () => void;
        cancelAuthentication: () => void;
    };
};
