/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// [no-telemetry fork] NO_TELEMETRY_GUIDELINES.md §19: clearing old tool
// results is OFF by default. Upstream clears the oldest results once they pass
// 500_000 characters (or after 60 idle minutes); that rewrites the middle of
// the history and forces a prefix-caching server to re-prefill everything
// after it. `-1` disables a trigger; users can still opt in via
// `context.clearContextOnIdle.*`.
export const DEFAULT_TOOL_RESULTS_TOTAL_CHARS_THRESHOLD = -1;
export const DEFAULT_TOOL_RESULTS_IDLE_MINUTES = -1;
