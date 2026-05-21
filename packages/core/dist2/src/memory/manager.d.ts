/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { Config } from '../config/config.js';
import { runAutoMemoryExtract } from './extract.js';
import { type AutoMemoryForgetMatch, type AutoMemoryForgetResult, type AutoMemoryForgetSelectionResult } from './forget.js';
import { type RelevantAutoMemoryPromptResult, type ResolveRelevantAutoMemoryPromptOptions } from './recall.js';
export type { AutoMemoryForgetResult, AutoMemoryForgetMatch, AutoMemoryForgetSelectionResult, };
export type { RelevantAutoMemoryPromptResult, ResolveRelevantAutoMemoryPromptOptions, };
export type { ManagedAutoMemoryStatus } from './status.js';
export type MemoryTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'skipped';
export interface MemoryTaskRecord {
    id: string;
    taskType: 'extract' | 'dream' | 'skill-review';
    projectRoot: string;
    sessionId?: string;
    status: MemoryTaskStatus;
    createdAt: string;
    updatedAt: string;
    progressText?: string;
    error?: string;
    metadata?: Record<string, unknown>;
}
export interface ScheduleExtractParams {
    projectRoot: string;
    sessionId: string;
    history: Content[];
    now?: Date;
    config?: Config;
}
export interface ScheduleSkillReviewParams {
    projectRoot: string;
    sessionId: string;
    history: Content[];
    toolCallCount: number;
    skillsModified: boolean;
    now?: Date;
    config?: Config;
    enabled?: boolean;
    threshold?: number;
    maxTurns?: number;
    timeoutMs?: number;
}
export interface SkillReviewScheduleResult {
    status: 'scheduled' | 'skipped';
    taskId?: string;
    skippedReason?: 'below_threshold' | 'skills_modified_in_session' | 'disabled' | 'already_running';
    promise?: Promise<MemoryTaskRecord>;
}
export type { AutoMemoryExtractResult as ExtractResult } from './extract.js';
export interface ScheduleDreamParams {
    projectRoot: string;
    sessionId: string;
    config?: Config;
    now?: Date;
    minHoursBetweenDreams?: number;
    minSessionsBetweenDreams?: number;
}
export interface DreamScheduleResult {
    status: 'scheduled' | 'skipped';
    taskId?: string;
    skippedReason?: 'disabled' | 'same_session' | 'min_hours' | 'min_sessions' | 'scan_throttled' | 'locked' | 'running';
    promise?: Promise<MemoryTaskRecord>;
}
/** Function type for scanning session files by mtime. Injected for testing. */
export type SessionScannerFn = (projectRoot: string, sinceMs: number, excludeSessionId: string) => Promise<string[]>;
export interface DrainOptions {
    timeoutMs?: number;
}
export declare const EXTRACT_TASK_TYPE: "managed-auto-memory-extraction";
export declare const DREAM_TASK_TYPE: "managed-auto-memory-dream";
export declare const SKILL_REVIEW_TASK_TYPE: "managed-skill-extractor";
export declare const AUTO_SKILL_THRESHOLD = 20;
export declare const DEFAULT_AUTO_DREAM_MIN_HOURS = 24;
export declare const DEFAULT_AUTO_DREAM_MIN_SESSIONS = 5;
/**
 * MemoryManager owns all runtime state for the memory subsystem and exposes a
 * clean, stable API. It is created once per Config instance and returned by
 * `config.getMemoryManager()`. Tests pass a fresh `new MemoryManager()`.
 */
