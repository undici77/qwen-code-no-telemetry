/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ServerGeminiStreamEvent } from '../core/turn.js';
import { LoopType } from '../telemetry/types.js';
import type { Config } from '../config/config.js';
export declare const GLOBAL_DUPLICATE_THRESHOLD = 6;
export declare const DEFAULT_MAX_TOOL_CALLS_PER_TURN = 100;
/**
 * Stable identity of a (tool, args) call for repeat tracking: a sha256 over
 * the canonicalized name and args (legacy aliases resolved, sorted object
 * keys, preserved array order), so identical calls that differ only in
 * field order — or in a legacy alias such as `task` vs `agent` — hash to
 * the same key, and large payloads (e.g. write_file content) are retained
 * as a fixed-size digest rather than the raw JSON. Shared with the daemon's
 * turn-loop guard (ACP Session) so both runtimes key repeats the same way.
 */
export declare function getToolCallRepeatKey(
  toolName: string,
  args: unknown,
): string;
/**
 * Halt predicate of the per-turn tool-call cap, shared with the daemon's
 * turn-loop guard (ACP Session's recordDaemonToolCalls) so both runtimes
 * decide identically and cannot drift. `cap` is the resolved effective cap
 * from getMaxToolCallsPerTurn (Infinity when disabled); `maxKeyRepeat` is
 * the turn's running max count of any single (tool, args) repeat key.
 * Returns true when a turn that has emitted `totalCalls` calls must halt:
 * always past an explicit cap (the released hard-cap contract), and past
 * the adaptive default cap only on a stuck-repetition signal or at the
 * hard backstop (see checkTurnToolCallCap).
 */
export declare function shouldHaltOnTurnToolCallCap(
  totalCalls: number,
  maxKeyRepeat: number,
  cap: number,
  isExplicitCap: boolean,
): boolean;
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
  private lastShellInspectionKey;
  private shellInspectionStreak;
  private hasSeenNonReadTool;
  private globalToolCallCounts;
  private recentToolCallKeys;
  private turnToolCallTotal;
  private turnToolCallTotalCommitted;
  private capKeyCounts;
  private capMaxKeyRepeat;
  private lastLoopType;
  constructor(config: Config);
  /**
   * Returns the LoopType of the most recent detection, or null if no loop
   * has been detected in the current prompt.
   */
  getLastLoopType(): LoopType | null;
  getConsecutiveToolCallCount(): number;
  /**
   * Disables loop detection for the current session.
   */
  disableForSession(): void;
  private getToolCallKey;
  /**
   * Convenience aggregate that runs every tier in order: the always-on
   * safeties (consecutive-identical guard, shell inspection-command
   * stagnation guard, and per-turn cap) followed by the opt-in heuristics.
   * Intended as a single "check everything" entry point for unit tests.
   * Production code (client.ts) intentionally calls the tiers separately so
   * the `skipLoopDetection` gate can sit between them — a new guard added here
   * will NOT take effect in production unless it is also wired into
   * checkAlwaysOnSafeties or addAndCheckHeuristicLoops.
   * @param event - The stream event to process
   * @returns true if any tier detects a loop, false otherwise
   */
  addAndCheck(event: ServerGeminiStreamEvent): boolean;
  addAndCheckHeuristicLoops(event: ServerGeminiStreamEvent): boolean;
  /**
   * Always-on safety checks that fire regardless of the `skipLoopDetection`
   * config default. Enforces three guards: the consecutive-identical tool-call
   * loop, the shell inspection-command stagnation loop, and the per-turn
   * tool-call cap. Call this before the gated heuristic checks so none of the
   * guards can be bypassed by `skipLoopDetection`. All three honor an
   * explicit in-session disable; the cap is additionally tunable via the
   * `model.maxToolCallsPerTurn` setting.
   */
  checkAlwaysOnSafeties(event: ServerGeminiStreamEvent): boolean;
  private checkToolCallLoop;
  private checkShellCommandStagnation;
  private getShellInspectionKey;
  private isGitOverviewInspectionCommand;
  private isOverviewGitDiff;
  private isGitRevisionToken;
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
   * Records a (tool,args) occurrence for the adaptive cap and updates the
   * running max repeat count. Always-on (called from checkAlwaysOnSafeties
   * with the already-hashed key).
   */
  private trackCapKeyRepeat;
  /**
   * Per-turn cap. `getMaxToolCallsPerTurn()` is the configured value (already
   * resolved, Infinity when disabled). Independent of skipLoopDetection.
   *
   * Two behaviors depending on whether the value was explicitly configured:
   * - Explicit value: a hard cap (the released contract) — the turn halts on
   *   the call that exceeds it, with no adaptive extension.
   * - Default (unset): adaptive — once the turn exceeds the soft cap it halts
   *   only on a stuck-repetition signal (some (tool,args) call repeated
   *   GLOBAL_DUPLICATE_THRESHOLD times); a productive turn (diverse calls)
   *   continues up to the hard backstop (soft * ADAPTIVE_CAP_HARD_MULTIPLIER),
   *   which always halts to bound an argument-varying runaway.
   */
  private checkTurnToolCallCap;
  /**
   * Non-consecutive global duplicate detection: the SAME (tool, args) pair
   * need not appear consecutively — if it appears GLOBAL_DUPLICATE_THRESHOLD
   * times anywhere in the turn, it is treated as a loop. This catches models
   * that intersperse the stuck call among other actions.
   */
  private checkGlobalDuplicate;
  /**
   * Alternating-pattern detection: catches ABABAB… patterns where the model
   * flips between two distinct tool calls. Tracked via a sliding window of
   * tool-call keys; when the window fills with alternating A/B values the
   * turn is halted.
   */
  private checkAlternatingPattern;
  /**
   * Resets all loop detection state.
   */
  reset(promptId: string): void;
  private resetToolCallCount;
  private resetContentTracking;
}
