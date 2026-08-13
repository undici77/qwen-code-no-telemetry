/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
/**
 * Maximum number of auto-title generation attempts per session. See
 * {@link ChatRecordingService.autoTitleAttempts} for the rationale behind
 * retrying across turns.
 */
export declare const AUTO_TITLE_ATTEMPT_CAP = 3;
/**
 * Users who don't want the fast model silently generating titles can opt
 * out at runtime: `QWEN_DISABLE_AUTO_TITLE=1` (or any truthy-ish value)
 * makes {@link ChatRecordingService.maybeTriggerAutoTitle} a no-op without
 * touching the rest of the feature (so `/rename --auto` still works on
 * explicit user request). Read per-call rather than cached so tests can
 * flip the var between cases without reloading the module; the cost of
 * one env lookup per assistant turn is irrelevant next to an LLM call.
 */
export declare function autoTitleDisabledByEnv(): boolean;
/**
 * Reason a title generation didn't produce a usable title. Separated from
 * the success payload so callers (esp. the interactive `/rename --auto`
 * command) can surface actionable messages instead of a generic "could not
 * generate".
 *
 * - `no_fast_model`: config.getFastModel() returned undefined.
 *   User needs to configure one via `/model --fast <name>`.
 * - `no_client`: BaseLlmClient or GeminiClient not yet initialized. Rare,
 *   usually means the session hasn't authenticated yet.
 * - `empty_history`: the conversation has fewer than 2 turns of usable text.
 *   User should send at least one message before asking for a title.
 * - `empty_result`: the model returned nothing parseable into a title. Often
 *   means the model is too small or the conversation text is meaningless
 *   (e.g., only tool calls).
 * - `aborted`: AbortSignal fired (user pressed Ctrl-C / new session / switch).
 * - `model_error`: the LLM call threw — rate limit, auth, network, etc.
 */
export type SessionTitleFailureReason = 'no_fast_model' | 'no_client' | 'empty_history' | 'empty_result' | 'aborted' | 'model_error';
export type SessionTitleOutcome = {
    ok: true;
    title: string;
    modelUsed: string;
} | {
    ok: false;
    reason: SessionTitleFailureReason;
};
/**
 * Generate a short (3-7 word, sentence-case) title for the current session
 * using the configured fast model. Best-effort — never throws.
 *
 * Returns a discriminated result so callers can either handle failures
 * generically (`if (!outcome.ok) return null`) or map failure reasons to
 * actionable messages (as `/rename --auto` does).
 */
export declare function tryGenerateSessionTitle(config: Config, abortSignal: AbortSignal, userDisplayTexts?: ReadonlyArray<string | undefined>): Promise<SessionTitleOutcome>;
/**
 * Normalize a raw title string coming back from the schema-enforced JSON
 * call. The schema guarantees a string, but models routinely ignore the
 * "no markdown / no trailing punctuation" guidance, so we strip those
 * post-hoc. Exported for unit tests. Returns '' if nothing recoverable.
 */
export declare function sanitizeTitle(s: string): string;
