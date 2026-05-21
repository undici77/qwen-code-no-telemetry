/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { SettingScope } from '../../config/settings.js';
/**
 * Hook that handles closing dialogs when Ctrl+C is pressed.
 * This mimics the ESC key behavior by calling the same handlers that ESC uses.
 * Returns true if a dialog was closed, false if no dialogs were open.
 */
export function useDialogClose(options) {
    const closeAnyOpenDialog = useCallback(() => {
        // Check each dialog in priority order and close using the same logic as ESC key
        if (options.isThemeDialogOpen) {
            // Mimic ESC behavior: onSelect(undefined, selectedScope) - keeps current theme
            options.handleThemeSelect(undefined, SettingScope.User);
            return true;
        }
        if (options.isApprovalModeDialogOpen) {
            // Mimic ESC behavior: onSelect(undefined, selectedScope) - keeps current mode
            options.handleApprovalModeSelect(undefined, SettingScope.User);
            return true;
        }
        if (options.isEditorDialogOpen) {
            // Mimic ESC behavior: call onExit() directly
            options.exitEditorDialog();
            return true;
        }
        if (options.isSettingsDialogOpen) {
            // Mimic ESC behavior: onSelect(undefined, selectedScope)
            options.closeSettingsDialog();
            return true;
        }
        if (options.isStatusLineDialogOpen) {
            options.closeStatusLineDialog();
            return true;
        }
        if (options.isHelpDialogOpen && options.closeHelpDialog) {
            options.closeHelpDialog();
            return true;
        }
        if (options.isMemoryDialogOpen) {
            options.closeMemoryDialog();
            return true;
        }
        if (options.activeArenaDialog !== null) {
            options.closeArenaDialog();
            return true;
        }
        if (options.isFolderTrustDialogOpen) {
            // FolderTrustDialog doesn't expose close function, but ESC would prevent exit
            // We follow the same pattern - prevent exit behavior
            return true;
        }
        if (options.showWelcomeBackDialog) {
            // WelcomeBack has its own close handler
            options.handleWelcomeBackClose();
            return true;
        }
        // Scoped invariant: the diff-dialog branch MUST sit above the
        // background-tasks branch because `DialogManager` renders the diff
        // dialog over `BackgroundTasksDialog` when both flags are true (see
        // `DialogManager.tsx` — diff block at the `BackgroundTasksDialog`
        // fall-through). The rest of this hook's ordering is **not** a
        // mirror of `DialogManager` and isn't intended to be: most higher-
        // priority dialogs in `DialogManager` (theme, auth, settings, …)
        // already appear above this block in their own priority order. Only
        // the diff-vs-background pair previously matched the wrong way.
        if (options.isDiffDialogOpen && options.closeDiffDialog) {
            // /diff dialog — same rationale as the background-tasks dialog:
            // Ctrl+C should dismiss the dialog rather than fall through to the
            // exit-prompt path or cancel the (non-existent) request.
            options.closeDiffDialog();
            return true;
        }
        if (options.isBackgroundTasksDialogOpen) {
            // Background tasks dialog — routed through closeAnyOpenDialog so
            // Ctrl+C and the global escape path dismiss it without escalating
            // to exit prompts.
            options.closeBackgroundTasksDialog();
            return true;
        }
        if (options.showWorktreeExitDialog && options.closeWorktreeExitDialog) {
            // WorktreeExitDialog: Ctrl+C / global escape dismisses it (same
            // semantics as picking Cancel in the dialog). Without this entry
            // the dialog was only escapable via the Escape key, inconsistent
            // with the rest of the dialog surface. (PR #4174 review.)
            options.closeWorktreeExitDialog();
            return true;
        }
        // No dialog was open
        return false;
    }, [options]);
    return { closeAnyOpenDialog };
}
//# sourceMappingURL=useDialogClose.js.map