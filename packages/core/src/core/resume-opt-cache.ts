/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// No-telemetry fork patch — see NO_TELEMETRY_GUIDELINES.md §16 for why this
// exists and which upstream file it hooks into
// (`packages/core/src/core/environmentContext.ts`, `getInitialChatHistory`).

import type { Content } from '@google/genai';

/**
 * `getStartupContextLength` lives in (upstream-owned) environmentContext.ts,
 * which imports `reuseResumedPreludeIfUnchanged` from this module. Importing
 * it back here would form a module cycle — the same hazard documented in
 * NO_TELEMETRY_GUIDELINES.md §15 invariant 2 — so the caller injects it
 * instead (mirrors that section's `formatTokenCount` injection).
 */
export interface ResumeOptDeps {
  getStartupContextLength: (history: Content[]) => number;
}

export interface ResumeOptOptions {
  /**
   * Whether the caller's freshly-built prelude may carry a trailing
   * deferred-tools reminder part that this check must NOT compare (see the
   * module-level doc comment on `reuseResumedPreludeIfUnchanged`). Should be
   * the same `includeDeferredToolsReminder` flag the caller used to decide
   * whether to build that part in the first place.
   */
  toleratesTrailingDeferredToolsPart: boolean;
}

/**
 * Resuming a session (`--continue`/`--resume`, i.e. close-and-reopen): when
 * `extraHistory` already begins with a delivered startup prelude and its
 * stable part texts (MCP instructions, skills, memory, workspace/date) are
 * byte-for-byte identical to the freshly rebuilt ones (`freshStableTexts`,
 * always computed by the normal path in `getInitialChatHistory`), reuse the
 * existing entry instead of prepending the redundant rebuilt copy ahead of
 * it.
 *
 * Why: a prefix-caching backend (oMLX, other vLLM-style paged KV caches)
 * reuses cache blocks by exact longest-common-prefix from token 0.
 * Unconditionally prepending a freshly rebuilt prelude ahead of an
 * already-delivered one — even when the two are identical — makes the very
 * first tokens sent differ from the previous run (two prelude blocks
 * instead of one), discarding the whole cached prefix on every reopen even
 * when nothing changed.
 *
 * Why the deferred-tools tail is excluded from the comparison: that
 * reminder lists deferred tools NOT yet revealed, and it shrinks
 * monotonically over a session's life as tools get called (revealed) —
 * `LlmClient.revealDeferredToolsReferencedInHistory` re-reveals every
 * deferred tool ever called in the transcript BEFORE this comparison runs
 * on every resume. So for any session that has called even one deferred
 * tool (i.e. almost any real session), that tail legitimately differs from
 * what the very first, pre-any-reveal build produced — not because
 * anything the user cares about changed, but because of this intentional,
 * expected reveal mechanic. Comparing it would make reuse fire almost
 * never in practice. The tail is safe to leave untouched either way: it
 * only ever gets shorter, never reintroduces stale info, and any genuinely
 * NEW deferred tool is announced separately through the existing
 * mid-conversation "now available" delta reminders, never through the
 * prelude.
 *
 * Safety on the parts that DO get compared: this only ever *reuses*
 * content, never *suppresses* it. Nothing is skipped or guessed — the
 * normal build path in `getInitialChatHistory` always runs in full
 * (workspace scan, MCP instructions, skills, memory), so any real change
 * (an edited memory file, a new MCP server, a renamed skill, a folder
 * change, a date rollover) makes a stable text differ from the existing
 * entry and this returns `null`, falling through to the exact upstream
 * behavior: rebuild and prepend.
 *
 * Returns `null` when reuse does not apply — no `extraHistory`, no stable
 * texts to compare, `extraHistory`'s shape isn't a single delivered prelude
 * (a legacy ack-pair or a post-compression summary prefix both fail the
 * length-1 check on purpose), the stable texts don't match, or the
 * existing entry has more trailing parts than the (at most one) tolerated
 * deferred-tools part allows.
 */
export function reuseResumedPreludeIfUnchanged(
  extraHistory: Content[] | undefined,
  freshStableTexts: string[],
  options: ResumeOptOptions,
  deps: ResumeOptDeps,
): Content[] | null {
  if (!extraHistory || freshStableTexts.length === 0) {
    return null;
  }
  if (deps.getStartupContextLength(extraHistory) !== 1) {
    return null;
  }

  const existingTexts = (extraHistory[0].parts ?? []).map(
    (part) => part.text ?? '',
  );
  const allowedLengths = options.toleratesTrailingDeferredToolsPart
    ? [freshStableTexts.length, freshStableTexts.length + 1]
    : [freshStableTexts.length];
  if (!allowedLengths.includes(existingTexts.length)) {
    return null;
  }

  const stablePrefixMatches = freshStableTexts.every(
    (text, i) => existingTexts[i] === text,
  );
  if (!stablePrefixMatches) {
    return null;
  }

  return extraHistory;
}
