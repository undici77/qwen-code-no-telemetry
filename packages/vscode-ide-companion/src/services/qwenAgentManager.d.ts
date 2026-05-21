import type { ModelInfo, AvailableCommand, ContentBlock, RequestPermissionRequest } from '@agentclientprotocol/sdk';
import type { AskUserQuestionRequest, SlashCommandNotification } from '../types/acpTypes.js';
import type { ApprovalModeValue } from '../types/approvalModeValueTypes.js';
import type { ChatMessage, PlanEntry, ToolCallUpdateData, UsageStatsPayload } from '../types/chatTypes.js';
import { type QwenConnectionResult } from '../services/qwenConnectionHandler.js';
export type { ChatMessage, PlanEntry, ToolCallUpdateData };
/**
 * Extract session list items from ACP response.
 * Handles both 'sessions' (new) and 'items' (legacy) response shapes.
 * @param response - The ACP session/list response
 * @returns Array of session items, or empty array if invalid
 */
export declare function extractSessionListItems(response: unknown): Array<Record<string, unknown>>;
/**
 * Qwen Agent Manager
 *
 * Coordinates various modules and provides unified interface
 */
interface AgentConnectOptions {
    autoAuthenticate?: boolean;
}
interface AgentSessionOptions {
    autoAuthenticate?: boolean;
    forceNew?: boolean;
}
export declare class QwenAgentManager {
    private connection;
    private sessionReader;
    private sessionManager;
    private connectionHandler;
    private sessionUpdateHandler;
    private currentWorkingDir;
    private rehydratingSessionId;
    private sessionCreateInFlight;
    private callbacks;
    private baselineModeId;
    private baselineAvailableModes;
    private baselineModelInfo;
    private baselineAvailableModels;
    constructor();
    /**
     * Connect to Qwen service
     *
     * @param workingDir - Working directory
     * @param cliEntryPath - Path to bundled CLI entrypoint (cli.js)
     */
    connect(workingDir: string, cliEntryPath: string, options?: AgentConnectOptions): Promise<QwenConnectionResult>;
    /**
     * Reconnect after unexpected disconnect.
     * Re-spawns the ACP process and creates a new session.
     */
    reconnect(cliEntryPath: string, options?: AgentConnectOptions): Promise<QwenConnectionResult>;
    /**
     * Send message
     *
     * @param message - Message content
     */
    sendMessage(message: string | ContentBlock[]): Promise<void>;
    rewindSession(targetTurnIndex: number): Promise<{
        historyBeforeRewind?: unknown[];
    }>;
    restoreSessionHistory(history: unknown[]): Promise<void>;
    /**
     * Set approval mode from UI
     */
    setApprovalModeFromUi(mode: ApprovalModeValue): Promise<ApprovalModeValue>;
    /**
     * Set model from UI
     */
    setModelFromUi(modelId: string): Promise<ModelInfo | null>;
    getAccountInfo(): Promise<{
        authType: string | null;
        model: string | null;
        baseUrl: string | null;
        apiKeyEnvKey: string | null;
    }>;
    /**
     * Validate if current session is still active
     * This is a lightweight check to verify session validity
     *
     * @returns True if session is valid, false otherwise
     */
    validateCurrentSession(): Promise<boolean>;
    /**
     * Get session list with version-aware strategy
     * First tries ACP method if CLI version supports it, falls back to file system method
     *
     * @returns Session list
     */
    getSessionList(): Promise<Array<Record<string, unknown>>>;
    /**
     * Get session list (paged)
     * Uses ACP session/list with cursor-based pagination when available.
     * Falls back to file system scan with equivalent pagination semantics.
     */
    getSessionListPaged(params?: {
        cursor?: number;
        size?: number;
    }): Promise<{
        sessions: Array<Record<string, unknown>>;
        nextCursor?: number;
        hasMore: boolean;
    }>;
    /**
     * Get session messages (read from disk)
     *
     * @param sessionId - Session ID
     * @returns Message list
     */
    getSessionMessages(sessionId: string): Promise<ChatMessage[]>;
    /**
     * Delete a session by ID via ACP.
     */
    deleteSession(sessionId: string): Promise<boolean>;
    /**
     * Rename a session via ACP.
     */
    renameSession(sessionId: string, title: string): Promise<boolean>;
    private readJsonlMessages;
    private extractToolCallContent;
    private formatValue;
    private contentToText;
    /**
     * Try to load session via ACP session/load method
     * This method will only be used if CLI version supports it
     *
     * @param sessionId - Session ID
     * @returns Load response or error
     */
    loadSessionViaAcp(sessionId: string, cwdOverride?: string): Promise<unknown>;
    /**
     * Load session with version-aware strategy
     * First tries ACP method if CLI version supports it, falls back to file system method
     *
     * @param sessionId - Session ID to load
     * @returns Loaded session messages or null
     */
    loadSession(sessionId: string): Promise<ChatMessage[] | null>;
    /**
     * Load session messages from file system
     *
     * @param sessionId - Session ID to load
     * @returns Loaded session messages
     */
    private loadSessionMessagesFromFile;
    /**
     * Create new session
     *
     * Note: Authentication should be done in connect() method, only create session here
     *
     * @param workingDir - Working directory
     * @returns Newly created session ID
     */
    createNewSession(workingDir: string, options?: AgentSessionOptions): Promise<string | null>;
    /**
     * Switch to specified session
     *
     * @param sessionId - Session ID
     */
    switchToSession(sessionId: string): Promise<void>;
    /**
     * Cancel current prompt
     */
    cancelCurrentPrompt(): Promise<void>;
    /**
     * Register message callback
     *
     * @param callback - Message callback function
     */
    onMessage(callback: (message: ChatMessage) => void): void;
    /**
     * Register stream chunk callback
     *
     * @param callback - Stream chunk callback function
     */
    onStreamChunk(callback: (chunk: string) => void): void;
    /**
     * Register thought chunk callback
     *
     * @param callback - Thought chunk callback function
     */
    onThoughtChunk(callback: (chunk: string) => void): void;
    /**
     * Register tool call callback
     *
     * @param callback - Tool call callback function
     */
    onToolCall(callback: (update: ToolCallUpdateData) => void): void;
    /**
     * Register plan callback
     *
     * @param callback - Plan callback function
     */
    onPlan(callback: (entries: PlanEntry[]) => void): void;
    /**
     * Register permission request callback
     *
     * @param callback - Permission request callback function
     */
    onPermissionRequest(callback: (request: RequestPermissionRequest) => Promise<string>): void;
    /**
     * Register ask user question callback
     *
     * @param callback - Ask user question callback function
     */
    onAskUserQuestion(callback: (request: AskUserQuestionRequest) => Promise<{
        optionId: string;
        answers?: Record<string, string>;
    }>): void;
    /**
     * Register end-of-turn callback
     *
     * @param callback - Called when ACP stopReason is reported
     */
    onEndTurn(callback: (reason?: string) => void): void;
    /**
     * Register initialize mode info callback
     */
    onModeInfo(callback: (info: {
        currentModeId?: 'plan' | 'default' | 'auto-edit' | 'auto' | 'yolo';
        availableModes?: Array<{
            id: 'plan' | 'default' | 'auto-edit' | 'auto' | 'yolo';
            name: string;
            description: string;
        }>;
    }) => void): void;
    /**
     * Register mode changed callback
     */
    onModeChanged(callback: (modeId: 'plan' | 'default' | 'auto-edit' | 'auto' | 'yolo') => void): void;
    /**
     * Register callback for usage metadata updates
     */
    onUsageUpdate(callback: (stats: UsageStatsPayload) => void): void;
    /**
     * Register callback for model info updates
     */
    onModelInfo(callback: (info: ModelInfo) => void): void;
    /**
     * Register callback for model changed updates.
     */
    onModelChanged(callback: (model: ModelInfo) => void): void;
    /**
     * Register callback for available commands updates (from ACP available_commands_update)
     */
    onAvailableCommands(callback: (commands: AvailableCommand[]) => void): void;
    /**
     * Register callback for available skills updates (from ACP available_skills_update)
     */
    onAvailableSkills(callback: (skills: string[]) => void): void;
    /**
     * Register callback for available models updates (from session/new response)
     */
    onAvailableModels(callback: (models: ModelInfo[]) => void): void;
    onSlashCommandNotification(callback: (event: SlashCommandNotification) => void): void;
    /**
     * Register callback for unexpected process disconnection
     */
    onDisconnected(callback: (code: number | null, signal: string | null) => void): void;
    /**
     * Disconnect
     */
    disconnect(): void;
    /**
     * Check if connected
     */
    get isConnected(): boolean;
    /**
     * Get current session ID
     */
    get currentSessionId(): string | null;
    private applySessionStateFromResult;
    private restoreBaselineSessionStateAfterLoad;
    private resolvePermissionOptionId;
}
