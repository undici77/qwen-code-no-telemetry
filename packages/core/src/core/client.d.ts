/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, GenerateContentConfig, GenerateContentResponse, Part, PartListUnion } from '@google/genai';
import { type Config } from '../config/config.js';
import { type GoalTurnPermit } from '../goals/goal-protocol.js';
import { GeminiChat } from './geminiChat.js';
import { Turn, type ChatCompressionInfo, type ServerGeminiStreamEvent } from './turn.js';
import { LoopDetectionService } from '../services/loopDetectionService.js';
import { SessionStartSource } from '../hooks/types.js';
export declare enum SendMessageType {
    UserQuery = "userQuery",
    ToolResult = "toolResult",
    /** User input appended at a sampling boundary within the active turn. */
    Steer = "steer",
    Retry = "retry",
    Hook = "hook",
    /** Cron-fired prompt. Behaves like UserQuery but skips UserPromptSubmit hook. */
    Cron = "cron",
    /** Background agent notification. Display item is added by the drain loop. */
    Notification = "notification",
    /**
     * A message delivered to the leader from a teammate. Behaves like a
     * fresh top-level interaction (loop-detector reset + interaction span)
     * but is not a user prompt — it does not bump commit attribution or get
     * recorded as a user message.
     */
    Teammate = "teammate",
    /** Runtime-owned continuation for an active Goal. */
    Goal = "goal"
}
export interface SendMessageOptions {
    type: SendMessageType;
    /** User-submitted text captured before prompt expansion. */
    submittedPrompt?: string;
    /** Returns user input waiting to steer the active turn at a model boundary. */
    getSteerInput?: (signal: AbortSignal) => Promise<SteerInput | undefined>;
    /** Steer lease already appended to this request, settled after history push. */
    steerInput?: SteerInput;
    /** Track stop hook iterations to prevent infinite loops and display loop info */
    stopHookState?: {
        iterationCount: number;
        reasons: string[];
    };
    /** Display text for notification messages (persisted for session resume). */
    notificationDisplayText?: string;
    /** Todo work chain that owns this automatic turn, when it is related. */
    todoWorkChainId?: string;
    /** Model override from skill execution. When present, overrides the session model for this turn. */
    modelOverride?: string;
    /** Exact runtime permit authorizing this Goal-bound turn. */
    goalPermit?: GoalTurnPermit;
    /** Stable key used by the runtime to bind recursive segments to one permit. */
    goalTurnKey?: string;
    /** Permit-owned cancellation signal, combined with the caller signal. */
    goalSignal?: AbortSignal;
    /** Whether this permit belongs to runtime work or a real-user turn. */
    goalOrigin?: 'runtime' | 'user';
    /** Peeks a queued real-user key immediately before a Goal true Stop. */
    getQueuedGoalTurnKey?: () => string | undefined;
}
export interface SteerInput {
    parts: Part[];
    /** Commits UI/recording side effects after the request accepts the input. */
    accept: () => void;
    /** Restores the input when the next model request never accepts it. */
    restore: () => void;
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
    private shutdownRequested;
    private readonly settledSteerInputs;
    private readonly loopDetector;
    private lastPromptId;
    private activeTodoWorkChainPromptId;
    private readonly activeAutomaticTodoWorkChainPromptIds;
    private lastSentIdeContext;
    private forceFullIdeContext;
    private recentCompletedToolNames;
    private pendingMemoryPrefetch;
    private lastSessionStartContext;
    private lastSessionStartSource;
    private announcedDeferredToolNames;
    private announcedMcpToolNames;
    private pendingAddedMcpTools;
    private pendingRemovedMcpToolNames;
    private announcedSkillReminderKeys;
    private skillRemindersInitialized;
    private announcedAgentReminderNames;
    private agentRemindersInitialized;
    private static skillEntryKey;
    /**
     * Seeds skill-reminder dedup from the entries actually rendered into the
     * startup snapshot. Mirrors `rememberAnnouncedDeferredTools`: the dedup is
     * seeded from what the model actually SAW, not from whatever happens to be
     * current at the first drain (which may include late-registered MCP
     * prompts/commands the snapshot never listed).
     */
    private seedSkillReminderDedupFromSnapshot;
    private seedAgentReminderDedupFromCurrent;
    /**
     * Tracks the most recently injected date string to prevent injecting
     * duplicate or conflicting dates when a session spans midnight.
     * Only UserQuery turns inject dates; Cron/ToolResult turns reuse the
     * startup-context date which is still current within the same session.
     */
    private lastInjectedDate;
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
    /** Cleanup checkpoint for long-running Hook continuations such as /goal. */
    private lastHookMicrocompactionTimestamp;
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
    getHistoryForForkWindow(): Content[];
    getHistoryTail(count: number, curated?: boolean): Content[];
    private getHistoryTailShallow;
    private peekLastHistoryEntry;
    private getHistoryLength;
    private getLastModelMessageText;
    /**
     * Fire-and-forget StopFailure hook for loop-detection early returns.
     * Matches the detached pattern used by the CLI's API-error path
     * (useGeminiStream.ts) — output and errors are ignored.
     */
    private fireLoopDetectedStopFailure;
    /**
     * Walk-only accessor for the set of `functionResponse.id` strings in
     * raw history. Callers that only need the dedup id set (notably
     * `useGeminiStream.handleCompletedTools`) MUST prefer this over
     * {@link getHistory}, which deep-clones the entire conversation via
     * `structuredClone` on every call. On long sessions with sizable
     * tool outputs the clone is a multi-millisecond hit on the React UI
     * thread; running it on every tool-completion batch caused visible
     * frame drops during streaming. See
     * `GeminiChat.getHistoryFunctionResponseIds` for the implementation.
     */
    getHistoryFunctionResponseIds(): Set<string>;
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
    stripOrphanedUserEntriesFromHistory(): Content[];
    /**
     * Synthesize a `functionResponse` for every dangling `model[functionCall]`
     * in chat history whose corresponding tool_result never landed. Inverse of
     * {@link stripOrphanedUserEntriesFromHistory}, which only handles trailing
     * `user` entries.
     *
     * This `GeminiClient` method is the resume-path entry point — called once
     * from {@link startChat} after the transcript loads, covering `--resume`
     * of a session that crashed between a partial-tool_use push and the
     * tool's eventual completion.
     *
     * The other two coverage points (Retry submit path after
     * `stripOrphanedUserEntriesFromHistory`, and the defensive pass at the
     * start of every UserQuery / Cron send) live one layer down inside
     * `GeminiChat.sendMessageStream` and call the standalone
     * `repairOrphanedToolUseTurns(history)` function directly — they don't
     * route through this wrapper. Anyone tracing the repair-pass coupling
     * between the client and chat layers should follow that path
     * separately rather than expect everything to funnel through here.
     *
     * Synthesizes an `error` `functionResponse`. The React tool scheduler
     * (`useGeminiStream.handleCompletedTools`) MUST dedupe by `callId` against
     * the live history before submitting its own `tool_result` — otherwise a
     * late real result lands as a second `user[tool_result]` block (orphan
     * because the synthetic already consumed the matching `tool_use`).
     */
    repairOrphanedToolUseTurnsInHistory(reason?: string): {
        injected: Array<{
            callId: string;
            name: string;
        }>;
        droppedDuplicates: Array<{
            callId: string;
            name: string;
        }>;
    };
    setHistory(history: Content[]): void;
    truncateHistory(keepCount: number): void;
    setTools(options?: {
        skipHistoryReveal?: boolean;
    }): Promise<void>;
    /**
     * Signal that shutdown is imminent. Subsequent calls to background memory
     * tasks (extract, dream, skill review) will be skipped so the process can
     * exit cleanly without spawning new work.
     */
    requestShutdown(): void;
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
    private logMemoryPrefetchDelivery;
    private logMemoryPrefetchDiscard;
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
    addWorkingDirectoryChangedContext(oldDir: string, newDir: string): Promise<void>;
    private getCachedGitStatus;
    private getMainSessionSystemInstruction;
    refreshStartupContextReminder(): Promise<void>;
    /**
     * Re-prepend a fresh startup-context prelude after auto-compaction.
     *
     * Auto-compaction runs in-place inside `GeminiChat.sendMessageStream`
     * (`setHistory([summary, ack, ...kept])`) and does NOT route through
     * `tryCompressChat` → `startChat`, so — unlike manual `/compress` — the
     * startup prelude at history[0] is consumed into the summary and never
     * rebuilt. Without this, workspace/env context, deferred-tool metadata,
     * and MCP server instructions are lost for the rest of the session (before
     * this PR they lived in the system instruction and survived compaction).
     *
     * Unlike `refreshStartupContextReminder` (which replaces an existing
     * prelude and no-ops when absent), this prepends when absent. No-ops if a
     * prelude is already present so it can't double-prepend.
     */
    restoreStartupContextAfterCompaction(): Promise<void>;
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
     * Preloads (reveals) every deferred tool — bundled built-ins and MCP
     * alike — at session start when the combined estimated size of their
     * schemas fits within `tools.toolSearch.threshold` percent of the
     * context window. A small deferred set is cheaper to declare upfront
     * than to load on demand: with nothing left for ToolSearch to reveal,
     * the declaration list stays stable for the whole session and no
     * reveal ever invalidates the prompt-cache prefix.
     *
     * Deliberately NOT called from setTools(): revealing a tool the startup
     * reminder already announced would make queueAddedMcpToolsReminder flag
     * it as removed, and a mid-session declaration change busts the very
     * cache this preload exists to protect. Tools from servers that connect
     * later stay deferred until the next session start.
     */
    private preloadDeferredToolsWithinBudget;
    /**
     * Reveals deferred tools referenced by function calls in existing history.
     *
     * On resume this runs once before startup reminders are built. It also runs
     * from setTools() because progressive MCP discovery can register deferred
     * tools only after the resumed chat and its initial declarations exist.
     */
    private revealDeferredToolsReferencedInHistory;
    /**
     * Computes the deferred-tools list that should be announced through
     * user-role system reminders.
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
     * Returns `undefined` when ToolSearch is unavailable: reminders must not
     * advertise tools the model has no way to load on demand.
     */
    private resolveDeferredToolsForReminder;
    private rememberAnnouncedDeferredTools;
    private queueAddedMcpToolsReminder;
    private drainPendingAddedMcpToolsReminder;
    /**
     * Per-turn delta for skills/commands that became invocable after session start
     * — skills enabled mid-session (e.g. via `/skills`) and MCP prompts added after
     * startup. Emitted as a tail `<system-reminder>` only, so it never mutates the
     * cached tools/system/messages prefix. Deduped via `announcedSkillReminderKeys`.
     *
     * The first call after a (re)built startup prelude seeds the announced set from
     * the current skills and emits nothing — the startup snapshot already listed
     * them (mirrors Claude Code's `suppressNextSkillListing` and its decision not
     * to re-inject the listing after compaction). Conditional path-activations are
     * announced inline on the tool result by `coreToolScheduler`, so they are
     * recorded here as announced (not re-queued) to avoid a double announcement.
     */
    private drainSkillAndCommandReminders;
    private drainAgentReminders;
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
    private rememberCompletedToolName;
    private seedRecentCompletedToolNamesFromHistory;
    private microcompactHistoryBeforeSend;
    sendMessageStream(request: PartListUnion, callerSignal: AbortSignal, prompt_id: string, options?: SendMessageOptions, turns?: number): AsyncGenerator<ServerGeminiStreamEvent, Turn>;
    generateContent(contents: Content[], generationConfig: GenerateContentConfig, abortSignal: AbortSignal, model: string, promptIdOverride?: string): Promise<GenerateContentResponse>;
    /**
     * Wrapper around {@link GeminiChat.tryCompress} that restores main-session
     * startup context after successful compaction and flips the IDE full-context
     * flag for the next regular message.
     */
    tryCompressChat(prompt_id: string, force?: boolean, signal?: AbortSignal, customInstructions?: string): Promise<ChatCompressionInfo>;
    /**
     * Surgically disarm FileReadCache entries for files evicted by
     * microcompaction. Falls back to a blanket clear() only when a blanked read
     * cannot be linked to any path; path-level resolution failures are targeted
     * to that path so one ghost file does not wipe unrelated cache entries.
     *
     * Shared by pre-send microcompaction and /compress-fast.
     */
    private disarmFileReadCacheAfterEviction;
    /**
     * Fast, rule-based compression without any LLM side-query.
     * Delegates to {@link GeminiChat.compressFast} and handles post-compression
     * FileReadCache disarming.
     */
    tryCompressChatFast(): Promise<ChatCompressionInfo>;
}
