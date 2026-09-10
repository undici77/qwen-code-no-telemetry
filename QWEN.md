# QWEN.md — Qwen Code No-Telemetry Fork: Project Instructions

This is a **no-telemetry fork** of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code): maximum privacy, zero external data leakage, while staying aligned with upstream `main`.

This file holds the **fork-specific** rules and the single copy of the fork-patch detail. Generic working principles, commands, code conventions, Web Shell rules, development workflow, review rules, GitHub operations, PR workflow and project-directory layout live in **`AGENTS.md`** — that file is upstream-owned and is loaded into context alongside this one; do not restate its rules here.

## No-Telemetry Policy (MANDATORY)

**Implementation strategy (dummy layer):** instead of deleting telemetry files (which broke merges), keep the file structure but neutralize it:

1. All `@opentelemetry/*` packages removed from dependencies.
2. Telemetry exports in `packages/core/src/telemetry/` replaced with no-op functions.
3. `InstallationManager.getInstallationId()` returns static UUID `00000000-0000-0000-0000-000000000000`.
4. Usage statistics and auto-updates disabled by default.

**Conflict resolution priority:** when merging from `main`, telemetry conflicts are resolved by REMOVAL — never keep `@opentelemetry/*` packages or tracking code "just to match versions". Version strings must match upstream, but the no-telemetry policy overrides any telemetry-related code.

## Fork Patches — MUST Survive Every Merge

Every merge from upstream `main` must re-apply these on top of whatever upstream changed. Never resolve a conflict by dropping one. `NO_TELEMETRY_GUIDELINES.md` is the deep reference and **is not loaded into context** — open it before a merge; this section is the always-on copy so a merge never starts without knowing the patches are there. `AGENTS.md` holds the index table.

`npm run check:context` re-verifies every command in this section mechanically and fails on drift, including the two documentation traps that greps alone cannot catch: a word-gate that matches inert upstream code, and a `file.ts:NNNN` line citation that has silently moved.

### `loggers.ts` partial no-op rule (§11)

`logApiResponse`, `logApiError`, `logToolCall` (and `recordSkillInvocation`) in `packages/core/src/telemetry/loggers.ts` MUST NOT be no-ops. They MUST forward to `uiTelemetryService.addEvent()` (a local-only in-process `EventEmitter` — zero network, zero disk) and `config.getChatRecordingService()?.recordUiTelemetryEvent()` (local file only, for `--resume`). Making them full no-ops blanks the "Agent powering down. Goodbye!" quit stats (Model Usage / tokens / tool counts) — a correctness bug, not a privacy fix. All other ~30 log functions remain empty no-ops.

### `@opentelemetry/api` runtime import rule (§12)

`tsconfig.json` `paths` only affect type-checking and esbuild bundling; they do NOT rewrite `.js` output. Any `.ts` importing from `@opentelemetry/api` must use a **relative import to `dummy-otel.js`** (e.g. `from '../telemetry/dummy-otel.js'`), or `npm start` crashes with `ERR_MODULE_NOT_FOUND`.

```bash
grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\."
grep -rn "import('@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\."
# BOTH must return zero lines.
```

The second grep is not optional: the first matches only the `from '…'` form and is **blind to inline type references** like `import('@opentelemetry/api').SpanContext` — and that inline form is exactly what produced `TS2307` in `telemetry/session-tracing.ts` for months before v0.23.0. A merge can restore a real upstream reference and the single-grep checklist would still report clean.

### WebSearch / SerpApi (§1.5) — merge cost removed from a mandatory patch

The built-in `web_search` tool MUST remain backed by SerpApi, NOT DashScope/Google/GLM/Tavily.

Upstream's `web-search.ts` is a large, actively-changed DashScope/ModelStudio implementation. The fork used to carry its SerpApi backend as a whole-file replacement of that same file, so every upstream change opened an ~800-line semantic conflict that had to be hand-resolved in favour of SerpApi — the same resolution every time, doing the work of discarding by hand. The patch is now split so that discarding is automatic:

