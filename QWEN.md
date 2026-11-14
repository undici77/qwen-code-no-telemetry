# QWEN.md — Qwen Code No-Telemetry Fork: Project Instructions

This is a **no-telemetry fork** of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code): maximum privacy, zero external data leakage, while staying aligned with upstream `main`.

This file holds fork-specific policy and, per mandatory patch, only its NEVER-clause. Narrative, traps and ownership tables are path-gated in `.qwen/rules/` (injected on first touch of a matching file) and in `NO_TELEMETRY_GUIDELINES.md` (NTG, **not loaded** — open it before a merge) at the same §.

Elsewhere: principles, commands, conventions in **`AGENTS.md`** (upstream-owned); review rules `.qwen/review-rules.md`; Web Shell `.qwen/rules/web-shell.md`; release versioning `.qwen/rules/fork-release-versioning.md`; build & test `.qwen/rules/fork-build-and-test.md`.

## No-Telemetry Policy (MANDATORY)

**Implementation strategy (dummy layer):** keep the file structure (deleting files broke merges) but neutralize it:

1. All `@opentelemetry/*` packages removed from dependencies.
2. Telemetry exports in `packages/core/src/telemetry/` replaced with no-op functions.
3. `InstallationManager.getInstallationId()` returns static UUID `00000000-0000-0000-0000-000000000000`.
4. Usage statistics and auto-updates disabled by default.

**Conflict resolution:** telemetry conflicts are resolved by REMOVAL — never keep `@opentelemetry/*` or tracking code to match versions. Version strings match upstream; the policy overrides everything else.

## Fork Patches — MUST Survive Every Merge

Every merge from upstream `main` must re-apply these on top of whatever upstream changed; never drop one. `AGENTS.md` holds the index table; `npm run check:context` re-verifies the invariants mechanically.

### Patch tripwires

NEVER-clauses, not explanations — read the rule file for the § before editing what it governs.

- **§11** never no-op the six `uiTelemetryService` forwarders or empty a body in `telemetry/loggers.ts`; the file differs from upstream by the `dummy-otel.js` import alone.
- **§12** never import `@opentelemetry/api` by package name — relative path to `dummy-otel.js`, because `tsconfig` `paths` do not rewrite `.js`.
- **§1.5** `web_search` stays SerpApi, never DashScope/Google/GLM/Tavily; never a `dashscope` word-gate.
- **§1.6** the vision bridge never rejects on a per-turn count; throttle and queue.
- **§1.7** remote artifact publishing stays locked off and always prompts a human, even under `yolo`/`auto_edit`; a publisher backend outside the collapse list is open egress.
- **§13** audit telemetry commits for `void` → `await` and callback reordering — span-only timing changes survive the merge and duplicate the live tool group.
- **§14** with `QWEN_MEMORY_APPEND_ONLY=1` no memory save or tool-turn reminder rewrites cached bytes; `refreshMemoryInstruction()` stays the single chokepoint; the converter fold is all-or-nothing and never hides user text.
- **§15** UI code never reads the context window or model id from `getContentGeneratorConfig()` / `getModel()`; use `resolveMainModelContext()`.
- **§16** resumed prelude reuse compares rebuilt stable texts byte-for-byte and never skips the rebuild.
- **§19** `clearContextOnIdle` triggers default to `-1`; never restore 60 min / 500k.
- **§20** `setTools()` builds declarations via `runOutsideAgentContext`.

### Gate

`check:context` greps every patch above, rejects column-padded tables in fork docs (fix: `check:tables`; they are `.prettierignore`d), enforces the always-on token budget, requires each § a path-gated rule file, and refuses `@opentelemetry` in manifests, lockfile and `node_modules`. `check:egress` alone observes the binary. Keep all of these after every merge:

```bash
npm run check:context
npm run check:merge-drivers
npm run check:tables
npm run check:egress
cd packages/core && npx vitest run src/tools/serpapi-web-search.test.ts src/tools/web-search.test.ts
npx vitest run src/tools/artifact/
```
