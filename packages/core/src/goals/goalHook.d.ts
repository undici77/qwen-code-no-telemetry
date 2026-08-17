/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { type FunctionHookCallback, type HookOutput } from '../hooks/types.js';
import { type ActiveGoal } from './activeGoalStore.js';
/**
 * Maximum number of /goal continuation iterations before we force-clear the
 * goal. This guards against pathological cases where the judge keeps saying
 * "not met" but the assistant cannot make progress, which would otherwise burn
 * tokens silently. The user can re-set the goal manually if they need more.
 */
export declare const MAX_GOAL_ITERATIONS = 50;
/** Default budget (seconds) for a single goal-judge LLM call. */
export declare const GOAL_JUDGE_TIMEOUT_MS = 25000;
export declare const GOAL_HOOK_TIMEOUT_SECONDS = 30;
export declare const GOAL_HOOK_TIMEOUT_MS: number;
export declare const GOAL_HOOK_ID_OUTPUT_KEY = 'qwenGoalHookId';
export declare function getStopHookContinuationReason(
  output: Pick<HookOutput, 'stopReason' | 'reason' | 'hookSpecificOutput'>,
): string;
export declare function abortGoalForStopHookCap(
  config: Config,
  sessionId: string,
  systemMessage: string,
): boolean;
/**
 * Builds the Function hook callback that, on every Stop event, asks a fast
 * model whether the goal condition holds.
 *
 * Returning `{continue: true}` lets the turn end normally. Returning
 * `{continue: false, stopReason}` causes `client.ts` to feed `stopReason` back
 * as the next user prompt, looping the agent toward the goal.
 */
export declare function createGoalStopHookCallback(args: {
  config: Config;
  sessionId: string;
  condition: string;
  getExpectedHookId?: () => string | undefined;
}): FunctionHookCallback;
/**
 * Removes any existing /goal hook for the session (idempotent) and the
 * accompanying store entry. Returns the cleared goal, if there was one.
 *
 * Safe to call when no goal is set.
 */
export declare function unregisterGoalHook(
  config: Config,
  sessionId: string,
): ActiveGoal | undefined;
/**
 * Registers (or replaces) the /goal Stop hook for this session, primes the
 * activeGoal store, and returns the freshly stored goal. Throws when the
 * hook system is not available — callers gate on `Config.getHookSystem()`
 * before invoking.
 */
export declare function registerGoalHook(args: {
  config: Config;
  sessionId: string;
  condition: string;
  tokensAtStart: number;
  /**
   * Iteration count to resume from. Used on session resume so the
   * MAX_GOAL_ITERATIONS safety cap survives a reload instead of resetting to
   * zero (which would let an unreachable goal auto-loop another full budget
   * every resume). Defaults to 0 for a freshly set goal.
   */
  initialIterations?: number;
  /**
   * Wall-clock start of the goal, carried across resume so elapsed time keeps
   * measuring from the original `/goal` rather than from the reload. A
   * transcript is a file, so a non-finite or non-positive value is ignored
   * rather than trusted. Defaults to now for a freshly set goal.
   */
  initialSetAt?: number;
}): ActiveGoal;
