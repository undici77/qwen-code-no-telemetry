# Fork patches: telemetry layer, timing and cache-safe defaults

The `loggers.ts` partial no-op rule, the `@opentelemetry/api` import rule, control-flow timing, tool-result clearing defaults and the `setTools()` frame. Part of [NO_TELEMETRY_GUIDELINES.md](../NO_TELEMETRY_GUIDELINES.md): section numbers are global and cited from source comments, so never renumber.

---

## 11. Privacy-Safe Local Stats vs. External Telemetry: The `loggers.ts` Rule

This is the most subtle and dangerous post-merge failure mode. **Read carefully.**

### The `uiTelemetryService` is NOT telemetry — it is local stats

`packages/core/src/telemetry/uiTelemetry.ts` exports a `uiTelemetryService` singleton that is a **pure in-process Node.js `EventEmitter`**. It has zero network code. It aggregates token counts and tool stats that are displayed in the "Agent powering down. Goodbye!" quit panel. It never persists to disk and never touches the network.

> 🔒 **Privacy proof for `uiTelemetryService`** — verified by code audit:
>
> - Defined in `packages/core/src/telemetry/uiTelemetry.ts` as `class UiTelemetryService extends EventEmitter`
> - Contains NO `fetch`, NO `http.request`, NO `https.request`, NO `XMLHttpRequest`, NO WebSocket, NO `child_process`, NO `fs.write*` calls
> - Data lives entirely in memory (`SessionMetrics` object) and is consumed only by `StatsDisplay.tsx` (the local TUI panel)
> - Listeners are registered via `uiTelemetryService.on(...)` only within the same process
> - **Forwarding events to it is 100% privacy-safe and does NOT violate the no-telemetry policy**

### The `loggers.ts` PARTIAL no-op rule

`packages/core/src/telemetry/loggers.ts` exports 54 `log*`/`record*` functions. The fork patches **no function body** in this file — `git diff upstream/main -- packages/core/src/telemetry/loggers.ts` is the `dummy-otel.js` import swap (§12) and nothing else. Six functions call `uiTelemetryService`; they are the local statistics pipeline and MUST NOT be no-ops, or the quit summary (Model Usage / tokens / tool counts) goes permanently blank:

|Function|Must forward to|
|---|---|
|`logApiResponse`|`uiTelemetryService.addEvent()` + `recordUiTelemetryEventToChat()`|
|`logApiError`|`uiTelemetryService.addEvent()` + `recordUiTelemetryEventToChat()`|
|`logToolCall`|`uiTelemetryService.addEvent()` + `recordUiTelemetryEventToChat()`|
|`logUserFeedback`|`uiTelemetryService.addEvent()` + `recordUiTelemetryEventToChat()`|
|`logApiCancel`|`uiTelemetryService.addEvent()`|
|`recordSkillInvocation`|`uiTelemetryService.recordSkillInvocation()`|

**These six are NOT a telemetry leak.** They do not send data anywhere — they update an in-memory counter displayed to the user on their own screen when the session ends, and four of them append to the local `--resume` recording. No-op-ing them is a correctness bug, not a privacy improvement.

The other 48 keep their upstream bodies and stay **inert** because the sinks behind them are dead, not because their bodies were emptied: `sdk.ts` exports no-op `initializeTelemetry`/`shutdownTelemetry` and `isTelemetrySdkInitialized()` returns `false`, so every `if (!isTelemetrySdkInitialized()) return;` guard short-circuits before `logs.getLogger(...)` is reached; `QwenLogger.flushToRum()` and `flushIfNeeded()` are no-ops, so the RUM buffer is assembled in memory and never transmitted; and `config.ts` hardcodes `this.usageStatisticsEnabled = false`, which gates the `recordTokenUsageFromApiResponse*` calls at their own call sites.

> 🔒 **Privacy proof for `getChatRecordingService()`** — `packages/core/src/services/chatRecordingService.ts` contains no `fetch`, `http.request`, `https.request`, `XMLHttpRequest`, `WebSocket` or `child_process` call. It appends JSONL lines to `~/.qwen/tmp/<project_id>/chats/<session-id>.jsonl` for `--resume` only. Purely local session persistence.

