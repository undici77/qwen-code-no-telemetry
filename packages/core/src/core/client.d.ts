/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, GenerateContentConfig, GenerateContentResponse, PartListUnion } from '@google/genai';
import { type Config } from '../config/config.js';
import { GeminiChat } from './geminiChat.js';
import { Turn, type ChatCompressionInfo, type ServerGeminiStreamEvent } from './turn.js';
import { LoopDetectionService } from '../services/loopDetectionService.js';
import { SessionStartSource } from '../hooks/types.js';
export declare enum SendMessageType {
    UserQuery = "userQuery",
    ToolResult = "toolResult",
    Retry = "retry",
    Hook = "hook",
    /** Cron-fired prompt. Behaves like UserQuery but skips UserPromptSubmit hook. */
    Cron = "cron",
    /** Background agent notification. Display item is added by the drain loop. */
    Notification = "notification"
}
export interface SendMessageOptions {
    type: SendMessageType;
    /** Track stop hook iterations to prevent infinite loops and display loop info */
    stopHookState?: {
        iterationCount: number;
        reasons: string[];
    };
    /** Display text for notification messages (persisted for session resume). */
    notificationDisplayText?: string;
    /** Model override from skill execution. When present, overrides the session model for this turn. */
    modelOverride?: string;
}
export declare class GeminiClient {
    private readonly config;
    private chat?;
    private initializedSessionId;
    private sessionTurnCount;
    private toolCallCount;
    private skillsModifiedInSession;
    private cachedGitStatus;
    private readonly surfacedRelevantAutoMemoryPaths;
    private readonly loopDetector;
    private lastPromptId;
    private lastSentIdeContext;
    private forceFullIdeContext;
    private pendingMemoryPrefetch;
    private lastSessionStartContext;
    private lastSessionStartSource;
    /**
     * Promises for pending background memory tasks (dream / extract).
     * Each promise resolves with a count of memory files touched (0 = nothing written).
     * Consumed by the CLI via `consumePendingMemoryTaskPromises()`.
     */
    private pendingMemoryTaskPromises;
    /**
     * Timestamp (epoch ms) of the last completed API call.
     * Used to detect idle periods for thinking block cleanup.
     * Starts as null — on the first query there is no prior thinking to clean,
     * so the idle check is skipped until the first API call completes.
     */
    private lastApiCompletionTimestamp;
    constructor(config: Config);
    initialize(sessionStartSource?: SessionStartSource): Promise<void>;
    /**
     * Restore attribution state from the last snapshot in a resumed session.
     */
    private restoreAttributionFromSession;
    addHistory(content: Content): Promise<void>;
    getChat(): GeminiChat;
    isInitialized(): boolean;
    getHistory(curated?: boolean): Content[];
    getHistoryShallow(curated?: boolean): Content[];
    getHistoryTail(count: number, curated?: boolean): Content[];
    private getHistoryTailShallow;
    private peekLastHistoryEntry;
    private getHistoryLength;
    private getLastModelMessageText;
    /**
     * Pop orphaned trailing user entries from the in-memory chat history.
     * Used by:
     *   - The Retry submit path (sendMessageStream below), which drops a
     *     prior failed attempt before re-sending.
     *   - The auto-restore-on-cancel flow in AppContainer, which rewinds
     *     a user prompt out of the UI transcript and the disk-backed
     *     ↑-history; this is the third place the cancelled prompt lives.
     *     Without calling this from auto-restore, the next request's wire
     *     payload would carry two consecutive user turns — the cancelled
     *     one and the new one — and the model would see context the user
     *     thought had been undone.
     */
    stripOrphanedUserEntriesFromHistory(): void;
    setHistory(history: Content[]): void;
    truncateHistory(keepCount: number): void;
    setTools(): Promise<void>;
    /**
     * Abort and release the pending auto-memory prefetch in one step.
     * Safe to call when no prefetch is pending — does nothing. Centralises
     * the abort-then-clear idiom so every cleanup path (resetChat, early
     * returns, finally) cannot half-fix one without the other.
     *
     * If the handle has already settled (recall completed but consume point
     * hadn't run yet), the settled result is discarded — logged at debug so
     * operators can diagnose missing-memory scenarios.
     */
    private cancelPendingMemoryPrefetch;
    /**
     * Atomically consume the pending prefetch if it has already settled.
     * Returns the recall result (caller decides where to inject it in
     * `requestToSend`), or `null` if there's nothing to consume yet.
     *
     * Centralises the consume-and-mark dance so the UserQuery and ToolResult
     * inject sites can't drift on the guard logic.
     */
    private tryConsumeMemoryPrefetch;
    resetChat(): Promise<void>;
    getLoopDetectionService(): LoopDetectionService;
    addDirectoryContext(): Promise<void>;
    private getCachedGitStatus;
    private getMainSessionSystemInstruction;
    /**
     * Rebuilds the main-session system instruction from the current
     * `userMemory` / model / prompt overrides and re-binds it to the live chat.
     *
     * Use this after mutating inputs that feed into the system instruction
     * (e.g. user memory refreshed from `output-language.md`) so the change
     * takes effect on the next turn without restarting the session. No-op if
     * no chat has been started yet.
     */
    refreshSystemInstruction(): Promise<void>;
    /**
     * Computes the deferred-tools list passed to the system prompt. Shared by
     * {@link startChat}, {@link setTools}, and {@link refreshSystemInstruction}
     * so all three render the same "Deferred Tools" section for a given
     * registry state.
     *
     * Caller MUST `await toolRegistry.warmAll()` first — this method only
     * inspects the registry's eager state and would otherwise miss factory-
     * backed deferred tools.
     *
     * Side effect: when ToolSearch is not registered (e.g. `--exclude-tools
     * tool_search` or a deny rule), every deferred tool is eagerly revealed
     * here so it lands in the declaration list. Skipping this would leave the
     * tool both off the declarations AND off the deferred-summary list (since
     * `undefined` is returned in that branch) — a silent disappearance that's
     * harder to diagnose than seeing the tool name absent from `/mcp` output.
     *
     * Returns `undefined` when ToolSearch is unavailable: the prompt's
     * deferred-tools section must not advertise tools the model has no way to
     * load on demand.
     */
    private resolveDeferredToolsForSystemPrompt;
    private toPermissionMode;
    private fireSessionStartHook;
    startChat(extraHistory?: Content[], sessionStartSource?: SessionStartSource): Promise<GeminiChat>;
    private getIdeContextParts;
    private runManagedAutoMemoryBackgroundTasks;
    /**
     * Returns and clears the list of pending background memory task promises.
     * Each promise resolves with the number of memory files touched (0 = nothing
     * was written, caller should ignore).
     */
    consumePendingMemoryTaskPromises(): Array<Promise<number>>;
    recordCompletedToolCall(toolName: string, args?: Record<string, unknown>): void;
    sendMessageStream(request: PartListUnion, signal: AbortSignal, prompt_id: string, options?: SendMessageOptions, turns?: number): AsyncGenerator<ServerGeminiStreamEvent, Turn>;
    generateContent(contents: Content[], generationConfig: GenerateContentConfig, abortSignal: AbortSignal, model: string, promptIdOverride?: string): Promise<GenerateContentResponse>;
    /**
     * Wrapper around {@link GeminiChat.tryCompress} that restores main-session
     * startup context after successful compaction and flips the IDE full-context
     * flag for the next regular message.
     */
    tryCompressChat(prompt_id: string, force?: boolean, signal?: AbortSignal): Promise<ChatCompressionInfo>;
}
export declare const TEST_ONLY: {
    COMPRESSION_PRESERVE_THRESHOLD: number;
    COMPRESSION_TOKEN_THRESHOLD: number;
};
