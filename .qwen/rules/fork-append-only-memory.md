---
paths:
  - "packages/core/src/memory/**"
  - "packages/core/src/core/client.ts"
description: No-telemetry fork §14 — append-only auto-memory keeps the index out of the system prompt tail
---

### Append-only auto-memory (§14) — prompt-cache preservation

Upstream carries the managed memory index in the **system prompt**, serialized ahead of the entire conversation, and `refreshMemoryInstruction()` — run by the background extraction agent **once per user turn** — rewrites that tail. That moves the first differing token in front of the whole transcript and forces a full re-prefill on any server that reuses a KV cache by longest-common-prefix (oMLX and other vLLM-style paged caches, DeepSeek/Qwen implicit prefix caching, Anthropic `cache_control`): one added index line costs a re-read of the entire history.

`QWEN_MEMORY_APPEND_ONLY=1` moves the index into the conversation instead — the full index rides in the startup prelude, later saves append a small delta at the END of history, and appending never changes an already-cached byte. Off by default = upstream behavior. All logic lives in the fork-owned `packages/core/src/memory/append-only-prompt-cache.ts`; upstream files carry only additive hooks tagged `// [no-telemetry fork]` in `memory/refresh.ts`, `core/client.ts` and `core/environmentContext.ts` — **grep that tag after every merge to find them all**. Invariants: `refreshMemoryInstruction()` stays the single chokepoint; `includeAutoMemoryReminder` defaults to `false` and only the three main-session call sites opt in (subagents never do); the custom-instruction branch of `client.ts` stays untouched; flag off ⇒ byte-identical upstream behavior.
