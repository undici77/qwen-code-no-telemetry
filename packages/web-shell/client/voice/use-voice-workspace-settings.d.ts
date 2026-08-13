/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonClient, DaemonSettingDescriptor, DaemonWorkspaceSettingsStatus } from '@qwen-code/sdk/daemon';
import { type VoiceWorkspaceTarget } from './voice-workspace-target';
interface VoiceWorkspaceSettingsState {
    descriptor: DaemonSettingDescriptor | undefined;
    reload: () => Promise<DaemonWorkspaceSettingsStatus | undefined>;
}
export declare function useVoiceWorkspaceSettings(client: DaemonClient, target: VoiceWorkspaceTarget | undefined, enabled: boolean, revisionKey: string): VoiceWorkspaceSettingsState;
export {};
