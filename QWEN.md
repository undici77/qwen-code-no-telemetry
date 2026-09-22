# QWEN.md — Qwen Code No-Telemetry Fork: Project Instructions

This is a **no-telemetry fork** of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code): maximum privacy, zero external data leakage, while staying aligned with upstream `main`.

This file holds the **fork-specific** rules and the always-on copy of the fork-patch invariants. Generic working principles, commands, code conventions, Web Shell rules, development workflow, review rules, GitHub operations and the working-directory table (`AGENTS.md` §Project Directories) live in **`AGENTS.md`** — upstream-owned, loaded alongside this file; do not restate its rules here. `NO_TELEMETRY_GUIDELINES.md` (NTG) is the deep reference and is **not loaded** — open it before a merge; every § below has a matching section there with the full narrative, ownership tables, numbered invariants and smoke tests, plus the package layout (§7) and the build/test detail (§3, §10).

## No-Telemetry Policy (MANDATORY)

**Implementation strategy (dummy layer):** instead of deleting telemetry files (which broke merges), keep the file structure but neutralize it:

1. All `@opentelemetry/*` packages removed from dependencies.
2. Telemetry exports in `packages/core/src/telemetry/` replaced with no-op functions.
3. `InstallationManager.getInstallationId()` returns static UUID `00000000-0000-0000-0000-000000000000`.
4. Usage statistics and auto-updates disabled by default.

**Conflict resolution priority:** when merging from `main`, telemetry conflicts are resolved by REMOVAL — never keep `@opentelemetry/*` packages or tracking code "just to match versions". Version strings must match upstream, but the no-telemetry policy overrides any telemetry-related code.

## Fork Patches — MUST Survive Every Merge

Every merge from upstream `main` must re-apply these on top of whatever upstream changed. Never resolve a conflict by dropping one. `AGENTS.md` holds the index table; `npm run check:context` re-verifies the invariants below mechanically and fails on drift — including the two documentation traps greps alone cannot catch: a word-gate that matches inert upstream code, and a `file.ts:NNNN` citation that has silently moved.

### `loggers.ts` partial no-op rule (§11)

Six functions in `packages/core/src/telemetry/loggers.ts` call `uiTelemetryService.addEvent()` (a local-only in-process `EventEmitter` — zero network, zero disk): `logApiResponse`, `logApiError`, `logToolCall`, `logApiCancel`, `logUserFeedback`, `recordSkillInvocation`. None of the six may be a no-op, and four of them (`logApiResponse`, `logApiError`, `logToolCall`, `logUserFeedback`) must also reach `config.getChatRecordingService()?.recordUiTelemetryEvent()` (local file only, for `--resume`). Making them full no-ops blanks the "Agent powering down. Goodbye!" quit stats (Model Usage / tokens / tool counts) — a correctness bug, not a privacy fix. The fork patches **no function body** in this file — it differs from upstream by the `dummy-otel.js` import alone — so all 54 exported `log*`/`record*` functions keep upstream bodies and stay **inert** because `QwenLogger` never sends and the OTel SDK never initializes. Never re-point one at a real exporter, and never "tighten" the list by emptying a body.

### `@opentelemetry/api` runtime import rule (§12)

`tsconfig.json` `paths` only affect type-checking and esbuild bundling; they do NOT rewrite `.js` output. Any `.ts` importing from `@opentelemetry/api` must use a **relative import to `dummy-otel.js`** (e.g. `from '../telemetry/dummy-otel.js'`), or `npm start` crashes with `ERR_MODULE_NOT_FOUND`. `check:context` greps both the `from '…'` form and the inline `import('…')` type form — the inline form is what produced `TS2307` for months before v0.23.0.

### WebSearch / SerpApi (§1.5)

The built-in `web_search` tool MUST remain backed by SerpApi, NOT DashScope/Google/GLM/Tavily. `tools/serpapi-web-search.ts` is **fork-owned** and holds the entire backend, so upstream can never conflict with it; `tools/web-search.ts` is a ~5-line `merge=ours` re-export under the names upstream's consumers import, so upstream's registration block in `config/config.ts` runs against the SerpApi backend with **zero fork edits**. Enablement follows upstream's **opt-out** shape: with no SerpApi key and `enabled` unset the gate returns `ok: false, silent: true`, so the tool stays off with no startup notice (`enabled: true` with no key is the one case that does nag). Upstream's DashScope settings keys stay in the schema and resolver, accepted and **inert** — no backend exists to turn them into a request, and deleting them re-opens a conflict in three files for no privacy gain.

**Traps:** `merge=ours` is not a built-in git merge driver — it must be registered in `.git/config` (git does not clone it); `npm install` registers it, and if a web-search file ever conflicts _that_ is the cause — fix the driver, do not hand-port. And `merge=ours` discards upstream **silently** — after every merge run `git log --oneline <prev>..<new> -- packages/core/src/tools/web-search.ts` and decide what is worth porting.

