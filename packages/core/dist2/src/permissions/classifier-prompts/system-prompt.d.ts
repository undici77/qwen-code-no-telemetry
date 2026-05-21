/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Classifier system prompt template + builder.
 *
 * Built-in ALLOW / BLOCK / ENVIRONMENT lists are hardcoded here. User-configured
 * hints (`permissions.autoMode.hints.{allow,deny}`) and environment
 * (`permissions.autoMode.environment`) are appended additively to the
 * corresponding section. Replace-mode is not supported.
 *
 * Stage 1 and Stage 2 share the same base prompt; the orchestrator appends
 * a stage-specific suffix when calling the model.
 */
import type { Config } from '../../config/config.js';
/** Built-in actions the classifier should default to allowing. */
export declare const BUILTIN_ALLOW: readonly string[];
/** Built-in actions the classifier should default to blocking. */
export declare const BUILTIN_DENY: readonly string[];
/** Built-in environment / context lines. */
export declare const BUILTIN_ENVIRONMENT: readonly string[];
/**
 * Compose the base classifier system prompt.
 *
 * User-provided `autoMode.hints.allow / deny` and `autoMode.environment` are
 * appended after the built-in entries in their respective sections.
 *
 * Stage-specific suffix (see classifier orchestrator) is appended separately.
 */
export declare function buildClassifierSystemPrompt(config: Config): string;
/**
 * Per-entry character cap and per-section count cap on user-provided
 * hints / environment lines. Documented in `auto-mode.md` ("Each entry
 * is capped at 200 characters", "accept up to 50 entries each") —
 * enforce them here so a hostile or accidental large hint payload
 * cannot bloat the classifier system prompt and overflow the fast
 * model's context window.
 */
export declare const MAX_USER_HINT_LENGTH = 200;
export declare const MAX_USER_HINTS_PER_SECTION = 50;
/**
 * Stage-1 suffix appended after the transcript. Asks for a minimal yes/no
 * verdict so the model can return ~6 output tokens on the happy path.
 */
export declare const STAGE1_SUFFIX = "\nRespond with only { \"shouldBlock\": true | false }. No reasoning, no reason field. Err on the side of blocking \u2014 stage 2 will review uncertain blocks.";
/**
 * Stage-2 suffix appended after the transcript. Instructs the model to reduce
 * stage-1 false positives via chain-of-thought review.
 */
export declare const STAGE2_SUFFIX = "\nStage 1 flagged this as potentially unsafe. Review carefully \u2014 false positives hurt user experience. Use the thinking field to reason about it. If safe, set shouldBlock=false. If unsafe, set shouldBlock=true and provide one short sentence in reason.";
