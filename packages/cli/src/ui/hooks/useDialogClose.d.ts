/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { SettingScope } from '../../config/settings.js';
import type { AuthType, ApprovalMode, ReasoningEffort } from '@qwen-code/qwen-code-core';
import type { ArenaDialogType } from './useArenaCommand.js';
export interface DialogCloseOptions {
    isThemeDialogOpen: boolean;
    handleThemeSelect: (theme: string | undefined, scope: SettingScope) => void;
    isApprovalModeDialogOpen: boolean;
    handleApprovalModeSelect: (mode: ApprovalMode | undefined, scope: SettingScope) => void;
    isEffortDialogOpen: boolean;
    handleEffortSelect: (effort: ReasoningEffort | undefined) => void;
    isAuthDialogOpen: boolean;
    closeAuthDialog: () => void;
    pendingAuthType: AuthType | undefined;
    isEditorDialogOpen: boolean;
    exitEditorDialog: () => void;
    isSettingsDialogOpen: boolean;
    closeSettingsDialog: () => void;
    isStatusLineDialogOpen: boolean;
    closeStatusLineDialog: () => void;
    isMemoryDialogOpen: boolean;
    closeMemoryDialog: () => void;
    activeArenaDialog: ArenaDialogType;
    closeArenaDialog: () => void;
    isFolderTrustDialogOpen: boolean;
    showWelcomeBackDialog: boolean;
    handleWelcomeBackClose: () => void;
    isHelpDialogOpen?: boolean;
    closeHelpDialog?: () => void;
    isSkillReviewDialogOpen: boolean;
    dismissSkillReviewDialog: () => void;
    isBackgroundTasksDialogOpen: boolean;
    closeBackgroundTasksDialog: () => void;
    isDiffDialogOpen?: boolean;
    closeDiffDialog?: () => void;
    isStatsDialogOpen?: boolean;
    closeStatsDialog?: () => void;
    showWorktreeExitDialog?: boolean;
    closeWorktreeExitDialog?: () => void;
}
/**
 * Hook that handles closing dialogs when Ctrl+C is pressed.
 * This mimics the ESC key behavior by calling the same handlers that ESC uses.
 * Returns true if a dialog was closed, false if no dialogs were open.
 */
export declare function useDialogClose(options: DialogCloseOptions): {
    closeAnyOpenDialog: () => boolean;
};
