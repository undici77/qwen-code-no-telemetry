/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * The runtime state of a `/goal` registered in a session. Lives only in memory:
 * the source of truth for restore-after-resume is the conversation history
 * `goal_status` attachments, not this store.
 */
export interface ActiveGoal {
  condition: string;
  iterations: number;
  deferredEvaluations?: number;
  setAt: number;
  tokensAtStart: number;
  lastReason?: string;
  hookId: string;
}
export declare function activeGoalEquals(
  left: ActiveGoal | undefined,
  right: ActiveGoal | undefined,
): boolean;
export declare function getActiveGoal(
  sessionId: string,
): ActiveGoal | undefined;
export declare function setActiveGoal(
  sessionId: string,
  goal: ActiveGoal,
): void;
export declare function clearActiveGoal(
  sessionId: string,
): ActiveGoal | undefined;
export declare function recordGoalIteration(
  sessionId: string,
  lastReason: string,
): ActiveGoal | undefined;
export declare function recordGoalDeferral(
  sessionId: string,
): ActiveGoal | undefined;
export declare function resetGoalDeferrals(
  sessionId: string,
): ActiveGoal | undefined;
/**
 * Test-only escape hatch — production code must scope by sessionId.
 */
export declare function __resetActiveGoalStoreForTests(): void;
/**
 * Terminal outcomes for an automatic `/goal` loop:
 * - `achieved`: the judge found transcript evidence that satisfies the goal.
 * - `aborted`: the loop stopped at a system safety limit.
 * - `failed`: the judge found the goal is genuinely impossible this session.
 */
export type GoalTerminalKind = 'achieved' | 'aborted' | 'failed';
export interface GoalTerminalEvent {
  kind: GoalTerminalKind;
  condition: string;
  iterations: number;
  durationMs: number;
  lastReason?: string;
  /** Free-form note used for `aborted` (e.g. "max iterations reached"). */
  systemMessage?: string;
}
export type GoalTerminalObserver = (event: GoalTerminalEvent) => void;
export declare function setGoalTerminalObserver(
  sessionId: string,
  observer: GoalTerminalObserver,
): void;
export declare function clearGoalTerminalObserver(sessionId: string): void;
export declare function notifyGoalTerminal(
  sessionId: string,
  event: GoalTerminalEvent,
): void;
export declare function getLastGoalTerminal(
  sessionId: string,
): GoalTerminalEvent | undefined;
/**
 * Used by session resume to repopulate the cache from persisted history when
 * an in-memory restart loses the cache but the transcript still has the
 * achievement record.
 */
export declare function setLastGoalTerminal(
  sessionId: string,
  event: GoalTerminalEvent | undefined,
): void;
