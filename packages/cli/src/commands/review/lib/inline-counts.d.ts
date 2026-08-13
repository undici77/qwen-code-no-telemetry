/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** The severity prefixes the skill mandates on every posted inline comment. */
export declare const CRITICAL_PREFIX = "**[Critical]**";
export declare const SUGGESTION_PREFIX = "**[Suggestion]**";
/** A drafted inline comment, as far as counting needs it. */
export interface DraftedComment {
    body?: unknown;
}
/**
 * Which severity marker a drafted comment opens with — or null for neither.
 *
 * The ONE statement of the predicate. The counter and the unmarked-scan each
 * restated it at first, and drift between restatements is exactly the
 * bug-class this file's header describes; every caller classifies through
 * here so the two can never disagree about what "marked" means.
 */
export declare function severityOf(c: DraftedComment): 'critical' | 'suggestion' | null;
/** How many drafted comments open with each severity marker. */
export declare function countInlineFindings(comments: readonly DraftedComment[]): {
    criticalsInline: number;
    suggestionsInline: number;
};
/**
 * The indices of drafted comments that open with NEITHER severity marker.
 *
 * `countInlineFindings` counts such a comment as nothing at all — which for a
 * verdict computation means a blocker written without its marker weighs zero.
 * Both boundaries refuse these outright instead: `compose-review` because
 * Step 6 is where the draft is still cheap to fix, and `submit` because the
 * skill's own re-compose instruction expects the set to churn after Step 6 —
 * a marker lost in that churn would otherwise reach the one boundary that
 * actually posts, and weigh zero there.
 */
export declare function unmarkedComments(comments: readonly DraftedComment[]): number[];
