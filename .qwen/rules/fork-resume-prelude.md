---
paths:
  - "packages/core/src/core/resume-opt-cache.ts"
  - "packages/core/src/core/environmentContext.ts"
description: No-telemetry fork §16 — resumed prelude reuse, safe-only and automatic
---

### Resume prelude reuse (§16) — automatic, safe-only

Always on, no flag. `getInitialChatHistory()` rebuilds the startup prelude and prepends it fresh even on `--continue`/`--resume`, where the replayed transcript already starts with the _original_ prelude — so upstream produced `[newPrelude, oldPrelude, ...conversation]`, busting a prefix-caching backend's entire cached prefix on every reopen with nothing on disk changed. The fix **never skips the rebuild**: the full build (workspace scan, MCP instructions, skills, memory, deferred tools) always runs, so nothing is guessed. Only afterward does it compare the freshly rebuilt **stable** texts (MCP instructions, skills, memory, workspace/date) against the ones already in the resumed transcript, byte-for-byte: identical ⇒ reuse the existing entry; any real change ⇒ the exact unmodified upstream rebuild-and-prepend path.

The deferred-tools tail is deliberately **excluded** (the bug in this patch's first cut): `LlmClient.revealDeferredToolsReferencedInHistory` re-reveals every deferred tool ever called before every resume rebuild, so the tail legitimately shrinks after almost any real session. Safe to leave uncompared — it only ever shrinks, and a genuinely new deferred tool is announced through the existing mid-conversation delta reminders, never through the prelude.

All logic lives in the fork-owned `packages/core/src/core/resume-opt-cache.ts` (`reuseResumedPreludeIfUnchanged`); `core/environmentContext.ts` carries only an additive import, the `stableTexts`/`deferredToolsText` split and a post-build comparison call site tagged `// [no-telemetry fork]`. The fork module never imports back — `getStartupContextLength` is injected as a param, as in §15.
