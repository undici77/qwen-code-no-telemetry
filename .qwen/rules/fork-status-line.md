---
paths:
  - "packages/cli/src/ui/status-line-fork-items.ts"
  - "packages/cli/src/ui/statusLinePresets.ts"
  - "packages/cli/src/ui/hooks/useStatusLine.ts"
description: No-telemetry fork §15 — context/cache status-line items and the ALS window leak class
---

### Context & prompt-cache status items (§15)

Makes §14 observable: four opt-in status-line items — `context-tokens` (`54.1k/128.0k`), `cache-live` (share of the last request served from cache), `cache-hit` (session rate for the main model), `compact-in` (headroom before auto-compaction wipes the prefix). All logic lives in the fork-owned `packages/cli/src/ui/status-line-fork-items.ts`; upstream `statusLinePresets.ts` and `hooks/useStatusLine.ts` carry only additive one-liners tagged `// [no-telemetry fork]`.

**Traps:** never import upstream values back into the fork module (module cycle throws at startup — `formatTokenCount` is injected as a parameter instead); cache figures stay scoped to the **main model's main-source traffic** (`bySource[MAIN_SOURCE]`), never summed across `metrics.models`; cache items stay hidden until a cache read is observed, because "provider never reports cache" is indistinguishable from a real 0%; items return plain strings because the footer colors the whole line at once. Most importantly, **UI code never reads the context window or model id from `getContentGeneratorConfig()` / `getModel()`** — both resolve through an AsyncLocalStorage runtime view (`getRuntimeContentGenerator()`) that forked/fast-model runs push, and ALS propagates into React continuations, so the footer transiently renders the _fast_ model's window (the documented #7156 leak class). Go through `resolveMainModelContext()`, which prefers the ALS-immune `getModelsConfig().getGenerationConfig()` and returns **0 for an unknown window** — never falling back to `tokenLimit(modelId)`, which for a provider-declared window would fabricate a plausible-but-wrong size.
