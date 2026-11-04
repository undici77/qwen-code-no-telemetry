---
paths:
  - "packages/core/src/memory/**"
  - "packages/core/src/core/client.ts"
  - "packages/core/src/core/openaiContentGenerator/converter.ts"
  - "packages/core/src/core/openaiContentGenerator/tool-turn-reminder-fold.ts"
description: No-telemetry fork §14 — with QWEN_MEMORY_APPEND_ONLY, memory saves and tool-turn reminders never rewrite cached prompt bytes
---

### Append-only auto-memory (§14) — prompt-cache preservation

A prefix-caching server (oMLX and other vLLM-style paged caches, DeepSeek/Qwen implicit caching, Anthropic `cache_control`) reuses its KV cache only up to the first differing token. Upstream #13521 already took the memory **index** out of the system prompt (`getAutoMemoryPrompt()` is policy-only; the catalog is an appended snapshot part). With `QWEN_MEMORY_APPEND_ONLY=1` this patch guards the rest:

1. The policy rides in the startup prelude, and `refreshMemoryInstruction()` never rewrites the system prompt.
2. A policy delta is delivered by `drainAutoMemoryDelta` at the next user query, never between a tool call and its result (`appendAutoMemoryDelta` only reloads from disk).
3. Qwen/DeepSeek-style templates render `<think>` only after the last user message, so the OpenAI converter's separate `role: "user"` message for injected context on a tool-result turn (catalog snapshot, todo reminder) drops every earlier step's reasoning and forces a re-prefill. `foldInjectedContextIntoToolMessage` appends that context to the last tool message instead. It is **all-or-nothing**: one text part that is not a snapshot or a `<system-reminder>` keeps the whole turn on the upstream path, because curated history can merge a real user prompt into the tool turn.

Off by default = byte-identical upstream behavior, OpenAI wire included. All logic lives in the fork-owned `memory/append-only-prompt-cache.ts` and `core/openaiContentGenerator/tool-turn-reminder-fold.ts`; upstream files carry only additive hooks tagged `// [no-telemetry fork]` in `memory/refresh.ts`, `core/client.ts`, `core/environmentContext.ts` and `core/openaiContentGenerator/converter.ts` — **grep that tag after every merge to find them all**. Invariants: `refreshMemoryInstruction()` stays the single chokepoint; `includeAutoMemoryReminder` defaults to `false` and only the three main-session call sites opt in (subagents never do); the custom-instruction branch of `client.ts` stays untouched; the fold never runs with the flag off or when tool media was split into a user message.