> ⚠️ **Never hand-copy a function body into this document, and never "tighten" the rule by emptying one.** An earlier revision of this section carried a 9-line `logApiResponse` under "copy exactly, do NOT make no-ops". The real function is ~70 lines and contains `if (config.getUsageStatisticsEnabled())` and `if (!isInternalPromptId(event.prompt_id))` gates plus subagent identity attribution — pasting that short copy over it would have **deleted a privacy gate** and opened a permanent upstream conflict. The invariant is only the forward calls in the table above; prove them with the grep below, never against a transcribed body.

### Verification checklist after every merge

Run this grep to confirm no external data paths snuck in:

```bash
# Must print ZERO results (no real OTel packages)
find node_modules -name "index.js" -path "*opentelemetry/api*" 2>/dev/null

# Must show uiTelemetryService in EXACTLY these 6 functions and nowhere else:
# logApiResponse, logApiError, logToolCall, logApiCancel, logUserFeedback,
# recordSkillInvocation. A 7th name appearing here is a new local-stats sink;
# one of these 6 disappearing is the §11 blanking bug.
awk '/^(export )?(async )?function /{fn=$0; sub(/\(.*/,"",fn);
     sub(/^(export )?(async )?function /,"",fn)} /uiTelemetryService/ && fn {print fn}' \
  packages/core/src/telemetry/loggers.ts | sort -u

# Must show the hardcoded false, not a getter pass-through
grep -n "this.usageStatisticsEnabled = " packages/core/src/config/config.ts

# Must be default: false (auto-update off by default)
grep -A6 "enableAutoUpdate:" packages/cli/src/config/settingsSchema.ts | grep default

# Must be a no-op returning {} — the only RUM send path
grep -A2 "async flushToRum" packages/core/src/telemetry/qwen-logger/qwen-logger.ts

# Must return false, so every `if (!isTelemetrySdkInitialized()) return;` guards
grep -A2 "export function isTelemetrySdkInitialized" packages/core/src/telemetry/sdk.ts
```

---

## 12. The `@opentelemetry/api` Runtime Resolution Rule

**Problem**: TypeScript `tsconfig.json` `paths` entries (e.g., `"@opentelemetry/api": ["./src/telemetry/dummy-otel.ts"]`) only affect type-checking. They do **NOT** rewrite import specifiers in the compiled `.js` output. So after `tsc --build`, every `import { context } from '@opentelemetry/api'` in `.js` files stays as-is and will throw `ERR_MODULE_NOT_FOUND` at runtime if the real package is absent.

**Rule**: All source `.ts` files that import from `@opentelemetry/api` (or any other removed `@opentelemetry/*` package) MUST use **relative imports** pointing to the local dummy instead:

|Source file location|Correct import|
|---|---|
|`packages/core/src/telemetry/*.ts`|`import ... from './dummy-otel.js'`|
|`packages/core/src/core/*.ts`|`import ... from '../telemetry/dummy-otel.js'`|
|`packages/core/src/core/subdir/*.ts`|`import ... from '../../telemetry/dummy-otel.js'`|
|`packages/core/src/utils/*.ts`|`import ... from '../telemetry/dummy-otel.js'`|

**After every merge**, verify no stray `@opentelemetry` imports remain in non-test source:

```bash
grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" \
  | grep -v "\.test\." | grep -v "node_modules"
grep -rn "import('@opentelemetry" packages/core/src/ --include="*.ts" \
  | grep -v "\.test\." | grep -v "node_modules"
# BOTH must return zero lines. The first matches only `from '…'`; inline type
# references such as import('@opentelemetry/api').SpanContext are invisible to
# it and caused TS2307 in telemetry/session-tracing.ts for months before
# v0.23.0. Run both or the check is not a check.
```

esbuild (`npm run bundle`) correctly resolves `@opentelemetry/api` via root `tsconfig.json` paths during bundling, so the _bundle_ works even without this fix. But `npm start` (non-bundled mode) and any direct `node packages/core/dist/...` invocation will crash without it.