- `packages/core/src/tools/serpapi-web-search.ts` is **fork-owned** and holds the entire backend (gate, fetch, Markdown conversion, tool class). Upstream never creates this path, so it can never conflict.
- `packages/core/src/tools/web-search.ts` is a ~5-line re-export of that module under the names upstream's consumers already import, so upstream's own registration block in `config/config.ts` runs against the SerpApi backend with **zero fork edits**. That file, its test, and `docs/developers/tools/web-search.md` are `merge=ours` in `.gitattributes`.
- Upstream's DashScope settings keys (`model`, `webExtractor`, `baseUrl`, `apiKeyEnv`) stay in the schema and the resolver, accepted and **inert** — there is no DashScope backend, so no code path can turn them into a request. Deleting them would re-open a conflict in three files for no privacy gain.
- Enablement follows upstream's **opt-out** shape. The fork's gate returns `ok: false, silent: true` when no SerpApi key resolves, so the tool stays off with no startup notice and `config.ts` needs no fork delta.

Two traps:

1. **`merge=ours` is not a built-in git merge driver.** It must be registered in `.git/config` (`git config merge.ours.driver true`), which git does not clone. `npm install` registers it via `scripts/check-merge-drivers.js --fix`; `npm run check:merge-drivers` fails if the `.gitattributes` declaration and the registration drift apart. If a web-search file ever conflicts, that is the cause — fix the driver, do not hand-port code.
2. **`merge=ours` discards upstream silently.** After every merge, run `git log --oneline <prev>..<new> -- packages/core/src/tools/web-search.ts` and decide whether anything upstream added is a generic fix worth porting.

The guarantee is a test now, not a grep: `serpapi-web-search.test.ts` intercepts every outbound request and asserts the host is `serpapi.com`, including when the config is loaded with upstream's DashScope values. `src/tools/web-search.test.ts` is no longer excluded in `packages/core/vitest.config.ts` — it used to be, which left this mandatory patch with zero coverage.

**There is deliberately no `grep "dashscope"` gate.** The word stays in the tree on purpose, because that _is_ the conflict-reduction strategy: upstream's settings keys are kept accepted-and-inert so `settingsSchema.ts` and the resolver stay conflict-free, the seam comment explains the replacement, and `serpapi-web-search.test.ts` / `web-search.test.ts` name DashScope values precisely to prove they cannot produce a request. Grepping the tools dir for the word matches the very code that implements the strategy, and "fixing" a hit means deleting inert upstream code — which re-opens the ~800-line conflict the split exists to prevent. A directory-wide _host_ grep is wrong for the same reason: `packages/core/src/tools/artifact/oss-publisher.ts` legitimately names `*.aliyuncs.com` for artifact uploads, an unrelated feature. The real invariant is **host selection inside the search path**, so gate on that — the request URL in `serpapi-web-search.ts` is a hardcoded `https://serpapi.com/search` template whose only parameters are `q`/`engine`/`hl`/`gl`/`api_key`, so no setting can supply a host.

```bash
# 1. Executable guarantee: intercepts every outbound request and asserts the
#    host is serpapi.com — including when the config carries upstream's
#    DashScope model / baseUrl / apiKeyEnv values.
cd packages/core && npx vitest run src/tools/serpapi-web-search.test.ts src/tools/web-search.test.ts

# 2. The seam must still point at the fork backend.
grep -n "export \* from './serpapi-web-search.js'" packages/core/src/tools/web-search.ts
# Must return the re-export line.

# 3. SerpApi must be the only host the search path can contact.
grep -n "https://" packages/core/src/tools/serpapi-web-search.ts
# Only the request template `https://serpapi.com/search` and the
# `example.com` attribution text in the tool description may appear.

