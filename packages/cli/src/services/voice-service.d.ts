/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { SettingScope, type LoadedSettings } from '../config/settings.js';
import { type VoiceTransport } from './voice-model.js';
import { type VoiceMode } from './voice-settings.js';
import {
  type RecordedVoiceAudio,
  type VoiceModelSource,
} from './voice-transcriber.js';
export declare const EMPTY_WORKSPACE_VOICE_UPDATE_ERROR =
  'At least one of `enabled`, `mode`, `language`, or `voiceModel` must be provided';
export interface WorkspaceVoiceModelDescriptor {
  id: string;
  transport: Exclude<VoiceTransport, 'unsupported'>;
}
export interface WorkspaceVoiceStatus {
  v: 1;
  workspaceCwd: string;
  enabled: boolean;
  mode: 'hold' | 'tap';
  language: string;
  voiceModel: string | null;
  availableVoiceModels: WorkspaceVoiceModelDescriptor[];
}
export interface WorkspaceVoiceTranscriptionInput extends RecordedVoiceAudio {
  voiceModel: string;
  settings: LoadedSettings;
  workspaceCwd: string;
  env?: Readonly<Record<string, string | undefined>>;
  abortSignal?: AbortSignal;
}
export interface WorkspaceVoiceTranscriptionResult {
  text: string;
  model: string;
  transport: Exclude<VoiceTransport, 'unsupported'>;
}
export interface WorkspaceVoiceStateUpdate {
  enabled?: boolean;
  mode?: VoiceMode;
  language?: string;
  voiceModel?: string;
}
export type WorkspaceVoiceSettingsWireScope = 'user' | 'workspace';
export interface WorkspaceVoiceSettingsWrite {
  scope: SettingScope;
  key: string;
  value: unknown;
}
export declare class WorkspaceVoiceError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string);
}
export declare function voiceSettingsScopeToWire(
  scope: SettingScope,
): WorkspaceVoiceSettingsWireScope;
export declare function buildWorkspaceVoiceSettingsWrites(
  settings: LoadedSettings,
  update: WorkspaceVoiceStateUpdate,
  opts?: {
    workspaceTrusted?: boolean;
    scopeOverride?: SettingScope;
  },
): WorkspaceVoiceSettingsWrite[];
export declare function createVoiceModelSource(
  settings: LoadedSettings,
): VoiceModelSource;
export declare function listAvailableVoiceModels(
  settings: LoadedSettings,
): WorkspaceVoiceModelDescriptor[];
export declare function hasConfiguredBatchVoiceTranscriptionModel(
  settings: LoadedSettings,
  opts?: {
    env?: Readonly<Record<string, string | undefined>>;
  },
): boolean;
export declare function buildWorkspaceVoiceStatus(
  workspaceCwd: string,
  settings: LoadedSettings,
): WorkspaceVoiceStatus;
export declare function validateWorkspaceVoiceModel(
  settings: LoadedSettings,
  voiceModel: string,
): WorkspaceVoiceModelDescriptor;
export declare function validateWorkspaceVoiceConfig(
  settings: LoadedSettings,
  voiceModel: string,
  opts?: {
    env?: Readonly<Record<string, string | undefined>>;
  },
): WorkspaceVoiceModelDescriptor;
export declare function validateWorkspaceVoiceState(
  settings: LoadedSettings,
  update: WorkspaceVoiceStateUpdate,
  opts?: {
    env?: Readonly<Record<string, string | undefined>>;
  },
): void;
export declare function transcribeWorkspaceVoiceAudio(
  input: WorkspaceVoiceTranscriptionInput,
): Promise<WorkspaceVoiceTranscriptionResult>;
