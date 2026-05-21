/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
export interface JudgeResult {
    ok: boolean;
    reason: string;
    /**
     * Whether the goal is genuinely impossible in this session.
     * Only meaningful when `ok` is false. If `ok` is true, this field is always
     * absent from the parsed verdict.
     */
    impossible?: boolean;
}
export declare const JUDGE_RESULT_SCHEMA_KEYS: readonly ["ok", "reason", "impossible"];
/**
 * Calls a small fast model (or the main model if no fast model is configured)
 * to evaluate whether the goal condition holds after the latest turn.
 *
 * Any failure — timeout, non-JSON response, missing fields, aborted signal —
 * is converted into `{ok:false, reason:<fallback>}` so the /goal loop can keep
 * running and the user retains control via `/goal clear`. We deliberately fail
 * "not met" so a flaky judge never short-circuits a real goal.
 */
export declare function judgeGoal(config: Config, args: {
    condition: string;
    lastAssistantText: string;
    signal: AbortSignal;
}): Promise<JudgeResult>;
