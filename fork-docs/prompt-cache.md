# Fork patches: prompt-cache preservation and status items

Append-only auto-memory, the context/cache status-line items and resume prelude reuse. Part of [NO_TELEMETRY_GUIDELINES.md](../NO_TELEMETRY_GUIDELINES.md): section numbers are global and cited from source comments, so never renumber.

---

## 14. MANDATORY: Append-Only Auto-Memory Patch (Non-Negotiable)

With `QWEN_MEMORY_APPEND_ONLY` set, nothing a memory operation does may change bytes that a prefix-caching server has already cached. This is a **mandatory, non-removable patch** that applies to every merge.

**Why**: a prefix-caching server (oMLX and other vLLM-style paged KV caches, DeepSeek/Qwen implicit caching, Anthropic `cache_control`) reuses the cache only up to the first differing token, so any rewrite in front of the newest message re-prefills everything after it. Upstream #13521 (v0.26.x) already moved the memory **index** out of the system prompt: `getAutoMemoryPrompt()` is now policy-only, and the catalog travels as an appended "full snapshot" part (`memory/request-context.ts`). This patch guards what is left:

1. **Policy layer**: the auto-memory policy rides in the startup prelude instead of the system prompt tail, and `refreshMemoryInstruction()` never rewrites the system prompt.
2. **Delta placement**: a policy change is delivered as an appended delta at the next user query, never between a tool call and its result. `refreshMemoryAfterManagedWrite` runs after a tool batch and before its responses are submitted, so appending there would split the pair.
3. **Prefix-stable tool turns**: Qwen/DeepSeek-style chat templates render `<think>` only for assistant messages after the **last user message**. Upstream appends injected context to tool-result turns: the catalog snapshot after every `MEMORY.md` change, todo reminders and memory recall. The OpenAI converter emits that context as a separate `role: "user"` message, so every injection drops the rendered reasoning of every earlier step of the turn, and the server re-prefills from the first assistant message of the turn. With the flag on, such a turn folds the injected context into its last tool message instead, as the Anthropic converter already does upstream.

**Usage**: `QWEN_MEMORY_APPEND_ONLY=1` (also `true` / `on`). Unset = upstream behavior, byte for byte, on every provider.

**Hooks** — all logic is in fork-owned modules; upstream files carry only additive hunks tagged `// [no-telemetry fork]`.

|File|Ownership|Must contain|
|---|---|---|
|`packages/core/src/memory/append-only-prompt-cache.ts` (+ `.test.ts`)|**Fork**|`isAppendOnlyMemoryEnabled`, `buildAutoMemoryReminder`, `appendAutoMemoryDelta`, `drainAutoMemoryDelta`. Restore verbatim if a merge deletes it.|
|`packages/core/src/core/openaiContentGenerator/tool-turn-reminder-fold.ts` (+ `.test.ts`)|**Fork**|`foldInjectedContextIntoToolMessage`. Restore verbatim if a merge deletes it.|
|`packages/core/src/memory/refresh.ts`|Upstream|Early return at the top of `refreshMemoryInstruction()`.|
|`packages/core/src/core/client.ts`|Upstream|`autoMemory:` ternary in `getMainSessionSystemInstruction()` + `includeAutoMemoryReminder: true` at the **three** main-session call sites + `drainAutoMemoryDelta(this.config, this.getChat())` in the `!hasPendingToolCall && (UserQuery \|\| Cron)` drain block, next to `drainPendingAddedMcpToolsReminder()`.|
|`packages/core/src/core/environmentContext.ts`|Upstream|`includeAutoMemoryReminder?` option + the `reminderParts` entry.|
|`packages/core/src/core/openaiContentGenerator/converter.ts`|Upstream|In `processContent`: the import, `let lastToolMessage`, its assignment after `messages.push(toolMessage)`, and the `!foldInjectedContextIntoToolMessage(...)` guard on the final user-message push.|

**Invariants**:

