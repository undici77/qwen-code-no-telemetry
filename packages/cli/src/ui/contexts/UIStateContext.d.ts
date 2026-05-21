/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HistoryItem, HistoryItemBtw, ThoughtSummary, ShellConfirmationRequest, ConfirmationRequest, LoopDetectionConfirmationRequest, HistoryItemWithoutId, StreamingState, SettingInputRequest, PluginChoiceRequest } from '../types.js';
import type { TodoItem } from '../components/TodoDisplay.js';
import type { AuthUiState } from '../auth/useAuth.js';
import type { CommandContext, SlashCommand } from '../commands/types.js';
import type { RecentSlashCommands } from '../hooks/useSlashCompletion.js';
import type { TextBuffer } from '../components/shared/text-buffer.js';
import type { IdeContext, ApprovalMode, IdeInfo, SessionListItem } from '@qwen-code/qwen-code-core';
import type { DOMElement } from 'ink';
import type { SessionStatsState } from '../contexts/SessionContext.js';
import type { ExtensionUpdateState } from '../state/extensions.js';
import type { UpdateObject } from '../utils/updateCheck.js';
import { type UseHistoryManagerReturn } from '../hooks/useHistoryManager.js';
import { type HelpTab } from './UIActionsContext.js';
import { type RestartReason } from '../hooks/useIdeTrustListener.js';
import { type ProviderUpdateRequest } from '../hooks/useProviderUpdates.js';
import { type ArenaDialogType } from '../hooks/useArenaCommand.js';
import type { StatusLinePresetConfig } from '../statusLinePresets.js';
export interface UIState {
    history: HistoryItem[];
    historyManager: UseHistoryManagerReturn;
    isThemeDialogOpen: boolean;
    themeError: string | null;
    auth: AuthUiState;
    isConfigInitialized: boolean;
    editorError: string | null;
    isEditorDialogOpen: boolean;
    debugMessage: string;
    quittingMessages: HistoryItem[] | null;
    isSettingsDialogOpen: boolean;
    isStatusLineDialogOpen: boolean;
    statusLineSettingsVersion?: number;
    statusLineConfigOverride?: StatusLinePresetConfig;
    isMemoryDialogOpen: boolean;
    isModelDialogOpen: boolean;
    isFastModelMode: boolean;
    isTrustDialogOpen: boolean;
    activeArenaDialog: ArenaDialogType;
    isPermissionsDialogOpen: boolean;
    isApprovalModeDialogOpen: boolean;
    isResumeDialogOpen: boolean;
    resumeMatchedSessions: SessionListItem[] | undefined;
    isDeleteDialogOpen: boolean;
    isHelpDialogOpen: boolean;
    activeHelpTab: HelpTab;
    slashCommands: readonly SlashCommand[];
    recentSlashCommands: RecentSlashCommands;
    pendingSlashCommandHistoryItems: HistoryItemWithoutId[];
    commandContext: CommandContext;
    shellConfirmationRequest: ShellConfirmationRequest | null;
    confirmationRequest: ConfirmationRequest | null;
    confirmUpdateExtensionRequests: ConfirmationRequest[];
    providerUpdateRequest: ProviderUpdateRequest | undefined;
    settingInputRequests: SettingInputRequest[];
    pluginChoiceRequests: PluginChoiceRequest[];
    loopDetectionConfirmationRequest: LoopDetectionConfirmationRequest | null;
    geminiMdFileCount: number;
    streamingState: StreamingState;
    initError: string | null;
    pendingGeminiHistoryItems: HistoryItemWithoutId[];
    thought: ThoughtSummary | null;
    shellModeActive: boolean;
    userMessages: string[];
    buffer: TextBuffer;
    inputWidth: number;
    suggestionsWidth: number;
    isInputActive: boolean;
    shouldShowIdePrompt: boolean;
    shouldShowCommandMigrationNudge: boolean;
    commandMigrationTomlFiles: string[];
    isFolderTrustDialogOpen: boolean;
    isTrustedFolder: boolean | undefined;
    constrainHeight: boolean;
    ideContextState: IdeContext | undefined;
    showToolDescriptions: boolean;
    ctrlCPressedOnce: boolean;
    ctrlDPressedOnce: boolean;
    showEscapePrompt: boolean;
    elapsedTime: number;
    currentLoadingPhrase: string;
    historyRemountKey: number;
    messageQueue: string[];
    showAutoAcceptIndicator: ApprovalMode;
    currentModel: string;
    contextFileNames: string[];
    availableTerminalHeight: number | undefined;
    mainAreaWidth: number;
    staticAreaMaxItemHeight: number;
    staticExtraHeight: number;
    dialogsVisible: boolean;
    pendingHistoryItems: HistoryItemWithoutId[];
    stickyTodos: TodoItem[] | null;
    btwItem: HistoryItemBtw | null;
    setBtwItem: (item: HistoryItemBtw | null) => void;
    cancelBtw: () => void;
    nightly: boolean;
    branchName: string | undefined;
    /**
     * Active worktree session (from the `<sessionId>.worktree.json` sidecar).
     * Set when `enter_worktree` has been called, cleared when `exit_worktree`
     * removes the sidecar. Used by the Footer to display the worktree
     * indicator and by WorktreeExitDialog to know what to operate on.
     */
    activeWorktree: {
        slug: string;
        branch: string;
        path: string;
        originalCwd: string;
        originalBranch: string;
        originalHeadCommit: string;
    } | null;
    /** Visibility of WorktreeExitDialog (only shown when activeWorktree != null). */
    showWorktreeExitDialog: boolean;
    sessionStats: SessionStatsState;
    terminalWidth: number;
    terminalHeight: number;
    mainControlsRef: React.MutableRefObject<DOMElement | null>;
    currentIDE: IdeInfo | null;
    updateInfo: UpdateObject | null;
    showIdeRestartPrompt: boolean;
    ideTrustRestartReason: RestartReason;
    isRestarting: boolean;
    extensionsUpdateState: Map<string, ExtensionUpdateState>;
    activePtyId: number | undefined;
    embeddedShellFocused: boolean;
    showWelcomeBackDialog: boolean;
    welcomeBackInfo: {
        hasHistory: boolean;
        lastPrompt?: string;
    } | null;
    welcomeBackChoice: 'continue' | 'restart' | null;
    isSubagentCreateDialogOpen: boolean;
    isAgentsManagerDialogOpen: boolean;
    isExtensionsManagerDialogOpen: boolean;
    isMcpDialogOpen: boolean;
    isHooksDialogOpen: boolean;
    isFeedbackDialogOpen: boolean;
    taskStartTokens: number;
    streamingResponseLengthRef: React.RefObject<number>;
    isReceivingContent: boolean;
    sessionName: string | null;
    setSessionName: (name: string | null) => void;
    promptSuggestion: string | null;
    /** Dismiss prompt suggestion (clears state, aborts speculation) */
    dismissPromptSuggestion: () => void;
    isRewindSelectorOpen: boolean;
    rewindEscPending: boolean;
    isDiffDialogOpen: boolean;
}
export declare const UIStateContext: import("react").Context<UIState | null>;
export declare const useUIState: () => UIState;
