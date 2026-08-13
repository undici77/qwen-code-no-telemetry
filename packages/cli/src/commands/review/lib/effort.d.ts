/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ReviewEffort } from '../parse-args.js';
/**
 * The effort to record in a capture command's plan. An explicit `--effort` wins;
 * otherwise fall back to the level `parse-args` resolved (read from
 * `PARSE_ARGS_REPORT`, relative to the same CWD the skill tee'd it in). `undefined`
 * when neither is available — the roster then fail-safes to the full set, exactly as
 * before, so a missing report never *reduces* coverage.
 */
export declare function resolveEffort(explicit: string | undefined): ReviewEffort | undefined;
/**
 * The resolved effort shaped for spreading into a capture command's plan:
 * `{ effort }` when a level resolves, `{}` otherwise (roster fail-safes to full).
 * The three capture commands spread this verbatim, so the conditional spread lives
 * here once rather than being re-spelled at each call site.
 */
export declare function planEffortField(explicit: string | undefined): {
    effort?: ReviewEffort;
};
