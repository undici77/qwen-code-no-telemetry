/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Key } from '../hooks/useKeypress.js';
import { type IdeIntegrationNudgeResult } from '../IdeIntegrationNudge.js';
import { type CommandMigrationNudgeResult } from '../CommandFormatMigrationNudge.js';
import { type FolderTrustChoice } from '../components/FolderTrustDialog.js';
import { type McpApprovalChoice } from '../components/mcp/MCPServerApprovalDialog.js';
import {
  type EditorType,
  type ApprovalMode,
  type ReasoningEffort,
} from '@qwen-code/qwen-code-core';
import { type SettingScope } from '../../config/settings.js';
import type { AuthController } from '../auth/useAuth.js';
import type { HistoryItem } from '../types.js';
import type { RestoreOption } from '../components/RewindSelector.js';
import { type ArenaDialogType } from '../hooks/useArenaCommand.js';
import type { StatusLinePresetConfig } from '../statusLinePresets.js';
export type HelpTab = 'general' | 'commands' | 'custom-commands';
export interface UIActions {
  openThemeDialog: () => void;
  openEditorDialog: () => void;
  openMemoryDialog: () => void;
  dismissSkillReviewDialog: () => void;
  closeSkillReviewDialog: () => void;
  acceptPendingSkill: (skillName: string) => void;
  rejectPendingSkill: (skillName: string) => void;
  handleThemeSelect: (
    themeName: string | undefined,
    scope: SettingScope,
  ) => void;
  handleThemeHighlight: (themeName: string | undefined) => void;
  handleApprovalModeSelect: (
    mode: ApprovalMode | undefined,
    scope: SettingScope,
  ) => void;
  handleEffortSelect: (effort: ReasoningEffort | undefined) => void;
  auth: AuthController['actions'];
  handleEditorSelect: (
    editorType: EditorType | undefined,
    scope: SettingScope,
  ) => void;
  exitEditorDialog: () => void;
  closeSettingsDialog: () => void;
  closeStatusLineDialog: () => void;
  notifyStatusLineSettingsChanged: (config: StatusLinePresetConfig) => void;
  closeMemoryDialog: () => void;
  closeModelDialog: () => void;
  openModelDialog: (options?: {
    fastModelMode?: boolean;
    voiceModelMode?: boolean;
    visionModelMode?: boolean;
    compactionModelMode?: boolean;
    imageModelMode?: boolean;
  }) => void;
  openArenaDialog: (type: Exclude<ArenaDialogType, null>) => void;
  closeArenaDialog: () => void;
  handleArenaModelsSelected?: (models: string[]) => void;
  dismissProviderUpdate: () => void;
  closeTrustDialog: () => void;
  closePermissionsDialog: () => void;
  setShellModeActive: (value: boolean) => void;
  vimHandleInput: (key: Key) => boolean;
  handleIdePromptComplete: (result: IdeIntegrationNudgeResult) => void;
  handleCommandMigrationComplete: (result: CommandMigrationNudgeResult) => void;
  handleFolderTrustSelect: (choice: FolderTrustChoice) => void;
  handleMcpApprovalSelect: (choice: McpApprovalChoice) => void;
  setConstrainHeight: (value: boolean) => void;
  onEscapePromptChange: (show: boolean) => void;
  onTabConsumerChange: (active: boolean) => void;
  refreshStatic: () => void;
  handleFinalSubmit: (
    value: string,
    options?: {
      deferUntilIdle?: boolean;
      submittedPrompt?: string;
    },
  ) => void;
  handleRetryLastPrompt: () => void;
  handleClearScreen: () => void;
  popAllQueuedMessages: () => string | null;
  invalidateSubmittedPromptProvenance: () => void;
  handleWelcomeBackSelection: (choice: 'continue' | 'restart') => void;
  handleWelcomeBackClose: () => void;
  handleWorktreeExit: (
    choice: 'keep' | 'remove' | 'cancel',
  ) => void | Promise<void>;
  closeSubagentCreateDialog: () => void;
  closeAgentsManagerDialog: () => void;
  openSkillsManagerDialog: () => void;
  closeSkillsManagerDialog: () => void;
  reloadCommands: () => void | Promise<void>;
  setInputBuffer: (text: string) => void;
  closeExtensionsManagerDialog: () => void;
  closeMcpDialog: () => void;
  openHooksDialog: () => void;
  closeHooksDialog: () => void;
  closeStatsDialog: () => void;
  openResumeDialog: () => void;
  closeResumeDialog: () => void;
  handleResume: (sessionId: string) => Promise<void>;
  handleBranch: (name?: string) => Promise<void>;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  handleDelete: (sessionId: string) => void;
  handleDeleteMany: (sessionIds: string[]) => void;
  openHelpDialog: () => void;
  closeHelpDialog: () => void;
  setHelpTab: (tab: HelpTab) => void;
  openFeedbackDialog: () => void;
  closeFeedbackDialog: () => void;
  temporaryCloseFeedbackDialog: () => void;
  submitFeedback: (rating: number) => void;
  openRewindSelector: () => void;
  closeRewindSelector: () => void;
  handleRewindConfirm: (userItem: HistoryItem, option: RestoreOption) => void;
  openDiffDialog: () => void;
  closeDiffDialog: () => void;
}
export declare const UIActionsContext: import('react').Context<UIActions | null>;
export declare const useUIActions: () => UIActions;