1. `refreshMemoryInstruction()` is the single chokepoint — route any new memory-driven refresh through it.
2. `includeAutoMemoryReminder` defaults to `false`; only the three main-session sites opt in. Subagents never do.
3. The custom-instruction branch of `client.ts` stays untouched.
4. Flag off ⇒ upstream behavior unchanged, including the OpenAI wire format.
5. `appendAutoMemoryDelta` never appends; only `drainAutoMemoryDelta` does, and only from the user-query drain block.
6. The fold is **all-or-nothing**: a turn is folded only when every text part is injected context (a part carrying `AUTO_MEMORY_SNAPSHOT_METADATA`, or text starting with `SYSTEM_REMINDER_OPEN`). `extractCuratedHistory` merges a real user prompt typed after an interrupt into the tool turn, and that prompt must never be hidden inside a tool result. One unrecognised part leaves the whole turn on the upstream path, so the worst case is "no cache win".
7. The fold never runs when tool media was split into a follow-up user message (that boundary exists anyway).
8. Unwrapped reminders (legacy recall `## Relevant memory`, exploration `System:`, loop reminders) are deliberately not recognised. If upstream wraps them in `<system-reminder>` they start folding automatically.

**Known gap** (follow-up): with the flag on, a write to a project context file (`QWEN.md`/`AGENTS.md`) reloads `userMemory` but is not delivered to the model until an unrelated system-prompt rebuild (model, language, output style, `/cd`, recall-mode switch).

**Settings recipe — reasoning across user prompts**: the fold keeps one turn's reasoning stable. Across real user prompts, Qwen-style templates still drop earlier `<think>` blocks, so the previous turn is re-prefilled. Templates that support it (Qwen3.6+) keep them with `preserve_thinking`. Upstream sends it only to DashScope; for a local oMLX/vLLM entry, set it in `modelProviders` → `generationConfig.extra_body`: `{"chat_template_kwargs": {"preserve_thinking": true}}`. The pipeline's own `chat_template_kwargs` rewrites spread existing keys and only touch `enable_thinking`, so the key survives. Templates that do not know the kwarg ignore it.

**Verify after every merge**:

```bash
grep -rn "no-telemetry fork" packages/core/src/core/client.ts \
  packages/core/src/core/environmentContext.ts packages/core/src/memory/refresh.ts \
  packages/core/src/core/openaiContentGenerator/converter.ts   # 18 lines (client 6, envContext 6, refresh 2, converter 4)
grep -c "autoMemory: this.config.getAutoMemoryPrompt()" packages/core/src/core/client.ts  # exactly 1
grep -c "includeAutoMemoryReminder" packages/core/src/core/client.ts                      # 3
grep -c "drainAutoMemoryDelta(this.config" packages/core/src/core/client.ts               # 1
grep -c "foldInjectedContextIntoToolMessage" packages/core/src/core/openaiContentGenerator/converter.ts  # 2
grep -c "isAppendOnlyMemoryEnabled()" packages/core/src/memory/refresh.ts                 # 1
grep -rn "includeAutoMemoryReminder" packages/core/src/agents/                            # zero lines
cd packages/core && npx vitest run src/memory/append-only-prompt-cache.test.ts \
  src/core/openaiContentGenerator/tool-turn-reminder-fold.test.ts
```

**Conflict resolution**: keep upstream's refactor, re-apply the hooks on top. Never resolve by dropping the patch. If upstream rewrites `processContent`, re-attach the fold at whatever point emits the trailing user message of a tool-result turn.

---

## 15. MANDATORY: Context & Prompt-Cache Status Items (Non-Negotiable)

The status line **MUST** be able to report live prompt-cache state and precise context size. This is a **mandatory, non-removable patch** that applies to every merge.

**Why**: §14 optimizes prompt-cache preservation, but that work is otherwise invisible at runtime — nothing tells you whether the prefix actually survived a turn, or how close the session is to an auto-compaction that will destroy it. Upstream ships 16 preset items, none cache-related, and `aggregateModelTokens` sums only `prompt`/`candidates`. These four items make §14 observable.

**Items** (all opt-in — absent from `DEFAULT_STATUS_LINE_PRESET_CONFIG`):

|Id|Renders|Source|
|---|---|---|
|`context-tokens`|`54.1k/128.0k`|`lastPromptTokenCount` / `contextWindowSize`|
|`cache-live`|`Cache 92% now`|`uiTelemetryService.getLastCachedContentTokenCount()` ÷ last prompt|
|`cache-hit`|`Cache 88% avg`|main model's `bySource[MAIN_SOURCE]` cached ÷ prompt|
|`compact-in`|`Compact in 18.2k`|`computeThresholds(window, pct).auto` − current usage|

