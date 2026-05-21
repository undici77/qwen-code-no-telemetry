/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { Config, ChatRecord } from '@qwen-code/qwen-code-core';
import type { AvailableCommand, PromptRequest, PromptResponse, RequestPermissionRequest, RequestPermissionResponse, SessionUpdate, SetSessionModeRequest, SetSessionModeResponse, SetSessionModelRequest, SetSessionModelResponse, AgentSideConnection } from '@agentclientprotocol/sdk';
import type { LoadedSettings } from '../../config/settings.js';
import type { SessionContext } from './types.js';
import { MessageRewriteMiddleware } from './rewrite/index.js';
export declare function computeInitialTurnFromHistory(records: ChatRecord[], sessionId: string): number;
export interface AvailableCommandsSnapshot {
    availableCommands: AvailableCommand[];
    availableSkills?: string[];
}
export declare function buildAvailableCommandsSnapshot(config: Config, abortSignal?: AbortSignal): Promise<AvailableCommandsSnapshot>;
/**
 * Session represents an active conversation session with the AI model.
 * It uses modular components for consistent event emission:
 * - HistoryReplayer for replaying past conversations
 * - ToolCallEmitter for tool-related session updates
 * - PlanEmitter for todo/plan updates
 * - SubAgentTracker for tracking sub-agent tool calls
 */
export declare class Session implements SessionContext {
    #private;
    readonly config: Config;
    private readonly client;
    private readonly settings;
    private pendingPrompt;
    /**
     * Tracks the completion of the current prompt so that the next prompt
     * can await it.  This prevents a new prompt from reading chat history
     * before the previous prompt's tool results have been added —
     * a race condition that causes malformed history on Windows where
     * process termination is slow.
     */
    private pendingPromptCompletion;
    private turn;
    private readonly runtimeBaseDir;
    private cronQueue;
    private cronProcessing;
    private cronAbortController;
    private cronCompletion;
    private cronDisabledByTokenLimit;
    private lastPromptTokenCount;
    private lastPromptTokenCountChat;
    private readonly historyReplayer;
    private readonly toolCallEmitter;
    private readonly planEmitter;
    private readonly messageEmitter;
    messageRewriter?: MessageRewriteMiddleware;
    /**
     * Phase C worktree restore notice. Set by acpAgent.loadSession when a
     * resumed session has a live worktree sidecar; prepended to the next
     * #executePrompt call as a <system-reminder>, then cleared.
     *
     * One-shot by design — after the first prompt the worktree path is
     * already in the conversation context (the reminder we just sent + any
     * subsequent tool calls), so re-injecting on every turn would clutter
     * the history without adding signal. TUI uses historyManager.addItem(INFO)
     * for the equivalent UX hint and headless prepends to the single shot
     * prompt; all three modes share the `restoreWorktreeContext` helper
     * that produces this string.
     */
    pendingWorktreeNotice: string | null;
    readonly sessionId: string;
    constructor(id: string, config: Config, client: AgentSideConnection, settings: LoadedSettings);
    getId(): string;
    getConfig(): Config;
    /**
     * Install the message rewrite middleware if configured.
     * Must be called AFTER history replay to avoid rewriting historical messages.
     */
    installRewriter(): void;
    /**
     * Replays conversation history to the client using modular components.
     * Delegates to HistoryReplayer for consistent event emission.
     */
    replayHistory(records: ChatRecord[]): Promise<void>;
    rewindToTurn(targetTurnIndex: number): {
        targetTurnIndex: number;
        apiTruncateIndex: number;
    };
    captureHistorySnapshot(): Content[];
    restoreHistory(history: Content[]): void;
    cancelPendingPrompt(): Promise<void>;
    prompt(params: PromptRequest): Promise<PromptResponse>;
    sendUpdate(update: SessionUpdate): Promise<void>;
    sendAvailableCommandsUpdate(): Promise<void>;
    /**
     * Requests permission from the client for a tool call.
     * Used by SubAgentTracker for sub-agent approval requests.
     */
    requestPermission(params: RequestPermissionRequest): Promise<RequestPermissionResponse>;
    /**
     * Sets the approval mode for the current session.
     * Maps ACP approval mode values to core ApprovalMode enum.
     */
    setMode(params: SetSessionModeRequest): Promise<SetSessionModeResponse | void>;
    /**
     * Sets the model for the current session.
     * Validates the model ID and switches the model via Config.
     */
    setModel(params: SetSessionModelRequest, options?: {
        persistDefault?: boolean;
    }): Promise<SetSessionModelResponse | void>;
    /**
     * Sends a current_mode_update notification to the client.
     * Called after the agent switches modes (e.g., from exit_plan_mode tool).
     */
    private sendCurrentModeUpdateNotification;
    /**
     * Execute a batch of model-returned tool calls, running Agent calls
     * concurrently while keeping other tools sequential.
     *
     * Mirrors the partition logic in `coreToolScheduler.partitionToolCalls`:
     * consecutive Agent calls form a parallel batch (they spawn independent
     * sub-agents with no shared mutable state); any other tool forms its own
     * sequential batch to preserve the implicit ordering the model may rely
     * on. Response-part ordering matches the original `functionCalls` order.
     */
    private runToolCalls;
    private runTool;
    debug(msg: string): void;
}
