/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { getAdvertisedServeFeatures } from '../capabilities.js';
import type { ServeOptions } from '../types.js';
export declare const SERVE_LANGUAGE_CODES: string[];
export declare function advertisedMaxPendingPromptsPerSession(value: number | undefined): number | null;
export declare function advertisedMaxSessions(value: number | undefined): number | null;
interface CreateServeFeaturesDeps {
    opts: ServeOptions;
    boundWorkspace: string;
    persistSettingAvailable: boolean;
    sessionArtifactsPersistenceAvailable: boolean;
    sessionGenerationAvailable: () => boolean;
    workspaceGenerationAvailable: () => boolean;
    reloadAvailable: boolean;
    channelReloadAvailable: () => boolean;
    channelControlAvailable: boolean;
    channelManagementAvailable: boolean;
    sessionShellCommandEnabled: boolean;
    multiWorkspaceSessionsEnabled: () => boolean;
    dynamicWorkspaceRegistrationAvailable: boolean;
    persistentWorkspaceRegistrationAvailable: boolean;
    scratchWorkspaceRegistrationAvailable: () => boolean;
    realtimeVoiceEnabled: () => boolean;
    acpHttpEnabled?: boolean;
    workspaceRuntimeRemovalAvailable?: boolean;
    workspaceTrustHotReloadAvailable?: boolean;
    isPrimaryWorkspaceTrusted?: () => boolean;
    env?: Readonly<Record<string, string | undefined>>;
    getEnv?: () => Readonly<Record<string, string | undefined>>;
}
export interface ServeFeaturesRuntime {
    languageCodes: string[];
    currentServeFeatures: () => ReturnType<typeof getAdvertisedServeFeatures>;
    invalidateServeFeaturesCache: () => void;
}
export declare function createServeFeatures(deps: CreateServeFeaturesDeps): ServeFeaturesRuntime;
export {};