**Never add a `dashscope` word-gate** — `check:context` fails it. The word stays in the tree on purpose: inert keys, the seam comment and the tests that prove those keys cannot produce a request all name it, so "fixing" a hit deletes the conflict-reduction strategy itself. The invariant is **host selection inside the search path**, not a word or a directory.

### Vision-bridge image concurrency (§1.6)

The vision bridge (`packages/core/src/services/visionBridge/vision-bridge-service.ts`) MUST NEVER reject an image on a per-turn count. It throttles concurrent bridge calls to `VISION_BRIDGE_MAX_IMAGES` (4) and queues the rest — every valid image is eventually converted. If upstream reintroduces a per-turn rejection cap (a `WeakMap`/counter failing images past N), replace it with the concurrency gate (`tryAcquireBridgeSlotSync` / `waitForBridgeSlot` / `releaseBridgeSlot`). `check:context` asserts both directions, and the positive ones are load-bearing: the gate and its `VISION_BRIDGE_MAX_IMAGES` bound must be present, while the negative check only matches the _names_ this fork deleted, so an upstream cap under a new name is invisible to it.

### Artifact remote-upload lockdown (§1.7)

Remote artifact publishing MUST be hard-locked off, and publishing MUST always prompt a human — even under `yolo` and `auto_edit`. All logic is fork-owned in `tools/artifact/no-remote-publish.ts`; `create-publisher.ts` carries one tagged call collapsing `host`/`oss` to `local` before upstream's `switch`, and `artifact-tool.ts` carries a tagged `requiresUserInteraction()` override.

**Trap:** `getDefaultPermission() === 'ask'` is **not** evidence a user is prompted — `permissionFlow.ts` discards it: YOLO auto-approves everything except `ask_user_question`, and `AUTO_EDIT` auto-approves any confirmation of `type: 'info'`, which is what `ArtifactTool`'s confirmation is. Without the override, an armed `oss`/`host` publisher lets the model read and upload up to 16 MB per file with no prompt. If upstream ever adds a new publisher backend, add it to the collapse list — a backend not in that list is an open egress path.

### Telemetry commits can change control-flow timing (§13)

