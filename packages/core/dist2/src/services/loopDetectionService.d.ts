/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ServerGeminiStreamEvent } from '../core/turn.js';
import { LoopType } from '../telemetry/types.js';
import type { Config } from '../config/config.js';
/**
 * Service for detecting and preventing infinite loops in AI responses.
 * Monitors tool call repetitions and content sentence repetitions.
 */
export declare class LoopDetectionService {
    private readonly config;
    private promptId;
    private lastToolCallKey;
    private toolCallRepetitionCount;
    private streamContentHistory;
    private contentStats;
    private lastContentIndex;
    private loopDetected;
    private inCodeBlock;
    private disabledForSession;
    private thoughtHistory;
    private recentToolCalls;
    private sameNameStreak;
    private lastSeenToolName;
    private hasSeenNonReadTool;
    private lastLoopType;
    constructor(config: Config);
    /**
     * Returns the LoopType of the most recent detection, or null if no loop
     * has been detected in the current prompt.
     */
    getLastLoopType(): LoopType | null;
    /**
     * Disables loop detection for the current session.
     */
    disableForSession(): void;
    private getToolCallKey;
    /**
     * Processes a stream event and checks for loop conditions.
     * @param event - The stream event to process
     * @returns true if a loop is detected, false otherwise
     */
    addAndCheck(event: ServerGeminiStreamEvent): boolean;
    private checkToolCallLoop;
    /**
     * Detects content loops by analyzing streaming text for repetitive patterns.
     *
     * The algorithm works by:
     * 1. Appending new content to the streaming history
     * 2. Truncating history if it exceeds the maximum length
     * 3. Analyzing content chunks for repetitive patterns using hashing
     * 4. Detecting loops when identical chunks appear frequently within a short distance
     * 5. Disabling loop detection within code blocks to prevent false positives,
     *    as repetitive code structures are common and not necessarily loops.
     */
    private checkContentLoop;
    /**
     * Truncates the content history to prevent unbounded memory growth.
     * When truncating, adjusts all stored indices to maintain their relative positions.
     */
    private truncateAndUpdate;
    /**
     * Analyzes content in fixed-size chunks to detect repetitive patterns.
     *
     * Uses a sliding window approach:
     * 1. Extract chunks of fixed size (CONTENT_CHUNK_SIZE)
     * 2. Hash each chunk for efficient comparison
     * 3. Track positions where identical chunks appear
     * 4. Detect loops when chunks repeat frequently within a short distance
     */
    private analyzeContentChunksForLoop;
    private hasMoreChunksToProcess;
    /**
     * Determines if a content chunk indicates a loop pattern.
     *
     * Loop detection logic:
     * 1. Check if we've seen this hash before (new chunks are stored for future comparison)
     * 2. Verify actual content matches to prevent hash collisions
     * 3. Track all positions where this chunk appears
     * 4. A loop is detected when the same chunk appears CONTENT_LOOP_THRESHOLD times
     *    within a small average distance (≤ 1.5 * chunk size)
     */
    private isLoopDetectedForChunk;
    /**
     * Verifies that two chunks with the same hash actually contain identical content.
     * This prevents false positives from hash collisions.
     */
    private isActualContentMatch;
    /**
     * Records a structured thought summary for repetition detection. Uses both
     * subject and description so two thoughts with the same subject but
     * diverging descriptions are correctly treated as distinct progress.
     */
    private trackThought;
    /**
     * Checks for repetitive thoughts pattern.
     *
     * Only fires when the last `THOUGHT_REPEAT_THRESHOLD` thoughts are the same
     * string. Earlier implementations counted repeats across the full retained
     * history, which caused false positives whenever the model revisited an
     * earlier phrase after making progress on an unrelated step.
     */
    private checkRepetitiveThoughts;
    private static readonly READ_LIKE_TOOL_NAMES;
    private static readonly READ_LIKE_NAME_PREFIXES;
    private isReadLikeTool;
    /**
     * Tracks tool calls for subsequent loop detection.
     */
    private trackToolCall;
    /**
     * Checks for excessive file read operations without meaningful progress.
     */
    private checkReadFileLoop;
    /**
     * Checks for action stagnation where the model performs different but equally unproductive actions.
     */
    private checkActionStagnation;
    /**
     * Resets all loop detection state.
     */
    reset(promptId: string): void;
    private resetToolCallCount;
    private resetContentTracking;
}