# 4. Merge drivers declared in .gitattributes must be registered.
npm run check:merge-drivers
```

### Vision-bridge image concurrency (§1.6)

The vision bridge (`packages/core/src/services/visionBridge/vision-bridge-service.ts`) MUST NEVER reject an image on a per-turn count. It throttles concurrent bridge calls to `VISION_BRIDGE_MAX_IMAGES` (4) and queues the rest — every valid image is eventually converted. If upstream reintroduces a per-turn rejection cap (a `WeakMap`/counter failing images past N), replace it with the concurrency gate (`tryAcquireBridgeSlotSync` / `waitForBridgeSlot` / `releaseBridgeSlot`).

```bash
# Positive: the concurrency gate must be present (7+ references today).
grep -c "tryAcquireBridgeSlotSync\|waitForBridgeSlot\|releaseBridgeSlot" packages/core/src/services/visionBridge/vision-bridge-service.ts
# Positive: the cap must be a concurrency bound, not a per-turn count.
grep -n "bridgeSlotsAvailable = VISION_BRIDGE_MAX_IMAGES" packages/core/src/services/visionBridge/vision-bridge-service.ts
# Negative: no per-turn rejection cap under the names this fork removed.
grep -n "turnImageCounts\|budget was exhausted" packages/core/src/services/visionBridge/vision-bridge-service.ts
# Must return zero lines.
```

The negative grep is scoped to the _names_ this fork deleted, so on its own it only catches a verbatim reintroduction — an upstream cap under a new name would slip past it. That is why the two positive greps are load-bearing: if the concurrency gate disappears or stops being the mechanism, they fail even when the negative grep stays clean.

### Append-only auto-memory (§14) — prompt-cache preservation

Upstream carries the managed memory index in the **system prompt**, which is serialized ahead of the entire conversation. `refreshMemoryInstruction()` — run by the background extraction agent **once per user turn** — rewrites that tail, which moves the first differing token in front of the whole transcript and forces a full re-prefill on any server that reuses a KV cache by longest-common-prefix (oMLX and other vLLM-style paged caches, DeepSeek/Qwen implicit prefix caching, Anthropic `cache_control`). One added index line costs a re-read of the entire history.

`QWEN_MEMORY_APPEND_ONLY=1` moves the index into the conversation instead: the full index rides in the startup prelude, later saves append a small delta at the END of history. Appending never changes an already-cached byte. Off by default = upstream behavior.

All logic lives in the fork-owned `packages/core/src/memory/append-only-prompt-cache.ts`. Upstream files carry only additive hooks tagged `// [no-telemetry fork]` in `memory/refresh.ts`, `core/client.ts` and `core/environmentContext.ts` — **grep that tag after every merge to find them all**.

Invariants a merge must preserve:

1. `refreshMemoryInstruction()` stays the single chokepoint for memory-driven prompt refreshes.
2. `includeAutoMemoryReminder` defaults to `false`; only the three main-session call sites opt in. Subagents never do.
3. The custom-instruction branch of `client.ts` stays untouched.
4. Flag off ⇒ byte-identical upstream behavior.

```bash
grep -rn "no-telemetry fork" packages/core/src/core/client.ts \
  packages/core/src/core/environmentContext.ts packages/core/src/memory/refresh.ts
# Must return 7+ lines. See NO_TELEMETRY_GUIDELINES.md §14 for the full checklist.
```

### Context & prompt-cache status items (§15)

Makes the §14 patch observable: four opt-in status-line items — `context-tokens` (`54.1k/128.0k`), `cache-live` (share of the last request served from cache), `cache-hit` (session rate for the main model) and `compact-in` (headroom before auto-compaction wipes the prefix).

All logic lives in the fork-owned `packages/cli/src/ui/status-line-fork-items.ts`. Upstream `statusLinePresets.ts` and `hooks/useStatusLine.ts` carry only additive one-liners tagged `// [no-telemetry fork]`.

Traps a merge must not walk into:

1. **Never import upstream values into the fork module.** `statusLinePresets.ts` imports it to build the catalogue, so importing back forms a module cycle that throws at startup. `formatTokenCount` is injected as a parameter instead.
2. Cache figures stay scoped to the **main model's main-source traffic** (`bySource[MAIN_SOURCE]`) — never summed across `metrics.models`, or a fast/title-generation model pollutes the rate.
3. Cache items stay hidden until a cache read is observed, because "provider never reports cache" is indistinguishable from a real 0%.
4. **UI code never reads the context window or model id from `getContentGeneratorConfig()` / `getModel()`** — both resolve through an AsyncLocalStorage runtime view (`getRuntimeContentGenerator()`, read at `config.ts` `getContentGeneratorConfig()`) that forked/fast-model runs push, and ALS propagates into React continuations, so the footer transiently renders the _fast_ model's window before flipping back (the documented #7156 leak class). Go through `resolveMainModelContext()`, which prefers the ALS-immune `getModelsConfig().getGenerationConfig()`. That resolver returns **0 for an unknown window** and must never fall back to `tokenLimit(modelId)` — a provider-declared window (any custom `modelProviders` entry) never appears in `tokenLimits.ts`, and the fallback would fabricate a plausible-but-wrong size.
5. Items return plain strings because the footer colors the whole line at once; not listing an item ⇒ byte-identical upstream behavior.

```bash
grep -rn "no-telemetry fork" packages/cli/src/ui/statusLinePresets.ts \
  packages/cli/src/ui/hooks/useStatusLine.ts
# Must return 7+ lines. See NO_TELEMETRY_GUIDELINES.md §15 for the full checklist.
```

### Telemetry commits can change control-flow timing (§13)

