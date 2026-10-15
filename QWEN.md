# QWEN.md — Qwen Code No-Telemetry Fork: Project Instructions

This is a **no-telemetry fork** of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code): maximum privacy, zero external data leakage, while staying aligned with upstream `main`.

This file holds fork-specific policy and, per mandatory patch, only its NEVER-clause. Full narrative, traps and ownership tables are path-gated in `.qwen/rules/` (injected on first touch of a matching file) and in `NO_TELEMETRY_GUIDELINES.md` (NTG, **not loaded** — open it before a merge) at the same §. `check:context` fails if a § loses its rule file.

Elsewhere: generic principles, commands and conventions in **`AGENTS.md`** (upstream-owned); review rules in **`.qwen/review-rules.md`**; Web Shell rules in `.qwen/rules/web-shell.md`; versioning & release in `.qwen/rules/fork-release-versioning.md`; build & test notes in `.qwen/rules/fork-build-and-test.md`.

## No-Telemetry Policy (MANDATORY)

**Implementation strategy (dummy layer):** instead of deleting telemetry files (which broke merges), keep the file structure but neutralize it:

1. All `@opentelemetry/*` packages removed from dependencies.
2. Telemetry exports in `packages/core/src/telemetry/` replaced with no-op functions.
3. `InstallationManager.getInstallationId()` returns static UUID `00000000-0000-0000-0000-000000000000`.
4. Usage statistics and auto-updates disabled by default.

**Conflict resolution priority:** when merging from `main`, telemetry conflicts are resolved by REMOVAL — never keep `@opentelemetry/*` packages or tracking code "just to match versions". Version strings must match upstream, but the no-telemetry policy overrides any telemetry-related code.

## Fork Patches — MUST Survive Every Merge

Every merge from upstream `main` must re-apply these on top of whatever upstream changed; never drop one. `AGENTS.md` holds the index table; `npm run check:context` re-verifies the invariants mechanically.

### Patch tripwires

NEVER-clauses, not explanations — read the rule file for the § before editing what it governs.

- **§11** never no-op the six `uiTelemetryService.addEvent()` forwarders or empty a body in `telemetry/loggers.ts`; the file differs from upstream by the `dummy-otel.js` import alone.
- **§12** never import `@opentelemetry/api` by package name — relative path to `dummy-otel.js`, because `tsconfig` `paths` do not rewrite `.js`.
- **§1.5** `web_search` stays SerpApi, never DashScope/Google/GLM/Tavily; never a `dashscope` word-gate.
- **§1.6** the vision bridge never rejects on a per-turn count; throttle and queue.
- **§1.7** remote artifact publishing stays locked off and always prompts a human, even under `yolo`/`auto_edit`; a publisher backend outside the collapse list is open egress.
- **§13** audit telemetry commits for `void` → `await` and callback reordering — span-only timing changes survive the merge and duplicate the live tool group.
- **§14** with `QWEN_MEMORY_APPEND_ONLY=1` the memory index never rides in the system prompt tail; `refreshMemoryInstruction()` stays the single chokepoint.
- **§15** UI code never reads the context window or model id from `getContentGeneratorConfig()` / `getModel()`; use `resolveMainModelContext()`.
- **§16** resumed prelude reuse compares rebuilt stable texts byte-for-byte and never skips the rebuild.

### Gate

`check:context` runs the grep checks for every patch above (§11/§12/§1.5/§1.6/§13/§14/§15/§16 wiring) with tag totals stricter than the prose, refuses a column-padded table in a fork-owned doc, ratchets the always-on token budget, and refuses a § that lost its rule file or a rule file that lost its `paths:` (no `paths:` ⇒ baseline ⇒ silently always-on). `check:tables` strips table padding and will not write unless every cell provably survived; those files are in `.prettierignore` because prettier re-pads tables. The `vitest` runs are the executable guarantees it cannot run — keep them after every merge:

```bash
npm run check:context
npm run check:merge-drivers
npm run check:tables
cd packages/core && npx vitest run src/tools/serpapi-web-search.test.ts src/tools/web-search.test.ts
npx vitest run src/tools/artifact/
```
