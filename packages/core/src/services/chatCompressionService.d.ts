/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, GenerateContentConfig } from '@google/genai';
import type { Config } from '../config/config.js';
import type { GeminiChat } from '../core/geminiChat.js';
import { type ChatCompressionInfo } from '../core/turn.js';
/**
 * Hard cap on compression generation. The cold path asks providers to omit
 * returned thoughts. The cache-sharing path preserves Anthropic's
 * cache-sensitive thinking setting and makes the same returned-thought request
 * for Google GenAI. On Google this does not disable thinking or prevent its
 * tokens from sharing the output budget. Mirrors claude-code's
 * MAX_OUTPUT_TOKENS_FOR_SUMMARY (autoCompact.ts:30), which is based on p99.99
 * of real compaction outputs.
 */
export declare const COMPACT_MAX_OUTPUT_TOKENS = 20000;
/**
 * Default proportional auto-compaction threshold — the preferred trigger and an
 * upper bound on how high it can sit. See computeThresholds for how it combines
 * with the absolute ceiling (it governs large windows; the ceiling governs
 * smaller ones).
 */
export declare const DEFAULT_PCT = 0.85;
/**
 * Token budget reserved from the window for compression output. Matches
 * COMPACT_MAX_OUTPUT_TOKENS, the hard provider output ceiling for both
 * compression request shapes.
 */
export declare const SUMMARY_RESERVE = 20000;
/**
 * Distance between auto threshold and effectiveWindow. Matches claude-code's
 * AUTOCOMPACT_BUFFER_TOKENS (autoCompact.ts:62) — empirically chosen to leave
 * headroom for the compaction sideQuery round-trip plus a few user-message
 * turns before the window saturates.
 */
export declare const AUTOCOMPACT_BUFFER = 13000;
/**
 * Distance between warn threshold and auto threshold. Matches claude-code's
 * WARNING_THRESHOLD_BUFFER_TOKENS (autoCompact.ts:63) — sized so the warn
 * tier fires a couple of turns before auto-compaction in practice.
 */
export declare const WARN_BUFFER = 20000;
/** Distance between hard threshold and effectiveWindow (matches claude-code's MANUAL_COMPACT_BUFFER). */
export declare const HARD_BUFFER = 3000;
/**
 * Auto-compaction consecutive-failure circuit breaker. After this many
 * consecutive failures the cheap-gate NOOPs until a successful force
 * compress resets the counter. Co-located here with other compaction-
 * tuning constants; the counter state itself lives on GeminiChat.
 */
export declare const MAX_CONSECUTIVE_FAILURES = 3;
/**
 * Hard cap on the PreCompact hook's `additionalContext` once it is merged
 * into the side-query system prompt. The user-supplied `/compress` text is
 * already capped at `MAX_COMPRESS_INSTRUCTIONS_CHARS` (2000) in
 * compressCommand.ts for exactly this reason — the side-query has no
 * input-truncation retry, so an unbounded hook payload could inflate the
 * prompt and trigger a PTL the compaction path can't recover from. Hooks
 * may legitimately concatenate context across several scripts, so this cap
 * is set higher than the user-text cap.
 */
export declare const MAX_HOOK_INSTRUCTIONS_CHARS = 4000;
export interface CompactionThresholds {
  /** Token count at which UI warn tier triggers. */
  readonly warn: number;
  /** Token count at which auto-compaction triggers. */
  readonly auto: number;
  /** Token count at which auto-compaction is force-triggered (bypasses the consecutive-failure breaker). */
  readonly hard: number;
  /** Window minus SUMMARY_RESERVE; the budget available for input + summary. */
  readonly effectiveWindow: number;
}
/**
 * Compute the three-tier threshold ladder for a given context window.
 *
 * The absolute term (effectiveWindow - AUTOCOMPACT_BUFFER) is a *ceiling* —
 * "compact by here, or the summarization side-query has no room to run" — so
 * it is combined with the proportional preference via `min`, not `max`:
 *   auto = absoluteCeiling > 0 ? min(pct * window, absoluteCeiling) : pct * window
 *   warn = max(0, auto - WARN_BUFFER)
 *   hard = min(window, max(effectiveWindow - HARD_BUFFER, auto + HARD_BUFFER))
 *
 * So large windows compact at ~pct (never crowding the ceiling), smaller
 * windows compact at the ceiling (leaving room for the summary), and a window
 * too small for even the ceiling (≤ SUMMARY_RESERVE + AUTOCOMPACT_BUFFER) falls
 * back to the proportional value as a floor. This mirrors claude-code
 * (autoCompact.ts), which combines its percentage override with the absolute
 * ceiling via Math.min. `pct` defaults to DEFAULT_PCT.
 *
 * Pure function — no I/O, no shared state — safe to call repeatedly.
 */
export declare function computeThresholds(
  window: number,
  pct?: number,
): CompactionThresholds;
export type CompactTrigger = 'manual' | 'auto';
export interface CompressOptions {
  promptId: string;
  force: boolean;
  config: Config;
  /**
   * Number of consecutive auto-compaction failures for this chat. When it reaches
   * MAX_CONSECUTIVE_FAILURES, the cheap-gate stops trying until a successful
   * force=true call resets it.
   */
  consecutiveFailures: number;
  /**
   * Most recent prompt token count for this chat. Compared against
   * `computeThresholds(contextWindowSize).auto` for the auto-compaction
   * gate, optionally augmented by the pending user message's estimated
   * token count via `estimatePromptTokens` (see Task 3 / Task 6). Callers
   * source this from the per-chat counter (main session, subagents alike) —
   * the service does not read or write any global telemetry.
   */
  originalTokenCount: number;
  /**
   * Hook trigger to report for this compression. `force=true` bypasses the
   * threshold gate but does not always mean the user manually requested
   * compaction; reactive overflow recovery is forced but still automatic.
   */
  trigger?: CompactTrigger;
  signal?: AbortSignal;
  /**
   * Pending user message about to be sent. When present, the cheap-gate
   * adds its estimated token count to `originalTokenCount` (which reflects
   * only the prior turn's API usage) so the gate sees the real prompt size.
   * Optional for backward compatibility with callers that don't have a
   * user message in hand (e.g. manual /compress force=true paths).
   */
  pendingUserMessage?: Content;
  /**
   * Pre-computed all-inclusive effective-token count. This is normally from
   * `estimatePromptTokens()`, or from a provider-reported count after reactive
   * overflow. When provided, the cheap-gate skips its estimation pass and the
   * cache-sharing preflight does not add the previous model output again.
   */
  precomputedEffectiveTokens?: number;
  /** Per-request overrides used by the main turn, including transient tools. */
  requestGenerationConfig?: GenerateContentConfig;
  /**
   * User-supplied focus directives passed to the compression side-query.
   * Appended to the system prompt as an `Additional Instructions:` block.
   * Sourced from `/compress <text>`. PreCompact hooks may further append
   * `additionalContext` via `hookSpecificOutput`; user text always comes
   * first, hook text last (matches claude-code mergeHookInstructions).
   */
  customInstructions?: string;
}
export declare class ChatCompressionService {
  compress(
    chat: GeminiChat,
    opts: CompressOptions,
  ): Promise<{
    newHistory: Content[] | null;
    info: ChatCompressionInfo;
  }>;
}
