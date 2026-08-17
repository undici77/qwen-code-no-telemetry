/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * PR-G — Adapter conformance framework.
 *
 * Lets any daemon-ui adapter (TUI / web / IDE / channel / mobile) validate
 * that it projects a fixed corpus of daemon SSE event streams to the same
 * semantic shape. Catches drift early — when adapter authors implement
 * `reduce` + `render` themselves, this framework asserts the result matches
 * the SDK's reference projection.
 *
 * ## Adapter contract
 *
 * Implement `DaemonUiAdapterUnderTest`:
 *
 *   - `reduce(events)`: take a list of normalized UI events and produce
 *     adapter-specific state (any shape).
 *   - `renderToText(state)`: collapse that state to a plain-text string
 *     for semantic comparison. **Format-agnostic** — assertion is on text
 *     content, not on HTML / ANSI / markdown specifics.
 *
 * Adapters are free to use richer outputs (HTML, ANSI, JSX) — the test
 * framework only checks that the *semantic content* matches the reference.
 *
 * ## Usage (in adapter test file)
 *
 * ```ts
 * import { runAdapterConformanceSuite } from '@qwen-code/sdk/daemon';
 * import { reduceForTui, renderTuiState } from './my-tui-adapter';
 *
 * const result = runAdapterConformanceSuite({
 *   reduce: reduceForTui,
 *   renderToText: renderTuiState,
 * });
 * expect(result.failed).toEqual([]);
 * ```
 *
 * Or run a single fixture:
 *
 * ```ts
 * const fx = DAEMON_UI_CONFORMANCE_FIXTURES.find((f) => f.name === 'simple-chat');
 * const out = adapter.renderToText(adapter.reduce(fx.events));
 * for (const phrase of fx.expectedContains) expect(out).toContain(phrase);
 * for (const phrase of fx.expectedAbsent ?? []) expect(out).not.toContain(phrase);
 * ```
 */
import type { DaemonUiEvent } from './types.js';
export interface DaemonUiAdapterUnderTest {
  /**
   * Reduce a sequence of normalized UI events into adapter-specific state.
   * The state shape is opaque to the framework — only `renderToText` is
   * inspected.
   */
  reduce(events: readonly DaemonUiEvent[]): unknown;
  /**
   * Project the reduced state to a single plain-text string for semantic
   * comparison. **Implementation choices**:
   *
   * - Strip ANSI / HTML / markdown delimiters so assertions are
   *   format-agnostic
   * - Concatenate blocks with reasonable separators (e.g., `\n\n`)
   * - Include tool titles, status, permission outcomes, error text
   * - Skip debug / status blocks if your renderer hides them
   */
  renderToText(state: unknown): string;
}
/**
 * One fixture: a recorded sequence of daemon envelopes paired with the
 * semantic content any conforming adapter must surface (and optionally
 * content it MUST NOT surface, for forward-compat guard fixtures).
 */
export interface DaemonUiConformanceFixture {
  /** Human-readable name for test output. */
  name: string;
  /**
   * One-line description — what scenario the fixture exercises.
   */
  description: string;
  /**
   * Raw daemon envelopes. These get fed through `normalizeDaemonEvent` to
   * produce the `DaemonUiEvent[]` passed to the adapter's `reduce`.
   */
  envelopes: ReadonlyArray<{
    id?: number;
    v: 1;
    type: string;
    data: unknown;
    originatorClientId?: string;
    _meta?: Record<string, unknown>;
  }>;
  /**
   * Substrings the rendered output MUST contain. Each is asserted
   * independently; partial matches are OK. Use these for content-level
   * assertions ("transcript shows 'hello world'", "tool block shows
   * 'completed'").
   */
  expectedContains: readonly string[];
  /**
   * Substrings the rendered output MUST NOT contain. Use for guard
   * fixtures: "secret token must not leak", "raw event data must not
   * be dumped on malformed payload".
   */
  expectedAbsent?: readonly string[];
  /**
   * Optional normalization options forwarded to `normalizeDaemonEvent`.
   */
  normalizeOptions?: {
    clientId?: string;
    suppressOwnUserEcho?: boolean;
    includeRawEvent?: boolean;
  };
}
export interface ConformanceFailure {
  fixture: string;
  missingPhrases: readonly string[];
  leakedPhrases: readonly string[];
  /** Truncated rendered output for diagnosis. */
  renderedExcerpt: string;
}
export interface ConformanceSuiteResult {
  passed: number;
  failed: ConformanceFailure[];
  total: number;
}
export interface RunConformanceOptions {
  /** Specific fixtures to run; omitted = all. */
  only?: readonly string[];
  /** Skip these fixture names. */
  skip?: readonly string[];
}
/**
 * Run the built-in fixture corpus against an adapter and return per-fixture
 * pass/fail. **Does not throw** — caller asserts on `result.failed`.
 */
export declare function runAdapterConformanceSuite(
  adapter: DaemonUiAdapterUnderTest,
  opts?: RunConformanceOptions,
): ConformanceSuiteResult;
/**
 * Built-in conformance fixtures. Adapter authors run these against their
 * `reduce` + `renderToText` to catch projection drift before it reaches
 * users.
 *
 * Categorized:
 * - **chat**: basic user/assistant/thought flow
 * - **tool**: tool call lifecycle with preview projection
 * - **permission**: permission request + resolution
 * - **mcp**: MCP-specific events (budget warning, restart)
 * - **auth**: device-flow lifecycle
 * - **multimodal-text-only**: forward-compat hint — multimodal not yet
 *   wired (see TODO)
 * - **trim**: long-session block trim behavior
 * - **redaction**: malformed payloads must not leak raw fields
 */
export declare const DAEMON_UI_CONFORMANCE_FIXTURES: readonly DaemonUiConformanceFixture[];
