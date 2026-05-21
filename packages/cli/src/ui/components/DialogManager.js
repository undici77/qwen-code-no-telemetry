import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { IdeIntegrationNudge } from '../IdeIntegrationNudge.js';
import { CommandFormatMigrationNudge } from '../CommandFormatMigrationNudge.js';
import { LoopDetectionConfirmation } from './LoopDetectionConfirmation.js';
import { FolderTrustDialog } from './FolderTrustDialog.js';
import { ShellConfirmationDialog } from './ShellConfirmationDialog.js';
import { ConsentPrompt } from './ConsentPrompt.js';
import { ProviderUpdatePrompt } from './ProviderUpdatePrompt.js';
import { SettingInputPrompt } from './SettingInputPrompt.js';
import { PluginChoicePrompt } from './PluginChoicePrompt.js';
import { ThemeDialog } from './ThemeDialog.js';
import { SettingsDialog } from './SettingsDialog.js';
import { StatusLineDialog } from './StatusLineDialog.js';
import { QwenOAuthProgress } from './QwenOAuthProgress.js';
import { ExternalAuthProgress } from './ExternalAuthProgress.js';
import { AuthDialog } from '../auth/AuthDialog.js';
import { EditorSettingsDialog } from './EditorSettingsDialog.js';
import { TrustDialog } from './TrustDialog.js';
import { PermissionsDialog } from './PermissionsDialog.js';
import { ModelDialog } from './ModelDialog.js';
import { ArenaStartDialog } from './arena/ArenaStartDialog.js';
import { ArenaSelectDialog } from './arena/ArenaSelectDialog.js';
import { ArenaStopDialog } from './arena/ArenaStopDialog.js';
import { ArenaStatusDialog } from './arena/ArenaStatusDialog.js';
import { ApprovalModeDialog } from './ApprovalModeDialog.js';
import { theme } from '../semantic-colors.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useUIActions } from '../contexts/UIActionsContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { AuthState } from '../types.js';
import { AuthType } from '@qwen-code/qwen-code-core';
import process from 'node:process';
import {} from '../hooks/useHistoryManager.js';
import { IdeTrustChangeDialog } from './IdeTrustChangeDialog.js';
import { WelcomeBackDialog } from './WelcomeBackDialog.js';
import { WorktreeExitDialog } from './WorktreeExitDialog.js';
import { AgentCreationWizard } from './subagents/create/AgentCreationWizard.js';
import { AgentsManagerDialog } from './subagents/manage/AgentsManagerDialog.js';
import { ExtensionsManagerDialog } from './extensions/ExtensionsManagerDialog.js';
import { MCPManagementDialog } from './mcp/MCPManagementDialog.js';
import { HooksManagementDialog } from './hooks/HooksManagementDialog.js';
import { SessionPicker } from './SessionPicker.js';
import { RewindSelector } from './RewindSelector.js';
import { DiffDialog } from './DiffDialog.js';
import { MemoryDialog } from './MemoryDialog.js';
import { Help } from './Help.js';
import { BackgroundTasksDialog } from './background-view/BackgroundTasksDialog.js';
import { useBackgroundTaskViewState } from '../contexts/BackgroundTaskViewContext.js';
import { t } from '../../i18n/index.js';
// Props for DialogManager
export const DialogManager = ({ addItem, terminalWidth, }) => {
    const config = useConfig();
    const settings = useSettings();
    const uiState = useUIState();
    const uiActions = useUIActions();
    const { dialogOpen: bgTasksDialogOpen } = useBackgroundTaskViewState();
    const { constrainHeight, terminalHeight, staticExtraHeight, mainAreaWidth } = uiState;
    if (uiState.showWelcomeBackDialog && uiState.welcomeBackInfo?.hasHistory) {
        return (_jsx(WelcomeBackDialog, { welcomeBackInfo: uiState.welcomeBackInfo, onSelect: uiActions.handleWelcomeBackSelection, onClose: uiActions.handleWelcomeBackClose }));
    }
    if (uiState.showWorktreeExitDialog && uiState.activeWorktree) {
        return (_jsx(WorktreeExitDialog, { slug: uiState.activeWorktree.slug, branch: uiState.activeWorktree.branch, worktreePath: uiState.activeWorktree.path, originalHeadCommit: uiState.activeWorktree.originalHeadCommit, onKeep: () => void uiActions.handleWorktreeExit('keep'), onRemove: () => void uiActions.handleWorktreeExit('remove'), onCancel: () => void uiActions.handleWorktreeExit('cancel') }));
    }
    if (uiState.showIdeRestartPrompt) {
        return _jsx(IdeTrustChangeDialog, { reason: uiState.ideTrustRestartReason });
    }
    if (uiState.shouldShowIdePrompt) {
        return (_jsx(IdeIntegrationNudge, { ide: uiState.currentIDE, onComplete: uiActions.handleIdePromptComplete }));
    }
    if (uiState.shouldShowCommandMigrationNudge) {
        return (_jsx(CommandFormatMigrationNudge, { tomlFiles: uiState.commandMigrationTomlFiles, onComplete: uiActions.handleCommandMigrationComplete }));
    }
    if (uiState.isFolderTrustDialogOpen) {
        return (_jsx(FolderTrustDialog, { onSelect: uiActions.handleFolderTrustSelect, isRestarting: uiState.isRestarting }));
    }
    if (uiState.shellConfirmationRequest) {
        return (_jsx(ShellConfirmationDialog, { request: uiState.shellConfirmationRequest }));
    }
    if (uiState.loopDetectionConfirmationRequest) {
        return (_jsx(LoopDetectionConfirmation, { onComplete: uiState.loopDetectionConfirmationRequest.onComplete }));
    }
    if (uiState.confirmationRequest) {
        return (_jsx(ConsentPrompt, { prompt: uiState.confirmationRequest.prompt, onConfirm: uiState.confirmationRequest.onConfirm, terminalWidth: terminalWidth }));
    }
    if (uiState.confirmUpdateExtensionRequests.length > 0) {
        const request = uiState.confirmUpdateExtensionRequests[0];
        return (_jsx(ConsentPrompt, { prompt: request.prompt, onConfirm: request.onConfirm, terminalWidth: terminalWidth }));
    }
    if (uiState.providerUpdateRequest) {
        return (_jsx(ProviderUpdatePrompt, { entries: uiState.providerUpdateRequest.entries, onConfirm: uiState.providerUpdateRequest.onConfirm }));
    }
    if (uiState.settingInputRequests.length > 0) {
        const request = uiState.settingInputRequests[0];
        // Use settingName as key to force re-mount when switching between different settings
        return (_jsx(SettingInputPrompt, { settingName: request.settingName, settingDescription: request.settingDescription, sensitive: request.sensitive, onSubmit: request.onSubmit, onCancel: request.onCancel, terminalWidth: terminalWidth }, request.settingName));
    }
    if (uiState.pluginChoiceRequests.length > 0) {
        const request = uiState.pluginChoiceRequests[0];
        return (_jsx(PluginChoicePrompt, { marketplaceName: request.marketplaceName, plugins: request.plugins, onSelect: request.onSelect, onCancel: request.onCancel, terminalWidth: terminalWidth }, request.marketplaceName));
    }
    if (uiState.isThemeDialogOpen) {
        return (_jsxs(Box, { flexDirection: "column", children: [uiState.themeError && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.status.error, children: uiState.themeError }) })), _jsx(ThemeDialog, { onSelect: uiActions.handleThemeSelect, onHighlight: uiActions.handleThemeHighlight, settings: settings, availableTerminalHeight: constrainHeight ? terminalHeight - staticExtraHeight : undefined, terminalWidth: mainAreaWidth })] }));
    }
    if (uiState.isEditorDialogOpen) {
        return (_jsxs(Box, { flexDirection: "column", children: [uiState.editorError && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.status.error, children: uiState.editorError }) })), _jsx(EditorSettingsDialog, { onSelect: uiActions.handleEditorSelect, settings: settings, onExit: uiActions.exitEditorDialog })] }));
    }
    if (uiState.isModelDialogOpen) {
        return (_jsx(ModelDialog, { onClose: uiActions.closeModelDialog, isFastModelMode: uiState.isFastModelMode }));
    }
    if (uiState.isSettingsDialogOpen) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(SettingsDialog, { settings: settings, onSelect: (settingName) => {
                    if (settingName === 'ui.theme') {
                        uiActions.openThemeDialog();
                        return;
                    }
                    if (settingName === 'general.preferredEditor') {
                        uiActions.openEditorDialog();
                        return;
                    }
                    if (settingName === 'fastModel') {
                        uiActions.openModelDialog({ fastModelMode: true });
                        return;
                    }
                    uiActions.closeSettingsDialog();
                }, onRestartRequest: () => process.exit(0), availableTerminalHeight: terminalHeight - staticExtraHeight, config: config }) }));
    }
    if (uiState.isStatusLineDialogOpen) {
        return (_jsx(StatusLineDialog, { settings: settings, config: config, uiState: uiState, addItem: addItem, onSaved: uiActions.notifyStatusLineSettingsChanged, onClose: uiActions.closeStatusLineDialog, availableTerminalHeight: terminalHeight - staticExtraHeight }));
    }
    if (uiState.isMemoryDialogOpen) {
        return _jsx(MemoryDialog, { onClose: uiActions.closeMemoryDialog });
    }
    if (uiState.isHelpDialogOpen) {
        return (_jsx(Help, { commands: uiState.slashCommands, width: mainAreaWidth, activeTab: uiState.activeHelpTab, onTabChange: uiActions.setHelpTab, onClose: uiActions.closeHelpDialog, isInteractive: true }));
    }
    if (uiState.isApprovalModeDialogOpen) {
        const currentMode = config.getApprovalMode();
        return (_jsx(Box, { flexDirection: "column", children: _jsx(ApprovalModeDialog, { settings: settings, currentMode: currentMode, onSelect: uiActions.handleApprovalModeSelect, availableTerminalHeight: constrainHeight ? terminalHeight - staticExtraHeight : undefined }) }));
    }
    if (uiState.activeArenaDialog === 'start') {
        return (_jsx(ArenaStartDialog, { onClose: () => uiActions.closeArenaDialog(), onConfirm: (models) => uiActions.handleArenaModelsSelected?.(models) }));
    }
    if (uiState.activeArenaDialog === 'status') {
        const arenaManager = config.getArenaManager();
        if (arenaManager) {
            return (_jsx(ArenaStatusDialog, { manager: arenaManager, closeArenaDialog: uiActions.closeArenaDialog, width: mainAreaWidth }));
        }
    }
    if (uiState.activeArenaDialog === 'stop') {
        return (_jsx(ArenaStopDialog, { config: config, addItem: addItem, closeArenaDialog: uiActions.closeArenaDialog }));
    }
    if (uiState.activeArenaDialog === 'select') {
        const arenaManager = config.getArenaManager();
        if (arenaManager) {
            return (_jsx(ArenaSelectDialog, { manager: arenaManager, config: config, addItem: addItem, closeArenaDialog: uiActions.closeArenaDialog }));
        }
    }
    if (uiState.auth.isAuthDialogOpen || uiState.auth.authError) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(AuthDialog, {}) }));
    }
    if (uiState.auth.isAuthenticating) {
        if (uiState.auth.pendingAuthType === AuthType.USE_OPENAI &&
            uiState.auth.externalAuthState) {
            return (_jsx(ExternalAuthProgress, { title: uiState.auth.externalAuthState.title, message: uiState.auth.externalAuthState.message, detail: uiState.auth.externalAuthState.detail, onCancel: () => {
                    uiActions.auth.cancelAuthentication();
                    uiActions.auth.setAuthState(AuthState.Updating);
                } }));
        }
        // OpenAI authentication now handled through AuthDialog with coding-plan/custom sub-modes
        // Qwen OAuth remains as a separate flow
        if (uiState.auth.pendingAuthType === AuthType.QWEN_OAUTH) {
            return (_jsx(QwenOAuthProgress, { deviceAuth: uiState.auth.qwenAuthState.deviceAuth || undefined, authStatus: uiState.auth.qwenAuthState.authStatus, authMessage: uiState.auth.qwenAuthState.authMessage, onTimeout: () => {
                    uiActions.auth.onAuthError('Qwen OAuth authentication timed out.');
                    uiActions.auth.cancelAuthentication();
                    uiActions.auth.setAuthState(AuthState.Updating);
                }, onCancel: () => {
                    uiActions.auth.cancelAuthentication();
                    uiActions.auth.setAuthState(AuthState.Updating);
                } }));
        }
    }
    if (uiState.isTrustDialogOpen) {
        return (_jsx(TrustDialog, { onExit: uiActions.closeTrustDialog, addItem: addItem }));
    }
    if (uiState.isPermissionsDialogOpen) {
        return _jsx(PermissionsDialog, { onExit: uiActions.closePermissionsDialog });
    }
    if (uiState.isSubagentCreateDialogOpen) {
        return (_jsx(AgentCreationWizard, { onClose: uiActions.closeSubagentCreateDialog, config: config }));
    }
    if (uiState.isAgentsManagerDialogOpen) {
        return (_jsx(AgentsManagerDialog, { onClose: uiActions.closeAgentsManagerDialog, config: config }));
    }
    if (uiState.isExtensionsManagerDialogOpen) {
        return (_jsx(ExtensionsManagerDialog, { onClose: uiActions.closeExtensionsManagerDialog, config: config }));
    }
    if (uiState.isHooksDialogOpen) {
        return _jsx(HooksManagementDialog, { onClose: uiActions.closeHooksDialog });
    }
    if (uiState.isMcpDialogOpen) {
        return _jsx(MCPManagementDialog, { onClose: uiActions.closeMcpDialog });
    }
    if (uiState.isResumeDialogOpen) {
        return (_jsx(SessionPicker, { sessionService: config.getSessionService(), currentBranch: uiState.branchName, onSelect: uiActions.handleResume, onCancel: uiActions.closeResumeDialog, initialSessions: uiState.resumeMatchedSessions, enablePreview: true }));
    }
    if (uiState.isDeleteDialogOpen) {
        const currentSessionId = config.getSessionId();
        return (_jsx(SessionPicker, { sessionService: config.getSessionService(), currentBranch: uiState.branchName, onSelect: uiActions.handleDelete, onCancel: uiActions.closeDeleteDialog, title: t('Delete Session'), enableMultiSelect: true, onConfirmMulti: uiActions.handleDeleteMany, disabledIds: currentSessionId ? [currentSessionId] : undefined }));
    }
    if (uiState.isRewindSelectorOpen) {
        return (_jsx(RewindSelector, { history: uiState.history, onRewind: uiActions.handleRewindConfirm, onCancel: uiActions.closeRewindSelector, fileCheckpointingEnabled: config.getFileCheckpointingEnabled(), fileHistoryService: config.getFileHistoryService() }));
    }
    if (uiState.isDiffDialogOpen) {
        return (_jsx(DiffDialog, { history: uiState.history, cwd: config.getWorkingDir() || config.getProjectRoot(), fileHistoryService: config.getFileHistoryService(), fileCheckpointingEnabled: config.getFileCheckpointingEnabled(), onClose: uiActions.closeDiffDialog }));
    }
    // Background tasks dialog — lowest priority so other dialogs
    // (permissions, trust prompts, auth, etc.) always take precedence. The
    // dialog is part of the shared dialogsVisible machinery (see
    // AppContainer) so its visibility mutes the composer and the global
    // Ctrl+C / Esc handlers route through `closeAnyOpenDialog`.
    if (bgTasksDialogOpen) {
        return (_jsx(BackgroundTasksDialog, { availableTerminalHeight: terminalHeight - staticExtraHeight, terminalWidth: mainAreaWidth }));
    }
    return null;
};
//# sourceMappingURL=DialogManager.js.map