**Hooks** — all logic is in the fork-owned module; upstream files carry only additive hunks tagged `// [no-telemetry fork]`.

|File|Ownership|Must contain|
|---|---|---|
|`packages/cli/src/ui/status-line-fork-items.ts` (+ `.test.ts`)|**Fork**|`FORK_STATUS_LINE_ITEM_IDS`, `FORK_STATUS_LINE_ITEMS`, `FORK_CONTEXT_ITEM_IDS`, `resolveMainModelContext`, `buildForkStatusLineData`, `formatForkStatusLineItem`. Restore verbatim if a merge deletes it.|
|`packages/cli/src/ui/statusLinePresets.ts`|Upstream|Import + 2 array spreads + `fork?` field on `StatusLinePresetData` and the builder params + `default:` branch delegating to `formatForkStatusLineItem`.|
|`packages/cli/src/ui/hooks/useStatusLine.ts`|Upstream|Import + `...FORK_CONTEXT_ITEM_IDS` in `CONTEXT_PRESET_ITEM_IDS` + `resolveMainModelContext(cfg, ui.currentModel)` replacing the `contextWindowSize` read in `doUpdate` + the `fork: buildForkStatusLineData({...})` argument + `resolveMainModelContext` in the over-limit check of the returned `hideContextIndicator`.|
|`packages/cli/src/ui/hooks/useStatusLine.test.ts`|Upstream|`getAutoCompactThreshold` on `mockConfig` (the real `Config` has it; the literal mock does not).|

**Invariants**:

1. All logic stays in `status-line-fork-items.ts`. Upstream hunks stay additive one-liners.
2. **Never import upstream values into the fork module** — `statusLinePresets.ts` imports it to build the catalogue, so importing back forms a module cycle that throws `FORK_STATUS_LINE_ITEM_IDS is not iterable` at startup. `formatTokenCount` is injected as a parameter for exactly this reason.
3. **Never read the context window (or the model id) from `Config.getContentGeneratorConfig()` / `Config.getModel()` in UI code.** Both resolve through an AsyncLocalStorage runtime view that forked and fast-model runs push (`getRuntimeContentGenerator()`, read by `Config.getContentGeneratorConfig()`), and ALS propagates into React continuations — so the footer transiently renders the _fast_ model's window and then flips back (the documented #7156 leak class; `runOutsideAgentContext` wraps only four call sites, none of them UI readers). Go through `resolveMainModelContext()`, which prefers the ALS-immune `getModelsConfig().getGenerationConfig()`.
4. `resolveMainModelContext()` returns **0 for an unknown window** and must never fall back to `tokenLimit(modelId)`. A provider-declared window (any custom `modelProviders` entry) never appears in `tokenLimits.ts`, so that fallback fabricates a plausible-but-wrong size; 0 correctly hides the item.
5. Cache figures are scoped to the **main model's main-source traffic**. Never sum across `metrics.models` — auxiliary models (title generation, summarization, a fast model with its own window) and subagents would report a hit rate for a cache the main conversation never uses.
6. `cache-live` / `cache-hit` stay hidden while `sessionCachedTokens === 0`. The `cachedInputTokensReported` provenance flag is dropped before it reaches `SessionMetrics`, so a provider that never reports cache is indistinguishable from a real 0% — without this guard the footer pins a misleading `0% cached`.
7. Items return plain strings. The footer colors the whole line at once (`Footer.tsx`), so state is conveyed with wording, never per-item color.
8. Not listing an item ⇒ byte-identical upstream behavior.

**Verify after every merge**:

