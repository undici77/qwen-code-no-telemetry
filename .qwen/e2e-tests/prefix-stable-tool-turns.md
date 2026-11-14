# E2E: prefix-stable tool turns (§14)

Branch: `feat/prefix-stable-tool-turns`. Backend: oMLX (or vLLM) serving a Qwen3-family thinking model.

## Setup

- `bash local-install.sh` from the branch.
- `ui.statusLine.items` includes `context-tokens`, `cache-live`, `cache-hit`.
- Request capture: `qwen --openai-logging --openai-logging-dir /tmp/qwen-req`.

## Cases

| #   | Steps                                                                                                                              | Expect                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `QWEN_MEMORY_APPEND_ONLY=1`; one prompt that reads 5+ files then writes 2 memories in the same turn                                | `cache-live` stays high on every step after a memory write; `python3 -I .qwen/scripts/render-prefix-lcp.py /tmp/qwen-req <model>/chat_template.jinja` prints `prefix ok` on every main request |
| 2   | Same as 1 with a todo list active (todo reminder every 3 steps)                                                                    | Same as 1                                                                                                                                                                                      |
| 3   | Same prompt with the flag unset (baseline)                                                                                         | Script prints `DIVERGED` right after each memory write; `cache-live` drops — confirms the baseline the fix targets                                                                             |
| 4   | Flag on; interrupt a running tool (Esc), then type a new prompt                                                                    | The new prompt reaches the model as a `role: "user"` message (inspect the logged request), never inside a tool message                                                                         |
| 5   | Flag unset; diff a logged request body against `main` for the same history                                                         | Byte-identical                                                                                                                                                                                 |
| 6   | Flag on; change memory policy (switch recall mode) mid-session, then send a prompt                                                 | The `Managed memory changed` reminder appears right before that user prompt, not between a tool call and its result                                                                            |
| 7   | Optional: add `"extra_body": {"chat_template_kwargs": {"preserve_thinking": true}}` on a Qwen3.6+ model; two user prompts in a row | First step of the second prompt keeps a high `cache-live`; the logged request carries `preserve_thinking: true`                                                                                |
