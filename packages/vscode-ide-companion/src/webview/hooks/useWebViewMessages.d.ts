/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PermissionOption, PermissionToolCall } from '@qwen-code/webui';
import type { ToolCallUpdate, UsageStatsPayload } from '../../types/chatTypes.js';
import type { ApprovalModeValue } from '../../types/approvalModeValueTypes.js';
import type { PlanEntry } from '../../types/chatTypes.js';
import type { ModelInfo, AvailableCommand } from '@agentclientprotocol/sdk';
import type { Question } from '../../types/acpTypes.js';
import { type WebViewMessage } from './useImage.js';
interface UseWebViewMessagesProps {
    sessionManagement: {
        currentSessionId: string | null;
        setQwenSessions: (sessions: Array<Record<string, unknown>> | ((prev: Array<Record<string, unknown>>) => Array<Record<string, unknown>>)) => void;
        setCurrentSessionId: (id: string | null) => void;
        setCurrentSessionTitle: (title: string) => void;
        setShowSessionSelector: (show: boolean) => void;
        setNextCursor: (cursor: number | undefined) => void;
        setHasMore: (hasMore: boolean) => void;
        setIsLoading: (loading: boolean) => void;
        setIsSwitchingSession: (switching: boolean) => void;
    };
    fileContext: {
        setActiveFileName: (name: string | null) => void;
        setActiveFilePath: (path: string | null) => void;
        setActiveSelection: (selection: {
            startLine: number;
            endLine: number;
        } | null) => void;
        setWorkspaceFilesFromResponse: (files: Array<{
            id: string;
            label: string;
            description: string;
            path: string;
        }>, requestId?: number) => void;
        addFileReference: (name: string, path: string) => void;
    };
    messageHandling: {
        messages: WebViewMessage[];
        setMessages: (messages: WebViewMessage[] | ((prev: WebViewMessage[]) => WebViewMessage[])) => void;
        addMessage: (message: WebViewMessage) => void;
        clearMessages: () => void;
        startStreaming: (timestamp?: number) => void;
        appendStreamChunk: (chunk: string) => void;
        endStreaming: () => void;
        breakAssistantSegment: () => void;
        breakThinkingSegment: () => void;
        appendThinkingChunk: (chunk: string) => void;
        clearThinking: () => void;
        setWaitingForResponse: (message: string) => void;
        clearWaitingForResponse: () => void;
    };
    handleToolCallUpdate: (update: ToolCallUpdate) => void;
    clearToolCalls: () => void;
    rewindToolCallsToTimestamp?: (cutoffTimestamp: number) => void;
    setPlanEntries: (entries: PlanEntry[]) => void;
    handlePermissionRequest: (request: {
        options: PermissionOption[];
        toolCall: PermissionToolCall;
    } | null) => void;
    handleAskUserQuestion: (request: {
        questions: Question[];
        sessionId: string;
        metadata?: {
            source?: string;
        };
    } | null) => void;
    inputFieldRef: React.RefObject<HTMLDivElement | null>;
    setInputText: (text: string) => void;
    setEditMode?: (mode: ApprovalModeValue) => void;
    setIsAuthenticated?: (authenticated: boolean | null) => void;
    setUsageStats?: (stats: UsageStatsPayload | undefined) => void;
    setModelInfo?: (info: ModelInfo | null) => void;
    setAvailableCommands?: (commands: AvailableCommand[]) => void;
    setAvailableSkills?: (skills: string[]) => void;
    setAvailableModels?: (models: ModelInfo[]) => void;
    setAccountInfo?: (info: {
        authType?: string | null;
        baseUrl?: string | null;
        envKey?: string | null;
        modelId?: string | null;
        error?: string;
    } | null) => void;
    setInsightReportPath?: (path: string | null) => void;
    setInsightProgress?: (progress: {
        stage: string;
        progress: number;
        detail?: string;
    } | null) => void;
}
type ConversationResetHandlers = {
    messageHandling: Pick<UseWebViewMessagesProps['messageHandling'], 'clearMessages' | 'endStreaming' | 'clearWaitingForResponse' | 'clearThinking'>;
    clearToolCalls: UseWebViewMessagesProps['clearToolCalls'];
    clearActiveExecToolCalls: () => void;
    setPlanEntries: UseWebViewMessagesProps['setPlanEntries'];
    handlePermissionRequest: UseWebViewMessagesProps['handlePermissionRequest'];
    handleAskUserQuestion: UseWebViewMessagesProps['handleAskUserQuestion'];
    sessionManagement: Pick<UseWebViewMessagesProps['sessionManagement'], 'setCurrentSessionId' | 'setCurrentSessionTitle'>;
    resetUserTurnCounter?: () => void;
    setUsageStats?: UseWebViewMessagesProps['setUsageStats'];
};
export declare function resetConversationState({ handlers, clearImageResolutions, vscode, }: {
    handlers: ConversationResetHandlers;
    clearImageResolutions: () => void;
    vscode: {
        postMessage: (message: unknown) => void;
    };
}): void;
/**
 * WebView message handling Hook
 * Handles all messages from VSCode Extension uniformly
 */
export declare const useWebViewMessages: ({ sessionManagement, fileContext, messageHandling, handleToolCallUpdate, clearToolCalls, rewindToolCallsToTimestamp, setPlanEntries, handlePermissionRequest, handleAskUserQuestion, inputFieldRef, setInputText, setEditMode, setIsAuthenticated, setUsageStats, setModelInfo, setAvailableCommands, setAvailableSkills, setAvailableModels, setAccountInfo, setInsightReportPath, setInsightProgress, }: UseWebViewMessagesProps) => void;
export {};
