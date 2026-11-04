# Prefix-Stable Tool Turns

[English](prefix-stable-tool-turns.md) | [简体中文](prefix-stable-tool-turns.zh-CN.md)

Status: implemented on branch `feat/prefix-stable-tool-turns` (no-telemetry fork, §14 extension). Verified by unit tests; live oMLX verification pending.

## Problem

In a long agentic turn on a local prefix-caching server (oMLX, vLLM), the server re-prefills most of the context several times per turn, typically right after each memory write. This happens even with `QWEN_MEMORY_APPEND_ONLY=1` and tool search disabled.

## Current state

- Upstream #13521 moved the memory index out of the system prompt. The catalog is now an appended "full snapshot" part (`memory/request-context.ts`), so memory writes no longer change the system prompt, the tool list or `history[0]`.
- On a tool-result turn, upstream appends injected context after the `functionResponse` parts: the catalog snapshot after a `MEMORY.md` change, the todo reminder every three tool turns, memory recall, and loop/exploration reminders.
- The OpenAI converter emits that text as a separate `role: "user"` message after the tool messages.
- Qwen/DeepSeek-style chat templates render `<think>` only for assistant messages after the last user message. A user message injected mid-turn therefore removes the reasoning of every earlier step of the turn from the rendered prompt. The first differing token moves back to the first assistant message of the turn, and the server re-prefills from there.
- The Anthropic converter does not have this problem: it already merges this text into the `tool_result` message.
- The fork's §14 delta was added with `addHistory` after a tool batch but before its responses were submitted, which put a user turn between a tool call and its result.

## Goals

- With `QWEN_MEMORY_APPEND_ONLY` set, the rendered prompt for tool step N+1 extends the one for step N, even when context is injected.
- With the flag unset, the OpenAI wire stays byte-identical to upstream.
- Never hide a real user prompt inside a tool result.

## Non-goals

- Reasoning loss across real user prompts. That is template behavior; a settings recipe (`preserve_thinking`) covers templates that support it.
- Delivering `QWEN.md` writes while the flag is on (follow-up).

## Design

### Fold injected context into the last tool message

`foldInjectedContextIntoToolMessage` (fork-owned, `core/openaiContentGenerator/tool-turn-reminder-fold.ts`) runs at the point where `processContent` would emit the trailing user message of a turn. It folds only when all of the following hold:

1. The flag is on.
2. The turn emitted at least one tool message.
3. No tool media was split into a follow-up user message.
4. Every text part is injected context: it carries `AUTO_MEMORY_SNAPSHOT_METADATA`, or it starts with `SYSTEM_REMINDER_OPEN`.

The texts are then appended to the last tool message (joined with `\n\n` for string content, or as text parts for array content), and no separate user message is emitted.

The rule is all-or-nothing because `extractCuratedHistory` merges consecutive user entries, so a prompt typed after an interrupt can share a turn with tool results. One unrecognised text part keeps the whole turn on the upstream path. The worst case is a missed cache win, never hidden user text.

### Deliver the §14 delta at the user-query boundary

`appendAutoMemoryDelta` now only reloads memory from disk. `drainAutoMemoryDelta` computes the delta and appends it. It is called from the existing `!hasPendingToolCall && (UserQuery || Cron)` drain block in `client.ts`, the same place upstream drains deferred MCP reminders. The delta therefore lands immediately before a real user prompt, which is already a template boundary.

## Decisions and rationale

| Decision                                              | Rationale                                                                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate on the existing `QWEN_MEMORY_APPEND_ONLY`        | One prompt-cache switch; flag off ⇒ upstream.                                                                                                               |
| Recognise only snapshots and `<system-reminder>` text | Zero false positives on user text; unwrapped upstream reminders keep the upstream behavior.                                                                 |
| Hook in the converter, not in history                 | History and recordings stay untouched; the fold is a pure, deterministic function of stored history, so every request serializes earlier turns identically. |
| `preserve_thinking` as documentation only             | It depends on the template; generic providers already merge `extra_body`.                                                                                   |

## Risks

- Models see some reminders inside a tool result instead of a user message. Upstream's Anthropic path already does this.
- If upstream changes a reminder's format, that reminder silently stops folding. The cost is cache only, not correctness. Pin tests cover the snapshot and the §14 delta.

## Validation

- Unit tests in `tool-turn-reminder-fold.test.ts`:
  - flag off
  - snapshot and reminder folding
  - parallel tool calls
  - `parts` and `string` tool formats
  - user text merged into a tool turn
  - split media
  - request N is a prefix of request N+1
  - §14 delta recognised
- `append-only-prompt-cache.test.ts`: refresh never appends; drain is cumulative and idempotent.
- `npm run check:context` pins the hook counts.
- Live: the E2E plan with the `cache-live` status item on oMLX.

## Acceptance criteria

- With the flag on, no `role: "user"` message follows tool messages on a turn whose text is all injected context.
- With the flag off, converter output is unchanged.
- The gate and the unit tests pass.

## Open questions

- Should a `QWEN.md` write be delivered as an appended delta while the flag is on? (Follow-up issue.)