export declare class MemoryManager {
    private readonly tasks;
    private readonly subscribers;
    private readonly subscribersByType;
    private readonly inFlight;
    private readonly extractRunning;
    private readonly extractCurrentTaskId;
    private readonly extractQueued;
    private readonly skillReviewInFlightByProject;
    private readonly dreamInFlightByKey;
    private readonly dreamLastSessionScanAt;
    private readonly dreamAbortControllers;
    private dreamLockReleaseFailed;
    private readonly sessionScanner;
    constructor(sessionScanner?: SessionScannerFn);
    /**
     * Register a listener that is called whenever any task record changes.
     * Compatible with React’s `useSyncExternalStore`.
     * Returns an unsubscribe function.
     *
     * Pass `{ taskType: 'dream' }` (or `'extract'`) to receive only
     * notifies whose changed record matches that type. Filtered
     * subscribers skip the wakeup entirely for unrelated transitions —
     * the dream-only UI hook uses this to avoid doing O(n) signature
     * work on every per-UserQuery extract notify.
     */
    subscribe(listener: () => void, opts?: {
        taskType?: 'extract' | 'dream';
    }): () => void;
    /**
     * Notify subscribers. Pass the changed task's type so type-filtered
     * subscribers can be reached too; the unfiltered subscriber set
     * always receives the wakeup either way.
     */
    private notify;
    /** Update a record and notify subscribers. */
    private update;
    /**
     * Register a brand-new record in the task map and notify once.
     * Use this for records that start in 'pending' and need no immediate patch.
     */
    private store;
    /**
     * Register a brand-new record AND apply an initial status patch in a single
     * notify. Avoids the double-render that separate store()+update() causes.
     */
    private storeWith;
    /** Return task records filtered by type and optionally by projectRoot. */
    listTasksByType(taskType: MemoryTaskRecord['taskType'], projectRoot?: string): MemoryTaskRecord[];
    /** Wait for all in-flight tasks to settle, with optional timeout. */
    drain(options?: DrainOptions): Promise<boolean>;
    private track;
    /**
     * Schedule a managed auto-memory extraction for the given session turn.
     *
     * Returns immediately with a skipped result if:
     *   - The last history turn wrote to a memory file (memory_tool)
     *   - Extraction is already running for this project (queues trailing request)
     *
     * The trailing request starts automatically when the active extraction
     * completes.
     */
    scheduleExtract(params: ScheduleExtractParams): Promise<ReturnType<typeof runAutoMemoryExtract> extends Promise<infer T> ? T : never>;
    private runExtract;
    private startQueuedExtract;
    scheduleSkillReview(params: ScheduleSkillReviewParams): SkillReviewScheduleResult;
    private runSkillReview;
    /**
     * Maybe schedule a managed auto-memory dream (consolidation).
     * Returns immediately if preconditions aren't met (time gate, session count,
     * lock, or duplicate).
     */
    scheduleDream(params: ScheduleDreamParams): Promise<DreamScheduleResult>;
    /**
     * Look up a single task record by id. Used by `task_stop` and other
     * cross-cutting consumers that have a task id but no project root.
     */
    getTask(taskId: string): MemoryTaskRecord | undefined;
    /**
     * Cancel a running dream task. Aborts the dream's fork agent (the
     * abort signal threads through `runForkedAgent`), marks the record
     * cancelled immediately so the UI reflects user intent, and lets the
     * existing `runDream` finally block release the consolidation lock
     * via the natural error propagation path.
     *
     * Returns true if a running task was aborted, false if the task is
     * unknown / already terminal / not a dream. Currently only dream
     * tasks support cancellation — extract is short-lived and runs
     * synchronously through the request loop; cancelling it would
     * interfere with the user's own turn.
     */
    cancelTask(taskId: string): boolean;
    private runDream;
    /** Select and format relevant memory for the given query. */
    recall(projectRoot: string, query: string, options?: ResolveRelevantAutoMemoryPromptOptions): Promise<RelevantAutoMemoryPromptResult>;
    /** Select candidate memory entries matching the given query (step 1 of forget). */
    selectForgetCandidates(projectRoot: string, query: string, options?: {
        config?: Config;
        limit?: number;
    }): Promise<AutoMemoryForgetSelectionResult>;
    /** Remove the selected memory entries (step 2 of forget). */
    forgetMatches(projectRoot: string, matches: AutoMemoryForgetMatch[], now?: Date): Promise<AutoMemoryForgetResult>;
    /** Convenience: select + remove in a single call. */
    forget(projectRoot: string, query: string, options?: {
        config?: Config;
    }, now?: Date): Promise<AutoMemoryForgetResult>;
    /** Return a full status snapshot for the given project's memory. */
    getStatus(projectRoot: string): Promise<import("./status.js").ManagedAutoMemoryStatus>;
    /** Append the managed auto-memory section to a user memory string. */
    appendToUserMemory(userMemory: string, memoryDir: string, indexContent?: string | null): string;
    /**
     * Record that a manual dream run has completed for the given session.
     * Call this from the dreamCommand's onComplete callback.
     */
    writeDreamManualRun(projectRoot: string, sessionId: string, now?: Date): Promise<void>;
    /**
     * Build the consolidation task prompt used by the dream slash command.
     * Returns a prompt string describing what the agent should do.
     */
    buildConsolidationPrompt(memoryRoot: string, transcriptDir: string): string;
    /** Reset all extract scheduling state. Call from afterEach in tests. */
    resetExtractStateForTests(): void;
    /** Reset all dream scheduling state. */
    resetDreamStateForTests(): void;
}
/**
 * Application-wide singleton. In a fully wired application Config creates its
 * own MemoryManager accessible via `config.getMemoryManager()`.
 */
export declare const globalMemoryManager: MemoryManager;
