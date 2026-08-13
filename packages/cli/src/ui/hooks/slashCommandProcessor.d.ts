/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type MutableRefObject } from 'react';
import { type PartListUnion } from '@google/genai';
import type { UseHistoryManagerReturn } from './useHistoryManager.js';
import type { ArenaDialogType } from './useArenaCommand.js';
import { type Logger, type Config, ToolConfirmationOutcome, type SessionListItem } from '@qwen-code/qwen-code-core';
import type { HistoryItemWithoutId, HistoryItemBtw, SlashCommandProcessorResult, HistoryItem, ConfirmationRequest } from '../types.js';
import type { LoadedSettings } from '../../config/settings.js';
import { type CommandContext, type SlashCommand } from '../commands/types.js';
import type { RecentSlashCommand } from './useSlashCompletion.js';
import { ExtensionRefreshState } from '../../config/extension-refresh-state.js';
import { type ExtensionUpdateAction, type ExtensionUpdateStatus } from '../state/extensions.js';
export interface SlashCommandProcessorActions {
    openAuthDialog: () => void;
    openArenaDialog?: (type: Exclude<ArenaDialogType, null>) => void;
    openThemeDialog: () => void;
    openEditorDialog: () => void;
    openMemoryDialog: () => void;
    openSettingsDialog: () => void;
    openStatusLineDialog: () => void;
    openModelDialog: (options?: {
        fastModelMode?: boolean;
        voiceModelMode?: boolean;
        visionModelMode?: boolean;
        compactionModelMode?: boolean;
        imageModelMode?: boolean;
        persistScope?: 'workspace' | 'user';
    }) => void;
    openTrustDialog: () => void;
    openPermissionsDialog: () => void;
    openApprovalModeDialog: () => void;
    openEffortDialog: () => void;
    openResumeDialog: (matchedSessions?: SessionListItem[]) => void;
    handleResume: (sessionId: string) => Promise<void>;
    handleBranch: (name?: string) => Promise<void>;
    openDeleteDialog: () => void;
    quit: (messages: HistoryItem[]) => void;
    setDebugMessage: (message: string) => void;
    dispatchExtensionStateUpdate: (action: ExtensionUpdateAction) => void;
    addConfirmUpdateExtensionRequest: (request: ConfirmationRequest) => void;
    openSubagentCreateDialog: () => void;
    openAgentsManagerDialog: () => void;
    openSkillsManagerDialog: () => void;
    openExtensionsManagerDialog: () => void;
    openMcpDialog: () => void;
    openHooksDialog: () => void;
    openStatsDialog: () => void;
    openRewindSelector: () => void;
    openDiffDialog: () => void;
    openHelpDialog: () => void;
    clearPendingState: () => void;
}
/**
 * Hook to define and process slash commands (e.g., /help, /clear).
 */
export declare const useSlashCommandProcessor: (config: Config | null, settings: LoadedSettings, history: HistoryItem[], addItem: UseHistoryManagerReturn["addItem"], clearItems: UseHistoryManagerReturn["clearItems"], loadHistory: UseHistoryManagerReturn["loadHistory"], refreshStatic: () => void, toggleVimEnabled: () => Promise<boolean>, isProcessing: boolean, setIsProcessing: (isProcessing: boolean) => void, isIdleRef: MutableRefObject<boolean>, setGeminiMdFileCount: (count: number) => void, actions: SlashCommandProcessorActions, extensionsUpdateState: Map<string, ExtensionUpdateStatus>, isConfigInitialized: boolean, logger: Logger | null, updateItem: UseHistoryManagerReturn["updateItem"], setSessionName?: (name: string | null) => void, extensionRefreshState?: ExtensionRefreshState) => {
    handleSlashCommand: (rawQuery: PartListUnion, oneTimeShellAllowlist?: Set<string>, overwriteConfirmed?: boolean, existingInvocationItemId?: number) => Promise<SlashCommandProcessorResult | false>;
    slashCommands: readonly SlashCommand[];
    recentSlashCommands: ReadonlyMap<string, RecentSlashCommand>;
    pendingHistoryItems: HistoryItemWithoutId[];
    btwItem: HistoryItemBtw | null;
    setBtwItem: import("react").Dispatch<import("react").SetStateAction<HistoryItemBtw | null>>;
    cancelBtw: () => void;
    cancelSlashCommand: () => void;
    commandContext: CommandContext;
    shellConfirmationRequest: {
        commands: string[];
        onConfirm: (outcome: ToolConfirmationOutcome, approvedCommands?: string[]) => void;
    } | null;
    confirmationRequest: {
        prompt: React.ReactNode;
        onConfirm: (confirmed: boolean) => void;
    } | null;
    reloadCommands: () => Promise<void>;
};