---

## 13. Telemetry Commits Can Change Control-Flow Timing — Verify TUI Behavior After Every Merge

Upstream telemetry fixes frequently change **control flow** (adding `await`, wrapping calls in `try/finally`, deferring callbacks) in order to keep trace spans open. These changes are invisible to the no-telemetry dummy layer — the spans are no-ops — but the **timing change itself survives the merge** and can break unrelated behavior. This is the most subtle post-merge failure mode after the `loggers.ts` rule (§11).

### The incident (v0.21.12 regression)

Upstream commit `43b0779bc fix(telemetry): Address main agent tracing edge cases (#9121)` changed the tool-result submission in `packages/cli/src/ui/hooks/use-llm-stream.ts` from fire-and-forget to awaited. The file was named `useGeminiStream.ts` when this incident was recorded; upstream #10124 renamed generic Gemini identifiers to Llm, so cite the new path or the grep silently matches nothing:

```ts
// before (v0.21.11): submission returns immediately
void submitQuery(responsesToSend, SendMessageType.ToolResult, promptId, {...});
// after (v0.21.13): submission blocks until the whole continuation stream ends
await submitQuery(responsesToSend, SendMessageType.ToolResult, promptId, {...});
```

The change was made so the main-agent trace span covers the full continuation stream. **Side effect**: `handleCompletedTools` (and therefore `CoreToolScheduler.onAllToolCallsComplete`) now stays pending for the entire continuation, so the scheduler's `notifyToolCallsUpdate([])` — which clears the completed tool calls from the live pending region — only fires **after** the stream ends. Meanwhile `addItem(toolGroupDisplay)` had already committed the tool group to Static history. Result: the completed tool group renders in **both** the Static scrollback and the live pending region for the whole stream → the TUI visibly duplicates the last tool block during RUN.

### The rule

When merging upstream telemetry commits, audit them for **control-flow changes**, not just telemetry calls:

- `void foo(...)` → `await foo(...)` (or any new `await` around an existing call)
- calls moved inside `try/finally` or `useEffect`/ref indirections
- callback resolution order changes (e.g., a notify/emit moved after an awaited callback)

Any of these can delay a state update that other code depends on, even with all telemetry no-op'd.

### The fix pattern (already applied — keep it on every merge)

The display-clear notification must fire **at the commit point**, not after the (potentially long) completion callback. In `packages/core/src/core/coreToolScheduler.ts`, `checkAndNotifyCompletion()` must call `notifyToolCallsUpdate()` right after `this.toolCalls = []` and **before** `await this.onAllToolCallsComplete(...)` (the `finally` block re-notifies afterwards to report any calls the continuation scheduled). If a merge removes or reorders this early notify, restore it.

### Verification checklist after every merge

```bash
# 1. The tool-result submission must not block the scheduler's display-clear.
#    (An `await` here is fine ONLY while the early notify in #2 is present.)
grep -n "submitQuery(responsesToSend, SendMessageType.ToolResult" packages/cli/src/ui/hooks/use-llm-stream.ts
# 2. The early display-clear notify must exist in the core scheduler:
grep -n "notifyToolCallsUpdate()" packages/core/src/core/coreToolScheduler.ts
#    It must appear BOTH right after `this.toolCalls = [];` in
#    checkAndNotifyCompletion AND in the finally block (2+ occurrences).
# 3. Regression test must exist:
grep -n "clears the live tool-call view before a slow completion callback" packages/core/src/core/coreToolScheduler.test.ts
```

**Manual smoke test** (interactive TUI): run a turn where a tool batch completes and the model continues streaming (e.g., a shell command with long output, then a follow-up reply). The completed tool block must appear **exactly once** — if it appears twice (once committed, once in the live region below the streaming answer), the early notify was lost in the merge.

---

## 19. MANDATORY: Tool-Result Clearing Is Off By Default (Non-Negotiable)

