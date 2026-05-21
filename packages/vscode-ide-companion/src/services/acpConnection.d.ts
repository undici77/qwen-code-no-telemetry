/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ContentBlock, SessionNotification, RequestPermissionRequest, AuthenticateResponse, NewSessionResponse, LoadSessionResponse, ListSessionsResponse, PromptResponse, SetSessionModeResponse, SetSessionModelResponse } from '@agentclientprotocol/sdk';
import type { AuthenticateUpdateNotification, AskUserQuestionRequest, SlashCommandNotification } from '../types/acpTypes.js';
import type { ApprovalModeValue } from '../types/approvalModeValueTypes.js';
/**
 * ACP Connection Handler for VSCode Extension
 *
 * External API preserved for backward compatibility.
 * Internally uses SDK ClientSideConnection + ndJsonStream for protocol handling.
 */
export declare class AcpConnection {
    private child;
    private sdkConnection;
    private sessionId;
    private workingDir;
    private fileHandler;
    private lastExitCode;
    private lastExitSignal;
    onSessionUpdate: (data: SessionNotification) => void;
    onPermissionRequest: (data: RequestPermissionRequest) => Promise<{
        optionId: string;
    }>;
    onAuthenticateUpdate: (data: AuthenticateUpdateNotification) => void;
    onSlashCommandNotification: (data: SlashCommandNotification) => void;
    onEndTurn: (reason?: string) => void;
    /** Invoked when the child process exits (expected or unexpected). */
    onDisconnected: (code: number | null, signal: string | null) => void;
    onAskUserQuestion: (data: AskUserQuestionRequest) => Promise<{
        optionId: string;
        answers?: Record<string, string>;
    }>;
    onInitialized: (init: unknown) => void;
    connect(cliEntryPath: string, workingDir?: string, extraArgs?: string[]): Promise<void>;
    private setupChildProcessHandlers;
    private ensureConnection;
    private mapReadTextFileError;
    private resolvePermissionOptionId;
    authenticate(methodId?: string): Promise<AuthenticateResponse>;
    newSession(cwd?: string): Promise<NewSessionResponse>;
    sendPrompt(prompt: string | ContentBlock[]): Promise<PromptResponse>;
    rewindSession(targetTurnIndex: number): Promise<{
        historyBeforeRewind?: unknown[];
    }>;
    restoreSessionHistory(history: unknown[]): Promise<void>;
    loadSession(sessionId: string, cwdOverride?: string): Promise<LoadSessionResponse>;
    listSessions(options?: {
        cursor?: number;
        size?: number;
    }): Promise<ListSessionsResponse>;
    deleteSession(sessionId: string): Promise<{
        success: boolean;
    }>;
    renameSession(sessionId: string, title: string): Promise<{
        success: boolean;
    }>;
    switchSession(sessionId: string): Promise<void>;
    cancelSession(): Promise<void>;
    setMode(modeId: ApprovalModeValue): Promise<SetSessionModeResponse>;
    getAccountInfo(): Promise<{
        authType: string | null;
        model: string | null;
        baseUrl: string | null;
        apiKeyEnvKey: string | null;
    }>;
    setModel(modelId: string): Promise<SetSessionModelResponse>;
    disconnect(): void;
    get isConnected(): boolean;
    get hasActiveSession(): boolean;
    get currentSessionId(): string | null;
}
