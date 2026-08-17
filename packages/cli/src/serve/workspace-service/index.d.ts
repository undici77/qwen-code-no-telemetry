/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  DaemonWorkspaceService,
  DaemonWorkspaceServiceDeps,
} from './types.js';
export type {
  DaemonWorkspaceService,
  DaemonWorkspaceServiceDeps,
  WorkspaceRequestContext,
  RestartMcpServerResult,
  WorkspaceTrustChangeRequest,
  WorkspaceTrustChangeResult,
  WorkspaceTrustDesiredState,
  WorkspacePermissionRulesUpdate,
  WorkspaceVoiceSettingsUpdate,
  WorkspaceAcpPreheatResult,
  WorkspaceAcpStatusResult,
  WorkspaceSkillBatchToggleResult,
  WorkspaceSkillBatchToggleItem,
  WorkspaceSkillToggleError,
  WorkspaceSkillToggleErrorCode,
  WorkspaceSkillToggleResult,
  WorkspaceSkillToggleActivation,
  EnvReloadResult,
  ReloadResponse,
} from './types.js';
export {
  WorkspacePermissionRulesSessionRequiredError,
  WorkspaceSkillNotFoundError,
  WorkspaceSkillNotToggleableError,
  mapWorkspaceSkillToggleError,
} from './types.js';
export declare function createDaemonWorkspaceService(
  deps: DaemonWorkspaceServiceDeps,
): DaemonWorkspaceService;
