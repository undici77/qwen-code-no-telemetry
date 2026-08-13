/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
/** An issue comment, as listed by `GET /issues/{n}/comments`. */
export interface RawIssueComment {
    id: number;
    user?: {
        login: string;
    } | null;
    body?: string | null;
    created_at?: string;
    updated_at?: string;
    html_url?: string;
}
export interface WindowWrites {
    /** Created inside the window by the reviewing account — the incident shape. */
    posted: RawIssueComment[];
    /** Created before the window but edited inside it. Reactions do NOT bump
     * an issue comment's `updated_at` (verified empirically), so an entry here
     * is a real body edit. */
    edited: RawIssueComment[];
}
/**
 * Issue-comment writes by the reviewing account inside the review window.
 *
 * `qwen review submit` is the ONLY sanctioned write in `/review`, and it
 * posts a *review* — never an issue comment. So an issue comment the
 * reviewing account created (or edited — the Step 7 ban covers edits too,
 * and `?since=` filters on `updated_at`, so edited rows are already in the
 * response) inside the window is a write that bypassed the submit gate,
 * something the user did by hand from another terminal, or another workflow
 * running under the same account; the warning below names all three
 * readings and lets the human decide. Zero overlap with sanctioned output
 * means zero correlation bookkeeping. Comments carrying this repo's own
 * automation marker are dropped: in CI the reviewing account IS the bot
 * that precheck/triage post from.
 *
 * This is a tripwire, not a wall. The gate itself lives in `submit` (it
 * refuses unauthorised posts), but a model that stops *calling* submit walks
 * around it — dogfooded: after four context compressions a run hand-posted
 * its summary with `gh pr comment`, printed no completion line, and nothing
 * anywhere noticed. Prose bans are exactly what compression loses, so the
 * detection has to live in the deterministic layer that always runs.
 */
export declare function findUnsanctionedIssueComments(comments: RawIssueComment[], reviewer: string, sinceIso: string): WindowWrites;
/** A review, as listed by `GET /pulls/{n}/reviews`. */
export interface RawReview {
    id: number;
    user?: {
        login: string;
    } | null;
    state?: string;
    submitted_at?: string;
    html_url?: string;
}
/**
 * Reviews the reviewing account submitted inside the window that the submit
 * receipt does not vouch for. Step 7's ban covers this channel too (`gh pr
 * review`, direct POSTs to `pulls/<n>/reviews`), and unlike issue comments
 * a review CAN legitimately appear here — the sanctioned submit posts one —
 * so sanctioned-vs-bypass is decided by id against the receipt submit wrote.
 * The receipt vouches for a SET of ids, not one: the window spans drift
 * restarts, so two sanctioned submits can fall in it, and excluding only the
 * last would flag the earlier legitimate review as a bypass. No receipt
 * vouches for nothing: with zero sanctioned writes recorded, every in-window
 * review by the account is flagged (fail-safe).
 */
export declare function findUnsanctionedReviews(reviews: RawReview[], reviewer: string, sinceIso: string, receiptReviewIds: ReadonlySet<number>): RawReview[];
export declare function runCleanup(target: string): void;
export declare const cleanupCommand: CommandModule;