Upstream telemetry fixes often add `await`/`try-finally` just to keep a trace span open; the span is a no-op here, but the **timing change survives the merge**. Incident (v0.21.12): upstream `#9121` changed the tool-result submission in `useGeminiStream.ts` from `void submitQuery(...)` to `await submitQuery(...)`, delaying `CoreToolScheduler`'s `notifyToolCallsUpdate([])` until the whole continuation stream ended → the completed tool group rendered in both Static and the live region (TUI duplication of the last tool block during RUN).

**On every merge**: audit telemetry commits for `void` → `await` / callback-ordering changes; verify `checkAndNotifyCompletion` in `packages/core/src/core/coreToolScheduler.ts` calls `notifyToolCallsUpdate()` right after `this.toolCalls = []` (before the awaited `onAllToolCallsComplete`), and the regression test "clears the live tool-call view before a slow completion callback resolves" still exists.

### Resume prelude reuse (§16) — automatic, safe-only

Not mandatory in the sense of §14/§15's blocking checklist, but still a fork behavior change to an upstream-owned function, so it needs the same merge-survival care. No flag, no command — always on.

`getInitialChatHistory()` always rebuilds the startup prelude (folder structure, MCP instructions, skills, deferred-tools) and prepends it fresh, including on `--continue`/`--resume`, where the replayed transcript already starts with the _original_ prelude from the session's first-ever start. Upstream never strips that old entry, so every resume produced `[newPrelude, oldPrelude, ...conversation]` — new content in front of an otherwise-unchanged transcript, which busts a prefix-caching backend's (oMLX, other vLLM-style paged caches) entire cached prefix on every reopen, even with nothing on disk changed.

The fix never skips the rebuild — the full build (workspace scan, MCP instructions, skills, memory, deferred tools) always runs, so nothing is ever guessed or assumed unchanged. Only _afterward_ does it compare the freshly rebuilt **stable** texts (MCP instructions, skills, memory, workspace/date) against the ones already in the resumed transcript, byte-for-byte; if they're identical, the existing entry is reused instead of prepending the redundant rebuilt copy. Any real change to a stable part (memory edit, new MCP server, renamed skill, folder change, date rollover) makes the comparison fail, and the exact unmodified upstream rebuild-and-prepend path runs.

The deferred-tools tail is deliberately EXCLUDED from the comparison — this was the bug in the first cut of this patch. `buildDeferredToolsReminder` lists deferred tools not yet revealed, and `LlmClient.revealDeferredToolsReferencedInHistory` re-reveals every deferred tool ever called anywhere in the transcript before every resume rebuild. So the very first build (before any tool call) always lists the full deferred set, while any resume after the session called even one deferred tool — almost any real session — reveals it first, shrinking the tail. Comparing that tail made reuse fail on nearly every real resume for a reason that has nothing to do with anything needing re-announcement (the model already knows about a tool it called). The tail is safe to leave uncompared: it only ever shrinks, and a genuinely new deferred tool is announced through the existing mid-conversation delta reminders, never through the prelude.

All logic lives in the fork-owned `packages/core/src/core/resume-opt-cache.ts` (`reuseResumedPreludeIfUnchanged`); `core/environmentContext.ts` carries only an additive import + the `stableTexts`/`deferredToolsText` split + a post-build comparison call site tagged `// [no-telemetry fork]`. The fork module never imports back from `environmentContext.ts` — `getStartupContextLength` is injected as a param, same reasoning as §15's `formatTokenCount` injection.

```bash
grep -n "reuseResumedPreludeIfUnchanged" packages/core/src/core/environmentContext.ts
# Must return 2 lines (import + call site). See NO_TELEMETRY_GUIDELINES.md §16.
```

## Versioning & Release

- **Version rule**: `package.json` `"version"` is the single source of truth. On release, update: **Dockerfile** (`ARG QWEN_REF="v[version]-no-telemetry"`), **install.sh** + **install.ps1** (all example version references), **README.md** (install script URLs + original README link). The `-no-telemetry` suffix is always the same — never change it.
- **Two-layer versioning**: upstream version stays identical to upstream `main` (dependency resolution); the `-no-telemetry` suffix identifies the privacy fork.
- **Single-Merge Strategy** (single release commit while keeping `main` aligned):
  1. `git reset --hard [LAST_TAG]`
  2. `git merge --no-ff main -m "feat: release [VERSION]"`
  3. Resolve/neutralize and `git commit --amend`
     _Avoid `reset --soft` after merge — it breaks the history link to `main`._

## Efficiency & Troubleshooting

