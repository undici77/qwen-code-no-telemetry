---
paths:
  - "packages/core/src/config/clearContextDefaults.ts"
  - "packages/core/src/services/microcompaction/microcompact.ts"
description: No-telemetry fork §19 — tool-result clearing is off by default
---

### Tool-result clearing is off by default (§19)

Upstream's microcompaction clears the **oldest** tool results in place past 500,000 characters or after 60 idle minutes. That rewrites a message in the middle of the history, so a prefix-caching server (oMLX, vLLM-style paged KV) re-prefills everything after it — one event cleared 105 results from ~33k tokens into a ~400k-token conversation and cost a ~9-minute re-prefill.

Both triggers default to `-1` (disabled): `DEFAULT_TOOL_RESULTS_TOTAL_CHARS_THRESHOLD` and `DEFAULT_TOOL_RESULTS_IDLE_MINUTES` in `clearContextDefaults.ts`, read by `config/config.ts` (normalisation of `clearContextOnIdle`) and both idle-threshold reads in `microcompact.ts`. The settings schema takes its defaults from the same two constants. An explicit setting always wins; only the default changed; auto-compaction at the auto threshold is unaffected.

Conflict resolution: keep upstream's refactor, re-apply the `-1` defaults. Never restore `60` or `500_000`. Pinned by the `getClearContextOnIdle` tests in `config.test.ts` and the two `clearContextOnIdle` schema defaults in `settingsSchema.test.ts`.
