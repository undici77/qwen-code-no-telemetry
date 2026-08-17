/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
export interface JudgeResult {
  ok: boolean;
  reason: string;
  impossible?: boolean;
}
export type GoalJudgeOutcome =
  | {
      kind: 'met';
      ok: true;
      reason: string;
      impossible?: false;
    }
  | {
      kind: 'not_met';
      ok: false;
      reason: string;
      impossible?: false;
    }
  | {
      kind: 'impossible';
      ok: false;
      reason: string;
      impossible: true;
    }
  | {
      kind: 'error';
      ok: false;
      reason: string;
      impossible?: false;
      message: string;
    };
export declare const JUDGE_RESULT_SCHEMA_KEYS: readonly [
  'ok',
  'reason',
  'impossible',
  'evidence',
];
/**
 * Calls a small fast model (or the main model if no fast model is configured)
 * to evaluate whether the goal condition holds after the latest turn.
 *
 * Failures are returned separately from model verdicts so a flaky evaluator
 * cannot trigger another main-model turn.
 */
export declare function judgeGoal(
  config: Config,
  args: {
    condition: string;
    lastAssistantText: string;
    signal: AbortSignal;
  },
): Promise<GoalJudgeOutcome>;
