/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Settings } from '../../config/settings.js';
import { SettingScope } from '../../config/settings.js';
import type { LiveHostCoordinator } from './live-host-coordinator.js';
import type { LiveHostInstaller, LiveHostInstallStatus } from './live-host-installer.js';
import { type LiveProviderCredential } from './provider-credentials.js';
import type { LiveStatus } from './types.js';
export interface LiveSetupStatus {
    v: 1;
    enabled: boolean;
    keyConfigured: boolean;
    model: string;
    shortcut: string;
    install: LiveHostInstallStatus;
    live: LiveStatus;
}
export type LiveSetupApiKeyMutation = {
    operation: 'replace';
    value: string;
} | {
    operation: 'clear';
};
export interface LiveSetupUpdate {
    enabled?: boolean;
    shortcut?: string;
    apiKey?: LiveSetupApiKeyMutation;
}
interface SettingsWrite {
    scope: SettingScope;
    key: string;
    value: unknown;
}
export declare class LiveSetupError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(message: string, code: string, status: number);
}
export interface LiveSetupControllerDeps {
    loadSettings: () => Settings;
    persistSettings?: (writes: SettingsWrite[]) => Promise<void>;
    coordinator: LiveHostCoordinator;
    installer: LiveHostInstaller;
    getEnabled: () => boolean;
    setEnabled: (enabled: boolean) => Promise<void>;
    validateCredential?: (credential: LiveProviderCredential) => Promise<void>;
}
export declare class LiveSetupController {
    private readonly deps;
    private mutation;
    private installerScanned;
    constructor(deps: LiveSetupControllerDeps);
    getStatus(): Promise<LiveSetupStatus>;
    update(update: LiveSetupUpdate): Promise<LiveSetupStatus>;
    retryInstall(): Promise<LiveSetupStatus>;
    launchHost(): Promise<LiveSetupStatus>;
    private applyUpdate;
}
export {};