```bash
grep -rn "no-telemetry fork" packages/cli/src/ui/statusLinePresets.ts \
  packages/cli/src/ui/hooks/useStatusLine.ts                                    # 12 lines (presets 7, useStatusLine 5)
grep -c "FORK_STATUS_LINE_ITEM_IDS\|FORK_STATUS_LINE_ITEMS" packages/cli/src/ui/statusLinePresets.ts  # 4
grep -c "FORK_CONTEXT_ITEM_IDS\|buildForkStatusLineData" packages/cli/src/ui/hooks/useStatusLine.ts   # 4
grep -n "from './statusLinePresets" packages/cli/src/ui/status-line-fork-items.ts  # zero lines (invariant 2)
grep -n "getContentGeneratorConfig()?.contextWindowSize" packages/cli/src/ui/hooks/useStatusLine.ts  # zero lines (invariant 3)
grep -c "resolveMainModelContext" packages/cli/src/ui/hooks/useStatusLine.ts                         # 3 (import + 2 call sites)
cd packages/cli && npx vitest run src/ui/status-line-fork-items.test.ts \
  src/ui/statusLinePresets.test.ts src/ui/hooks/useStatusLine.test.ts \
  src/ui/components/StatusLineDialog.test.tsx src/ui/components/Footer.test.tsx
```

**Manual smoke test** (interactive TUI): add `context-tokens`, `cache-live`, `cache-hit`, `compact-in` to `ui.statusLine.items` and run two turns. `cache-hit` must match `/stats`, and `compact-in` must agree with `/context`'s threshold ladder. The four items must also appear in the `/statusline` dialog with a live preview.

**Conflict resolution**: keep upstream's refactor, re-apply the hooks on top. Never resolve by dropping the patch.

---

## 16. Resume Prelude Reuse (Automatic, Safe-Only)

Not gated by a flag or a command — always on, because it can never show the model anything other than what a full, correct rebuild would have produced anyway. Documented as its own section because it is a fork behavior change to an upstream-owned function (`getInitialChatHistory`) and needs the same merge-survival care as §14/§15.

**Why**: `getInitialChatHistory()` unconditionally rebuilds the startup prelude (workspace folder structure, MCP server instructions, `<available_skills>` snapshot, deferred-tools reminder) and prepends it as `history[0]` on every call — including on `--continue`/`--resume` (close-and-reopen), where `extraHistory` is the replayed transcript and **already begins with the original prelude** from the first time the session ever started. Upstream never strips that old entry before resuming, so every resume produced `[newPrelude, oldPrelude, ...conversation]`: fresh content in front of an otherwise-unchanged transcript. A prefix-caching backend (oMLX, other vLLM-style paged KV caches) matches cache reuse by exact longest-common-prefix from token 0, so this guaranteed a full re-prefill of the whole conversation on every reopen, even seconds later with nothing on disk changed.

**How it stays 100% safe**: the fix never skips or guesses. The full rebuild (workspace scan, MCP instructions, skills, memory, deferred tools) always runs exactly as upstream does it. Only _after_ that rebuild completes does `reuseResumedPreludeIfUnchanged()` compare the freshly rebuilt **stable** texts (MCP instructions, skills, memory, workspace/date) against the prelude already at the front of `extraHistory`, part-by-part, text-for-text. Only when they are **provably identical** does it return the existing entry (dropping the now-redundant rebuilt copy) instead of prepending a second, duplicate one. Any real change to those stable parts — an edited memory file, a new/changed MCP server, a renamed skill, a folder change, a date rollover past midnight — makes the comparison fail, and `getInitialChatHistory` falls straight through to the exact, unmodified upstream rebuild-and-prepend path. There is no code path where a real change to a stable part is silently dropped; the worst case on a false mismatch is simply "no cache win this time," never stale content.

**Why the deferred-tools tail is deliberately excluded from the comparison** (the bug in the first cut of this patch): `buildDeferredToolsReminder` lists deferred tools NOT yet revealed, and `LlmClient.revealDeferredToolsReferencedInHistory` (`client.ts`) re-reveals every deferred tool ever called anywhere in the transcript **before** `getInitialChatHistory` runs on every resume. So the very first build (before any tool had been called) always lists the full deferred set, while any resume after the session called even one deferred tool — i.e. almost any real session — reveals it first, making the tail shorter on every subsequent rebuild. Comparing that tail made reuse fail almost every real resume, for a reason that has nothing to do with anything the user needs re-announced (the model already knows about that tool — it called it). The tail is safe to leave uncompared: it only ever shrinks, never reintroduces stale info, and a genuinely NEW deferred tool is announced through the existing mid-conversation "now available" delta reminders, never through the prelude.

**Hooks** — all logic is in the fork-owned module; the upstream file carries only an additive import and a post-build comparison call site tagged `// [no-telemetry fork]`.

