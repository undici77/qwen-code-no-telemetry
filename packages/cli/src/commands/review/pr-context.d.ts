/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import { type Ledger } from './lib/ledger.js';
/**
 * Marker embedded in the "suggestion summary" issue comment that /review used
 * to publish before Suggestion-level findings moved to inline comments.
 *
 * No new summaries are created, but PRs reviewed under the old scheme still
 * carry one. It must keep being recognised so it can be excluded from the
 * "Already discussed" section — otherwise a stale table of suggestions would
 * read as settled discussion and suppress still-open findings.
 */
export declare const SUMMARY_MARKER = '<!-- qwen-review-suggestion-summary -->';
export interface PrMetadata {
  title: string;
  body: string | null;
  author: {
    login: string;
  } | null;
  baseRefName: string;
  headRefName: string;
  headRefOid: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  state: string;
}
export interface RawComment {
  id: number;
  user?: {
    login: string;
  };
  body?: string;
  path?: string;
  line?: number;
  in_reply_to_id?: number;
}
export interface RawReview {
  id: number;
  user?: {
    login: string;
  };
  body?: string;
  state?: string;
  submitted_at?: string;
}
/**
 * True for a legacy suggestion-summary issue comment, whoever authored it.
 *
 * Authorship is deliberately NOT checked. These summaries were posted by
 * whichever identity ran `/review` — a maintainer locally, or the CI bot in
 * the review workflow — so an author check against the *current* user would
 * miss the ones the other identity left behind, and those would then land in
 * the "Already discussed" section and suppress still-open findings.
 *
 * Matching on the marker alone is also the safer direction: the marker used
 * to promote a comment INTO a trusted rendering section, which is why it was
 * author-gated. It now only excludes a comment, so a third party embedding
 * the marker verbatim merely hides their own text from the review agents —
 * they cannot add it to someone else's comment. Kept pure for unit testing.
 */
export declare function isLegacySuggestionSummary(
  body: string | undefined,
): boolean;
/**
 * Repo coordinates for building refetch refs. When provided, emitted refs
 * are copy-runnable commands with real values. The placeholder fallback
 * exists for direct helper calls in tests — `gh api` substitutes only
 * `{owner}`/`{repo}` (and from the CURRENT directory's repo, which in
 * cross-repo lightweight mode is the wrong one), and passes `{n}` through
 * literally, so a machine-generated ref must not rely on placeholders.
 */
interface RefContext {
  ownerRepo?: string;
  prNumber?: string;
}
/** Cap a full review body; the cut names the review id so the tail stays fetchable. */
export declare function fullBody(
  s: string | undefined,
  id?: number,
  ctx?: RefContext,
): string;
/** Cap a full inline-comment body; the cut names the comment id. */
export declare function fullCommentBody(
  s: string | undefined,
  id?: number,
  ctx?: RefContext,
): string;
/** Cap a full issue-comment body; the cut names the issue-comment id. */
export declare function fullIssueCommentBody(
  s: string | undefined,
  id?: number,
  ctx?: RefContext,
): string;
export declare function extractCodeRefs(body: string | undefined): string[];
export declare function carriesBlockerSignal(body: string | undefined): boolean;
/**
 * Walk a comment's `in_reply_to_id` chain up to the root. Defends against
 * cycles (which shouldn't happen on GitHub but cheap to handle).
 *
 * Exported and generic: `comment-status` groups the same flat comment list
 * into the same threads, and a shared walk is what keeps the two surfaces
 * agreeing by construction — a cycle-guard fix applied to one private copy
 * and not the other would silently diverge their thread classification.
 */
export declare function findRootId<
  T extends {
    id: number;
    in_reply_to_id?: number | null;
  },
>(startId: number, byId: Map<number, T>): number;
/**
 * The exact "no issues found, LGTM" template the qwen-review pipeline
 * auto-emits, optionally followed by its model footer — and NOTHING else.
 * Anchored to the end of the body on purpose: a legacy malformed review can
 * OPEN with the LGTM line and carry a relocated `**[Critical]**` blocker
 * below it, and a prefix match dropped exactly that body from the context
 * file, letting the re-check approve past the blocker.
 */
export declare const CANONICAL_LGTM_RE: RegExp;
/**
 * Should this review-level summary be shown to agents?
 *
 * Filters out empty bodies (`COMMENTED` reviews submitted alongside inline
 * comments often have body=""), and the canonical "no issues found, LGTM"
 * template the qwen-review pipeline auto-emits — those carry no review
 * content beyond their state, which the agent doesn't need re-told. Only
 * the whole-body template is filtered; any body with more in it is shown.
 */
export declare function isReviewWorthShowing(body: string | undefined): boolean;
export interface InlineThreads {
  openRoots: RawComment[];
  openBlockerRoots: RawComment[];
  repliedBlockerRoots: RawComment[];
  repliedRoots: RawComment[];
  repliesByRoot: Map<number, RawComment[]>;
}
/**
 * Group the flat inline-comment list into threads and classify each root.
 * The single copy of this walk: `buildMarkdown` renders from it and the
 * stdout summary counts from it, so the reported count can never diverge
 * from what the file contains.
 */
export declare function classifyInlineThreads(
  inline: RawComment[],
): InlineThreads;
/**
 * The latest machine ledger the REVIEWING account itself posted, if any.
 *
 * Own-account only: the ledger claims "these are the findings the previous
 * /review round stood behind", and only this account's reviews can make that
 * claim. Another user's marker — pasted, forged, or their own tooling's — is
 * data about THEIR review, not ours, and is ignored rather than trusted.
 * Latest by submitted_at wins: each posted round embeds a fresh full copy.
 * Ties — same second, or both timestamps missing — break on the review id,
 * which is monotonic: keeping the earlier review on a tie would hand the next
 * round the older work list, the one failure this whole recovery exists to
 * prevent.
 */
export declare function latestOwnLedger(
  reviews: RawReview[],
  login: string | null,
): Ledger | null;
/** Render the previous round's ledger for the context file. */
export declare function renderLedgerSection(ledger: Ledger): string;
export declare function buildMarkdown(
  prNumber: string,
  ownerRepo: string,
  meta: PrMetadata,
  inline: RawComment[],
  issue: RawComment[],
  reviews: RawReview[],
  prevLedger?: Ledger | null,
): string;
/**
 * Headings that begin past `truncateToolOutputThreshold`, which `read_file` will
 * not return on a single read. Reordering buys headroom; it does not create it.
 */
export declare function truncatedHeadings(
  markdown: string,
  limit: number,
): Array<{
  offset: number;
  heading: string;
}>;
export declare const prContextCommand: CommandModule;
export {};