Upstream telemetry fixes often add `await`/`try-finally` just to keep a trace span open; the span is a no-op here, but the **timing change survives the merge**. Incident (v0.21.12): upstream `#9121` changed the tool-result submission in `packages/cli/src/ui/hooks/use-llm-stream.ts` (named `useGeminiStream.ts` until the #10124 identifier rename) from `void submitQuery(...)` to `await submitQuery(...)`, delaying `CoreToolScheduler`'s `notifyToolCallsUpdate([])` until the continuation stream ended → the completed tool group rendered in both Static and the live region (TUI duplication during RUN). On every merge, audit telemetry commits for `void` → `await` / callback-ordering changes; `check:context` verifies `checkAndNotifyCompletion` clears `toolCalls` and notifies _before_ the awaited `onAllToolCallsComplete`, re-notifies in `finally`, and that the regression test "clears the live tool-call view before a slow completion callback resolves" still exists.

### Append-only auto-memory (§14) — prompt-cache preservation

Upstream carries the managed memory index in the **system prompt**, serialized ahead of the entire conversation, and `refreshMemoryInstruction()` — run by the background extraction agent **once per user turn** — rewrites that tail. That moves the first differing token in front of the whole transcript and forces a full re-prefill on any server that reuses a KV cache by longest-common-prefix (oMLX and other vLLM-style paged caches, DeepSeek/Qwen implicit prefix caching, Anthropic `cache_control`): one added index line costs a re-read of the entire history.

`QWEN_MEMORY_APPEND_ONLY=1` moves the index into the conversation instead — the full index rides in the startup prelude, later saves append a small delta at the END of history, and appending never changes an already-cached byte. Off by default = upstream behavior. All logic lives in the fork-owned `packages/core/src/memory/append-only-prompt-cache.ts`; upstream files carry only additive hooks tagged `// [no-telemetry fork]` in `memory/refresh.ts`, `core/client.ts` and `core/environmentContext.ts` — **grep that tag after every merge to find them all**. Invariants: `refreshMemoryInstruction()` stays the single chokepoint; `includeAutoMemoryReminder` defaults to `false` and only the three main-session call sites opt in (subagents never do); the custom-instruction branch of `client.ts` stays untouched; flag off ⇒ byte-identical upstream behavior.

### Context & prompt-cache status items (§15)

Makes §14 observable: four opt-in status-line items — `context-tokens` (`54.1k/128.0k`), `cache-live` (share of the last request served from cache), `cache-hit` (session rate for the main model), `compact-in` (headroom before auto-compaction wipes the prefix). All logic lives in the fork-owned `packages/cli/src/ui/status-line-fork-items.ts`; upstream `statusLinePresets.ts` and `hooks/useStatusLine.ts` carry only additive one-liners tagged `// [no-telemetry fork]`.

**Traps:** never import upstream values back into the fork module (module cycle throws at startup — `formatTokenCount` is injected as a parameter instead); cache figures stay scoped to the **main model's main-source traffic** (`bySource[MAIN_SOURCE]`), never summed across `metrics.models`; cache items stay hidden until a cache read is observed, because "provider never reports cache" is indistinguishable from a real 0%; items return plain strings because the footer colors the whole line at once. Most importantly, **UI code never reads the context window or model id from `getContentGeneratorConfig()` / `getModel()`** — both resolve through an AsyncLocalStorage runtime view (`getRuntimeContentGenerator()`) that forked/fast-model runs push, and ALS propagates into React continuations, so the footer transiently renders the _fast_ model's window (the documented #7156 leak class). Go through `resolveMainModelContext()`, which prefers the ALS-immune `getModelsConfig().getGenerationConfig()` and returns **0 for an unknown window** — never falling back to `tokenLimit(modelId)`, which for a provider-declared window would fabricate a plausible-but-wrong size.

### Resume prelude reuse (§16) — automatic, safe-only

Always on, no flag. `getInitialChatHistory()` rebuilds the startup prelude and prepends it fresh even on `--continue`/`--resume`, where the replayed transcript already starts with the _original_ prelude — so upstream produced `[newPrelude, oldPrelude, ...conversation]`, busting a prefix-caching backend's entire cached prefix on every reopen with nothing on disk changed. The fix **never skips the rebuild**: the full build (workspace scan, MCP instructions, skills, memory, deferred tools) always runs, so nothing is guessed. Only afterward does it compare the freshly rebuilt **stable** texts (MCP instructions, skills, memory, workspace/date) against the ones already in the resumed transcript, byte-for-byte: identical ⇒ reuse the existing entry; any real change ⇒ the exact unmodified upstream rebuild-and-prepend path.

The deferred-tools tail is deliberately **excluded** (the bug in this patch's first cut): `LlmClient.revealDeferredToolsReferencedInHistory` re-reveals every deferred tool ever called before every resume rebuild, so the tail legitimately shrinks after almost any real session. Safe to leave uncompared — it only ever shrinks, and a genuinely new deferred tool is announced through the existing mid-conversation delta reminders, never through the prelude.

All logic lives in the fork-owned `packages/core/src/core/resume-opt-cache.ts` (`reuseResumedPreludeIfUnchanged`); `core/environmentContext.ts` carries only an additive import, the `stableTexts`/`deferredToolsText` split and a post-build comparison call site tagged `// [no-telemetry fork]`. The fork module never imports back — `getStartupContextLength` is injected as a param, as in §15.

### Gate

`check:context` runs the grep checks for every patch above — §11/§12/§1.5/§1.6/§13/§14/§15/§16 wiring — with tag totals stricter than the prose states, and now also refuses a column-padded table in a fork-owned doc. `check:tables` strips that padding (~15% of NTG's tokens) and will not write unless it has proved every cell survived verbatim; the file is in `.prettierignore` because prettier re-pads tables and would otherwise undo it. The `vitest` runs are the executable guarantees it cannot run — keep them after every merge:

```bash
npm run check:context
npm run check:merge-drivers
npm run check:tables
cd packages/core && npx vitest run src/tools/serpapi-web-search.test.ts src/tools/web-search.test.ts
npx vitest run src/tools/artifact/
```

## Versioning & Release

- **Version rule**: `package.json` `"version"` is the single source of truth. On release, update: **Dockerfile** (`ARG QWEN_REF="v[version]-no-telemetry"`), **install.sh** + **install.ps1** (all example version references), **README.md** (install script URLs + original README link). The `-no-telemetry` suffix is always the same — never change it.
- **Two-layer versioning**: upstream version stays identical to upstream `main` (dependency resolution); the `-no-telemetry` suffix identifies the privacy fork.
- **Single-Merge Strategy** (single release commit, `main` stays aligned): `git reset --hard [LAST_TAG]` → `git merge --no-ff main -m "feat: release [VERSION]"` → resolve/neutralize → `git commit --amend`. Avoid `reset --soft` afterwards — it breaks the history link to `main`. See NTG §5.

## Build & Test Notes

Never run `npm run test` from the project root — it launches every package and times out. Target one workspace (`npm run test --workspace=packages/core`, or `cd packages/<p> && npx vitest run src/path/to/file.test.ts`); `packages/cli` mutation-testing harnesses take 3+ minutes, so use `--reporter=verbose`. Stale `.js` beside a `.ts` breaks esbuild with "No matching export" — and a `rm` on a _tracked_ one only dirties the tree, so untrack it.

Node ≥ 22, the stale-artifact cleanup command and the `run_shell_command` **timeout table** are in **NTG §3**; Express param casts, vitest version drift, the WebUI `.d.ts` pattern, the root-user pre-existing failure baseline and the tests fixed for no-telemetry are in **NTG §10**. Do not re-derive them, and re-baseline failure counts on a clean `dev` branch before quoting a number.
