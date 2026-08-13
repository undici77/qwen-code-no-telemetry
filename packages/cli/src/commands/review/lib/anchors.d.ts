/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type DiffFile } from './diff-plan.js';
/** One line of the post-change side of a file, as the diff renders it. */
export interface NewSideLine {
    /** 1-based line number in the post-change file. */
    newLine: number;
    /** The line's text, diff marker stripped. */
    text: string;
    /** True for a `+` line; false for an unchanged context line in the hunk. */
    added: boolean;
}
/**
 * How hard we had to work to match. Reported so the caller can see how much
 * the resolution leaned on normalisation rather than on the diff's own text.
 */
export type MatchTier = 
/** Byte-identical to added lines. What a well-formed anchor hits. */
'exact-added'
/** Byte-identical, but landed on context lines the hunk carries. */
 | 'exact-context'
/** Matched only after normalising indentation. */
 | 'loose-added' | 'loose-context';
export interface AnchorResolution {
    status: 'resolved' | 'unmatched';
    /**
     * The line to anchor a GitHub comment on: the **last** line of the matched
     * range. GitHub's inline comments hang off the end of a multi-line range
     * (`start_line` .. `line`), so a single-line anchor has `line === startLine`.
     */
    line?: number;
    startLine?: number;
    /** How many places in the file the snippet matched. >1 means it was ambiguous. */
    matchCount?: number;
    tier?: MatchTier;
    /**
     * True when the snippet matched more than once and the winner was picked by
     * proximity to the agent's claimed line (or, with no claim, by first-wins).
     * A caller that wants to be strict can treat this as "ask for a longer anchor".
     */
    ambiguous?: boolean;
    /**
     * How far the agent's claimed line was from where the snippet actually
     * starts. Non-zero means it miscounted. Useful to log, not to gate on.
     *
     * Measured against `startLine`, **not** `line`. An agent names the first line
     * of the code it is talking about; `line` is the *last* line of the match,
     * because that is where GitHub hangs a multi-line comment. Comparing the
     * claim to `line` scores a perfectly-counted three-line anchor as "off by
     * two" — which is not an agent error at all, it is the anchor's own length.
     * Measured that way, a dogfood run on PR #6754 reported 8 of 12 findings as
     * "corrected" when all 12 agents had in fact been exactly right.
     */
    drift?: number;
    /** Why an `unmatched` result did not resolve. */
    reason?: string;
}
/**
 * Extract the post-change lines a file's hunks render, with their real line
 * numbers.
 *
 * Deliberately re-walks the hunk bodies rather than teaching `parseDiff` to
 * collect text: `parseDiff` underwrites the chunk plan's tiling guarantee — the
 * thing that lets the review assert every line was assigned to some agent — and
 * that is not a function to grow a second reason to change. All the delicate
 * work (path quoting, `--- `/`+++ ` sequences appearing inside a hunk body) has
 * already happened by the time we have `file.hunks`; the body walk below needs
 * none of it.
 */
export declare function collectNewSideLines(diffText: string, file: DiffFile): NewSideLine[];
/**
 * Resolve one anchor snippet to a line range in the post-change file.
 *
 * `claimedLine` is the number the agent reported. It is never trusted as the
 * answer — it is used only to break a tie when the snippet genuinely appears
 * more than once (`}` on its own, a repeated `await tick()`), where "the one
 * nearest where the agent thought it was" beats "the first one in the file".
 */
export declare function resolveAnchor(newSideLines: NewSideLine[], anchor: string, claimedLine?: number): AnchorResolution;
export interface AnchorRequest {
    /** Caller's id, echoed back so findings can be re-joined. */
    id: string;
    /** Repo-relative path, as it appears in the diff. */
    path: string;
    /** Verbatim snippet of one or more consecutive lines from the diff. */
    anchor: string;
    /** The line the agent claimed. Tiebreak only; never the answer. */
    line?: number;
}
/**
 * The request, with the agent's claim renamed out of the way.
 *
 * `AnchorRequest.line` (what the agent said) and `AnchorResolution.line` (what
 * the diff says) are two different numbers, and this module exists precisely
 * because they disagree. Letting both occupy the key `line` would resolve the
 * collision by silently overwriting the claim with the answer — which reads
 * fine and destroys the one number that proves the correction happened.
 */
export type AnchorResult = Omit<AnchorRequest, 'line'> & {
    claimedLine?: number;
} & AnchorResolution;
/**
 * Resolve a batch of anchors against a captured diff.
 *
 * A path that is not in the diff at all is `unmatched` rather than an error:
 * "the agent filed a finding against a file this PR does not touch" is a real
 * and interesting outcome, and it is the caller's to report — not a reason to
 * abort every other finding in the batch.
 */
export declare function resolveAnchors(diffText: string, requests: AnchorRequest[]): AnchorResult[];