|File|Ownership|Must contain|
|---|---|---|
|`packages/core/src/core/resume-opt-cache.ts` (+ `.test.ts`)|**Fork**|`reuseResumedPreludeIfUnchanged`. Restore verbatim if a merge deletes it.|
|`packages/core/src/core/environmentContext.ts`|Upstream|Import of `reuseResumedPreludeIfUnchanged` + the `stableTexts`/`deferredToolsText` split inside `getInitialChatHistory` + the post-build comparison call site (after `prelude` is constructed, before the final `return`), injecting `getStartupContextLength` as `deps` (see invariant 2).|

**Invariants**:

1. All comparison logic stays in `resume-opt-cache.ts`. The upstream hunk in `environmentContext.ts` stays an additive post-build check, never a rewrite of the existing rebuild path — the rebuild must always run in full, unconditionally, so the comparison has something honest to compare against. `reminderParts`/`prelude` (what actually gets sent when NOT reusing) must stay byte-identical to upstream's construction — only the `stableTexts`/`deferredToolsText` split is new, and it must recombine into exactly the same array, in the same order, as before the split.
2. **Never import `environmentContext.ts` values into the fork module** — `environmentContext.ts` imports `reuseResumedPreludeIfUnchanged` from `resume-opt-cache.ts`, so importing back (e.g. `getStartupContextLength`) would form a module cycle. It is injected as the `deps` parameter instead — mirrors the `formatTokenCount` injection pattern in §15 invariant 2.
3. The reuse check matches ONLY a single delivered prelude (`getStartupContextLength(extraHistory) === 1`, no `includeCompressed`) AND at least one fresh stable text. A legacy ack-pair session (length 2), a post-compression summary prefix, and an empty rebuild (`skipStartupContext` with nothing else to say) all fail this check on purpose and fall through to the normal path — the first two are shapes never meant to be preserved verbatim, the last is a no-op either way since an empty prelude prepends nothing regardless.
4. The stable comparison is by **part text content**, in order and count — not by object reference, not by a hash, not by a partial/summarized diff. This is what makes it provably safe rather than merely probably safe. The existing entry's part count must equal the fresh stable count, or (when `includeDeferredToolsReminder` was true for this call) stable-count-plus-one — never more. This bounds the tolerance to exactly the one part that's allowed to differ.
5. `toleratesTrailingDeferredToolsPart` must be wired to the SAME `includeDeferredToolsReminder` flag the caller used to decide whether to build that part — never hardcoded `true`. A call site that never builds a deferred-tools part (e.g. a subagent snapshot with `includeDeferredToolsReminder: false`) must not tolerate an unexplained trailing part either.
6. No flag exists to force this off. If a merge needs to disable it temporarily, delete the call site's `if (deduped) { ... }` branch — do not reintroduce an env var, since the whole point is that this needs no manual toggle.

**Verify after every merge**:

```bash
grep -rn "no-telemetry fork" packages/core/src/core/environmentContext.ts | grep -i "resume"   # 3 lines (import, the mandated stableTexts/deferredToolsText split comment, call site)
grep -c "reuseResumedPreludeIfUnchanged" packages/core/src/core/environmentContext.ts          # 2 (import + call)
grep -n "from './environmentContext" packages/core/src/core/resume-opt-cache.ts                # zero lines (invariant 2)
cd packages/core && npx vitest run src/core/resume-opt-cache.test.ts src/core/environmentContext.test.ts
```

**Manual smoke test**: with an oMLX (or other prefix-caching) backend, start a session, call at least one deferred/`tool_search`-reachable tool, send a turn, close the CLI, and `--continue` immediately with nothing changed on disk. `cache-hit`/`cache-live` (§15 status-line items, if enabled) should show a healthy hit ratio on the first resumed turn instead of resetting — the deferred-tool call is the part of this test that would have caught the original bug (a smoke test that never calls a deferred tool cannot distinguish this fix from the broken first cut). Then edit a memory file (or add an MCP server) before resuming again — the prelude should rebuild and the model should see the change, confirming the fallback path still fires on real changes.

**Conflict resolution**: keep upstream's refactor, re-apply the hook on top. Never resolve by dropping the patch.

---
