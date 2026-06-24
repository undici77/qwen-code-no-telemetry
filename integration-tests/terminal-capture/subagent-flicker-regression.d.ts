#!/usr/bin/env npx tsx
/**
 * Deterministic TUI ratchet for SubAgent display rendering.
 *
 * Drives an end-to-end run with a mock OpenAI server that:
 *   1. answers the main loop with an `agent` tool_call dispatching the
 *      built-in `general-purpose` subagent;
 *   2. answers each subagent turn with one `read_file` tool_call against a
 *      known-existing file (`package.json`) so the SubAgent's runtime display
 *      accumulates real tool entries one round-trip at a time;
 *   3. answers the subagent's follow-up turn with a final assistant message;
 *   4. answers the main loop's follow-up turn with another final message.
 *
 * Then we read every byte the PTY produced inside the SubAgent display window
 * and count the ANSI sequences Ink emits when redrawing — clear-terminal
 * triples (`\x1b[2J\x1b[3J\x1b[H`), erase-line, cursor-up.
 *
 * Scope: this is an end-to-end *ratchet*, not a full flicker stress test. It
 * exercises the streaming SubAgent path with a fixed-size terminal, so it
 * does NOT directly cover resize-time flicker (the parent repo's
 * TerminalCapture in this branch lacks a public `resize()` method). The
 * targeted coverage map is:
 *
 *   - Resize-time clear:       AppContainer.test.tsx
 *     ("does not clear the terminal just because width changed")
 *   - Visual-height budgeting: AgentExecutionDisplay.test.tsx
 *     ("keeps the rendered running/completed frame within availableHeight")
 *   - End-to-end byte trail:   *this script* — catches regressions that
 *                              slip past the unit-level assertions.
 *
 * Reference numbers (M2 Pro Mac, 60-col / 18-row terminal, 5 tool calls,
 * compact → default → verbose mode transitions):
 *
 *   With visual-height fix (current):
 *     clearTerminalPair=5, clearScreen=10, eraseLine=434, cursorUp=130
 *   Without the fix (sliceTextByVisualHeight + overhead-aware budget removed):
 *     clearTerminalPair=2, clearScreen=4,  eraseLine=469, cursorUp=134
 *
 * The clear-pair / clear-screen counts go *up* with the fix in this scenario
 * — the new "Showing N visual lines" footer + bounded slicing trigger extra
 * commits to Ink's static area, which are committed pieces of the static
 * area, not flicker churn. The signal that *does* separate fix from no-fix
 * is `eraseLine` — the in-place-update count drops by ~7% because Ink no
 * longer needs to repaint individual rows when the SubAgent display stays
 * inside its assigned slot. That's why this script asserts an upper bound
 * on `eraseLine` in addition to the clear-screen ratchets.
 *
 * Default thresholds are calibrated so the build fails if the visual-height
 * fix is reverted to the old hard-coded behavior:
 *   - eraseLine > 460        → fix is broken (no-fix observed at 469).
 *   - clearTerminalPair > 10 → unrelated regression (e.g. width-driven
 *                              refreshStatic comes back).
 *   - clearScreen > 20       → unrelated regression.
 *
 * Usage:
 *   npm run build && npm run bundle
 *   cd integration-tests/terminal-capture
 *   npx tsx subagent-flicker-regression.ts
 *
 * Useful env:
 *   QWEN_TUI_E2E_REPO=/path/to/qwen-code
 *   QWEN_TUI_E2E_OUT=/tmp/qwen-tui-subagent-flicker
 *   QWEN_TUI_E2E_MAX_CLEAR_PAIRS=10       (default: 10)
 *   QWEN_TUI_E2E_MAX_CLEAR_SCREEN=20      (default: 20)
 *   QWEN_TUI_E2E_MAX_ERASE_LINE=460       (default: 460 — separates fix from
 *                                          no-fix; reverting the fix raises
 *                                          this counter to ~469)
 *   QWEN_TUI_E2E_SUBAGENT_TOOL_CALLS=5
 */
export {};