1. **Stale JS Cleanup**: if esbuild fails with "No matching export" after updating `.ts`, stale `.js` files exist in `src`. Fix:
   ```bash
   find packages/*/src -name "*.ts" -o -name "*.tsx" | sed 's/\.ts$//; s/\.tsx$//' | while read -r base; do rm -f "${base}.js" "${base}.js.map"; done
   ```
2. **Node.js**: ALWAYS use **Node.js >= 22.0.0** (Ink 7 + React 19.2 require it; older fails with `EBADENGINE`).
3. **Express Params**: cast `req.params['id'] as string` to avoid union type errors.
4. **Test Timeout Avoidance**: never run `npm run test` from the project root (launches every package, times out). Always target a single workspace: `npm run test --workspace=packages/core`. If a test exceeds 2× its expected duration, kill it and investigate. `packages/cli` has mutation-testing harnesses that take 3+ minutes; use `--reporter=verbose` to see progress.
5. **Pre-existing Failure Baseline**: before investigating a test failure, confirm it's a regression on the clean `dev` branch (`git stash && npm run test --workspace=... && git stash pop`). The core package has ~22 known pre-existing failures (root-permission tests, LSP config loader, bundled-skill integration) — don't waste cycles on them.
6. **Vitest Version Drift**: `packages/sdk-typescript` must keep vitest in sync with the workspace root (^3.2.4). A mismatch creates an isolated `node_modules` and `tsc` fails with "ExpectStatic has no call signatures" — check `cat packages/sdk-typescript/node_modules/vitest/package.json | grep version`.
7. **WebUI Build Pattern**: `packages/webui` uses a custom `tsconfig.dts.json` + a manual `tsc` step in its build script because `vite-plugin-dts` is unreliable with CSS/SVG imports.

**Timeout reference table** (for `run_shell_command` `timeout`, ms):

| Command                                                               | Expected     | Safe timeout |
| --------------------------------------------------------------------- | ------------ | ------------ |
| `npm run build:packages`                                              | ~30s         | 60s          |
| `npm run build` (full, incl. web-shell)                               | ~90–120s     | **180s**     |
| `npm run typecheck`                                                   | ~30s         | 60s          |
| `npm run lint` / `lint:fix`                                           | ~90s / 120s+ | **180s**     |
| `npm run test --workspace=packages/{sdk-typescript,acp-bridge,webui}` | ~10–25s      | 60s          |
| `npm run test --workspace=packages/core`                              | ~75s         | **180s**     |
| `npm install`                                                         | ~60–100s     | **180s**     |
| `git stash && npm run test && git stash pop` (baseline)               | ~90s         | **180s**     |

## Fork Testing Notes

- **OTel test exclusions**: `packages/core/vitest.config.ts` excludes `src/telemetry/*.test.ts` (except `uiTelemetry.test.ts`, which tests local-only stats) — they can't compile without the removed `@opentelemetry` deps.
- **Root-user skip**: `packages/cli`'s permission error-counting case in `cleanup.test.ts` auto-skips when `process.getuid?.() === 0` (root bypasses directory write restrictions).

**Pre-existing failures (running as root, NOT related to our changes):**

1. `src/tools/edit.test.ts` — "should return FILE_WRITE_FAILURE on write error" (root bypasses file permission checks)
2. `src/utils/pathReader.test.ts` — "should return an error string if reading a file with no permissions" (root bypasses permission checks)
3. `packages/cli/src/utils/housekeeping/cleanup.test.ts` — "counts errors and continues sweep when one dir cannot be removed" (root bypasses directory write restrictions)

**Tests we fixed for no-telemetry:** `installationManager.test.ts` (static UUID), `config.test.ts` (usage stats + gitCoAuthor disabled by default), `settingsSchema.test.ts` (gitCoAuthor default false), `gemini.test.tsx` (fixed `getCliVersionDisplay` mock), `mustTranslateKeys.test.ts` (restored deleted locale files + `git-commit.js`), `packages/core/src/telemetry/*.test.ts` excluded in `vitest.config.ts`.

## Project Structure

```
packages/{cli (main entry), core (backend + telemetry dummy layer), sdk-java, sdk-typescript,
          test-utils, vscode-ide-companion, web-templates, webui, zed-extension}
docs/ (source docs) · docs-site/ (Next.js site) · integration-tests/ · scripts/ · eslint-rules/
build.sh / install.sh (install.ps1 = Windows counterpart) · Dockerfile · Makefile
```
