/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonCapabilities, DaemonClient, DaemonSettingUpdateResult, DaemonWorkspaceCapability, DaemonWorkspaceProvidersStatus, DaemonWorkspaceSettingsStatus, DaemonWorkspaceVoiceStatus } from '@qwen-code/sdk/daemon';
interface VoiceTargetBase {
    cwd?: string;
    workspaceKey: string;
    ownerKey: string;
    sessionId?: string;
}
export type VoiceWorkspaceTarget = (VoiceTargetBase & {
    route: 'legacy-primary';
    streamPath: 'voice/stream';
}) | (VoiceTargetBase & {
    route: 'workspace-qualified';
    cwd: string;
    selector: {
        kind: 'id' | 'cwd';
        value: string;
    };
    streamPath: string;
});
export interface VoiceStatusRevision {
    user: number;
    workspace: number;
}
export interface ResolveVoiceWorkspaceTargetOptions {
    capabilities: DaemonCapabilities | undefined;
    intendedCwd: string | undefined;
    sessionId?: string;
    /**
     * Pass App's merged list when a locked workspace has been registered before
     * the next capabilities snapshot arrives.
     */
    workspaces?: readonly DaemonWorkspaceCapability[];
}
export declare function resolveVoiceWorkspaceTarget({ capabilities, intendedCwd, sessionId, workspaces, }: ResolveVoiceWorkspaceTargetOptions): VoiceWorkspaceTarget | undefined;
export declare function supportsVoiceCapture(target: VoiceWorkspaceTarget | undefined, features: readonly string[]): boolean;
export declare function supportsVoiceModelSettings(target: VoiceWorkspaceTarget | undefined, features: readonly string[]): boolean;
export declare function loadVoiceStatus(client: DaemonClient, target: VoiceWorkspaceTarget): Promise<DaemonWorkspaceVoiceStatus>;
export declare function loadVoiceProviders(client: DaemonClient, target: VoiceWorkspaceTarget): Promise<DaemonWorkspaceProvidersStatus>;
export declare function loadVoiceSettings(client: DaemonClient, target: VoiceWorkspaceTarget): Promise<DaemonWorkspaceSettingsStatus>;
export declare function setVoiceModelSetting(client: DaemonClient, target: VoiceWorkspaceTarget, scope: 'workspace' | 'user', value: string): Promise<DaemonSettingUpdateResult>;
export {};
