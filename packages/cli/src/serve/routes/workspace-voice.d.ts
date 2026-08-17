/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Application, type Request, type Response } from 'express';
import { SettingScope, type LoadedSettings } from '../../config/settings.js';
import {
  type WorkspaceVoiceStateUpdate,
  type WorkspaceVoiceTranscriptionInput,
  type WorkspaceVoiceTranscriptionResult,
} from '../../services/voice-service.js';
import { type WorkspaceSettingsWrite } from '../workspace-service/types.js';
import type { VoiceAdmissionResult } from '../voice/workspace-voice-coordinator.js';
import type {
  WorkspaceRegistry,
  WorkspaceRuntime,
} from '../workspace-registry.js';
type WorkspaceVoiceTranscriber = (
  input: WorkspaceVoiceTranscriptionInput,
) => Promise<WorkspaceVoiceTranscriptionResult>;
type PersistSetting = (
  workspace: string,
  scope: SettingScope,
  key: string,
  value: unknown,
  assertGenerationOpen?: () => void,
) => Promise<void | LoadedSettings>;
type PersistSettings = (
  workspace: string,
  writes: WorkspaceSettingsWrite[],
  assertGenerationOpen?: () => void,
) => Promise<void>;
export interface WorkspaceVoiceRouteDeps {
  boundWorkspace: string;
  mutate: (opts?: { strict?: boolean }) => import('express').RequestHandler;
  safeBody: (req: Request) => Record<string, unknown>;
  persistSetting?: PersistSetting;
  persistSettings?: PersistSettings;
  broadcastSettingsChanged: (
    key: string,
    value: unknown,
    scope: string,
    clientId: string | undefined,
  ) => void;
  parseAndValidateClientId: (
    req: Request,
    res: Response,
  ) => string | undefined | null;
  env?: Readonly<Record<string, string | undefined>>;
  scopeOverride?: SettingScope;
  acquireVoiceLease?: () => VoiceAdmissionResult;
  transcribe?: WorkspaceVoiceTranscriber;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
}
export interface WorkspaceQualifiedVoiceRouteDeps {
  workspaceRegistry: WorkspaceRegistry;
  mutate: WorkspaceVoiceRouteDeps['mutate'];
  safeBody: WorkspaceVoiceRouteDeps['safeBody'];
  persistSetting?: PersistSetting;
  persistSettings?: PersistSettings;
  transcribe?: WorkspaceVoiceTranscriber;
  acquireVoiceLease: (runtime: WorkspaceRuntime) => VoiceAdmissionResult;
  parseAndValidateClientId: (
    req: Request,
    res: Response,
    runtime: WorkspaceRuntime,
  ) => string | undefined | null;
  invalidateServeFeaturesCache: () => void;
}
export declare function parseWorkspaceVoiceUpdateParams(
  body: Record<string, unknown>,
):
  | WorkspaceVoiceStateUpdate
  | {
      error: string;
      code: string;
    };
export declare function registerWorkspaceVoiceRoutes(
  app: Application,
  deps: WorkspaceVoiceRouteDeps,
): void;
export declare function registerWorkspaceQualifiedVoiceRoutes(
  app: Application,
  deps: WorkspaceQualifiedVoiceRouteDeps,
): void;
export {};
