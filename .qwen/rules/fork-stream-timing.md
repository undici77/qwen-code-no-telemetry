---
paths:
  - "packages/cli/src/ui/hooks/use-llm-stream.ts"
  - "packages/core/src/core/coreToolScheduler.ts"
description: No-telemetry fork §13 — telemetry commits can change control-flow timing
---

### Telemetry commits can change control-flow timing (§13)

Upstream telemetry fixes often add `await`/`try-finally` just to keep a trace span open; the span is a no-op here, but the **timing change survives the merge**. Incident (v0.21.12): upstream `#9121` changed the tool-result submission in `packages/cli/src/ui/hooks/use-llm-stream.ts` (named `useGeminiStream.ts` until the #10124 identifier rename) from `void submitQuery(...)` to `await submitQuery(...)`, delaying `CoreToolScheduler`'s `notifyToolCallsUpdate([])` until the continuation stream ended → the completed tool group rendered in both Static and the live region (TUI duplication during RUN). On every merge, audit telemetry commits for `void` → `await` / callback-ordering changes; `check:context` verifies `checkAndNotifyCompletion` clears `toolCalls` and notifies _before_ the awaited `onAllToolCallsComplete`, re-notifies in `finally`, and that the regression test "clears the live tool-call view before a slow completion callback resolves" still exists.