Upstream's microcompaction clears the **oldest** tool results in place once they pass a size threshold (500,000 characters) or after an idle gap (60 minutes). Clearing rewrites a message in the middle of the history, so a prefix-caching server (oMLX and other vLLM-style paged KV caches) re-prefills everything after it. Measured on 2026-11-10: one `[TOOL-RESULT MC]` event cleared 105 results starting at message 3 (~33k tokens in) of a ~400k-token conversation and forced a ~9-minute re-prefill. This is a **mandatory, non-removable patch** that applies to every merge.

**Rule**: both triggers default to `-1` (disabled). Users can still opt in through `context.clearContextOnIdle.toolResultsThresholdMinutes` and `...toolResultsTotalCharsThreshold`. An explicit setting always wins; only the default changes. Auto-compaction at the context window's auto threshold is unaffected.

|File|Ownership|Must contain|
|---|---|---|
|`packages/core/src/config/clearContextDefaults.ts`|Upstream|`[no-telemetry fork]` tag, `DEFAULT_TOOL_RESULTS_TOTAL_CHARS_THRESHOLD = -1` and `DEFAULT_TOOL_RESULTS_IDLE_MINUTES = -1`.|
|`packages/core/src/config/config.ts`|Upstream|`?? DEFAULT_TOOL_RESULTS_IDLE_MINUTES` where `clearContextOnIdle` is normalised (upstream has `?? 60`).|
|`packages/core/src/services/microcompaction/microcompact.ts`|Upstream|`?? DEFAULT_TOOL_RESULTS_IDLE_MINUTES` at both idle-threshold reads (upstream has `?? 60`).|
|`packages/cli/src/config/settingsSchema.ts`|Upstream|Schema defaults taken from the two constants, descriptions tagged `[no-telemetry fork]`.|

**Verify after every merge**:

```bash
grep -n "= -1;" packages/core/src/config/clearContextDefaults.ts   # 2 lines
grep -rn "?? 60" packages/core/src/services/microcompaction/microcompact.ts packages/core/src/config/config.ts | grep -i "threshold"   # zero lines
cd packages/core && npx vitest run src/config/config.test.ts -t "getClearContextOnIdle"
cd packages/cli && npx vitest run src/config/settingsSchema.test.ts
```

The two tests pin the defaults; a merge that restores `60` / `500_000` fails them. Tests changed for this patch: the `getClearContextOnIdle` default row and `should expose cumulative tool result threshold in clearContextOnIdle`.

**Conflict resolution**: keep upstream's refactor, re-apply the `-1` defaults. Never resolve by restoring the old defaults.

---

## 20. MANDATORY: Main-Chat Tool Declarations Are Built Outside Agent Frames (Non-Negotiable)

`LlmClient.setTools()` builds the main chat's tool declarations once and stores them in the chat. Some declarations depend on the model: `read_file`'s description is rebuilt from `Config.getEffectiveInputModalities()`, which goes through `getContentGeneratorConfig()` and therefore through the async-local runtime view that background and fast-model runs push (the #7156 leak class). Built inside such a frame, the declarations pick up **another model's modalities**: on 2026-11-10 `read_file` grew by exactly 474 characters (the audio/video paragraph) at a new user turn, 46k characters into the tool block, and the prefix cache was invalidated from there on.

**Rule**: the declaration build in `setTools()` goes through `runOutsideAgentContext(() => toolRegistry.getFunctionDeclarations())`, the same helper used for other main-session-owned work. The call site has no `[no-telemetry fork]` tag on purpose: the §14 hook count for `client.ts` is exact, so `npm run check:context` asserts the call itself instead.

|File|Ownership|Must contain|
|---|---|---|
|`packages/core/src/core/client.ts`|Upstream|`runOutsideAgentContext` imported from `agents/runtime/agent-context.js` and wrapped around `toolRegistry.getFunctionDeclarations()` inside `setTools()`.|
|`packages/core/src/core/client.test.ts`|Upstream|`builds the declarations outside any leaked agent frame`.|

**Verify after every merge**: see Section 3, item 18.

**Conflict resolution**: keep upstream's refactor of `setTools()` and re-apply the wrapper around the declaration build. Never drop it. If upstream makes `read_file` (or any declaration) independent of the async-local view, the wrapper becomes redundant but harmless.
