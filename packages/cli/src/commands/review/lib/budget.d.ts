/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** The size inputs the budget is derived from. */
export interface BudgetInput {
    /**
     * Diff lines in `source` files — the same number the topology gate turns on,
     * and for the same reason: test and prose lines inflate a diff without adding
     * anything for a reviewer to get wrong.
     */
    srcDiffLines: number;
    /** Total diff lines, including tests, prose and generated files. */
    diffLines: number;
}
export interface ReviewBudget {
    /**
     * How many of the low tier's directed angles to walk (Step 3C, A–F).
     *
     * Always at least 3, because the three that are always worth walking are the
     * ones defined by *how they walk* rather than by a topic — line-by-line,
     * removed behaviour, and the language's own pitfalls — and each is answerable
     * on a diff of any size. The rest earn their turn as there is more to see.
     */
    inlineAngles: number;
    /**
     * Does the low tier's gap sweep run?
     *
     * The sweep re-reads the diff as a fresh reviewer holding the deduplicated
     * list, hunting only for what is not on it. On a diff small enough to hold
     * entirely in view, a second reader of the same few hunks is the same reader:
     * there is no "what did the first pass not get to" when the first pass got to
     * all of it.
     */
    sweep: boolean;
    /**
     * The cap on Agent 8 diff-specialized finders (high effort only).
     *
     * Zero below the floor, and that is the substantive half of this field. A
     * specialist is launched when "one domain dominates the diff", which is a
     * judgement — and a judgement made about forty lines will find a dominant
     * domain every time, because forty lines are usually all one thing. Dominance
     * is only meaningful once there is enough code for a diff to have been about
     * several things and not be.
     */
    specialistCap: number;
    /**
     * Findings per Step 4 verification agent — `ceil(N / verifyShard)` agents.
     *
     * Flat by design; it is here so the number has one home rather than being
     * re-stated in the skill's prose and in whatever reads it. It is a property of
     * how much a verifier can re-trace before its quality collapses on the tail of
     * its list, which is a fact about the verifier and not about the diff.
     */
    verifyShard: number;
    /**
     * Soft tool-call ceiling baked into every finder/auditor brief — not the
     * verifier, whose load `verifyShard` already governs, and not Build & Test,
     * whose calls are deterministic commands.
     *
     * A fan-out wave's wall clock is its slowest agent, and the slowest agent
     * is reliably a wanderer: two measured runs of the SAME 14-agent wave took
     * 11.7 and 41 minutes, the difference being individual agents spending
     * 40-100 model calls exploring the tree, while healthy agents on
     * comparable diffs settle in the 25-45 range. The ceiling is SOFT: the
     * brief tells the agent to stop exploring at the budget, write its
     * findings from the evidence in hand, and disclose what it did not get to
     * — a disclosed gap feeds the whiff and receipt machinery; an undisclosed
     * crawl only feeds the wall clock.
     */
    agentToolBudget: number;
    /**
     * The reverse-audit loop's round cap: the full `MAX_REVERSE_AUDIT_ROUNDS`
     * normally, or a reduced `HUGE_REVERSE_AUDIT_ROUNDS` for a diff large
     * enough that the full loop cannot finish inside any budget.
     *
     * A reverse-audit round re-reads the whole diff against a growing
     * findings list, so its cost scales with the diff — measured at ~90
     * minutes a round on a 4,000-line PR, where the full five rounds alone
     * (450 min) exceed the six-hour CI ceiling before the fan-out and tail
     * are even counted. In a time-budgeted CI run the deadline gate already
     * refuses a round that will not fit; this static cap is the belt it works
     * under and the ONLY bound a local run (no deadline) has. Reduced to
     * three, not two — not because two cannot converge (the all-dry
     * rounds-1-and-2 shape reaches CONVERGED at the round-3 build under any
     * cap of two or more, since the convergence check runs before the cap
     * gate) but to buy hot chunks one extra audit round before the cap.
     *
     * The budget tunes how many rounds the loop runs, never whether it runs:
     * the reverse audit is a dimension of the high-effort contract. The CLI
     * only ever writes three or five here.
     */
    reverseAuditRounds: number;
}
/**
 * The reverse-audit loop's full round cap (SKILL.md Step 5's "stop at the
 * plan's `reverseAuditRounds` cap"). The normal value; a huge diff gets
 * `HUGE_REVERSE_AUDIT_ROUNDS` instead. `compose-review` imports it directly.
 */
export declare const MAX_REVERSE_AUDIT_ROUNDS = 5;
/**
 * The reduced cap for a huge diff — three, one audit round above the
 * convergence floor of two, spent on hot chunks before the cap stops the
 * loop. Not a convergability minimum: the all-dry rounds-1-and-2 shape
 * reaches CONVERGED under any cap of two or more, because the reverse
 * audit's convergence check runs before the round-cap gate.
 */
export declare const HUGE_REVERSE_AUDIT_ROUNDS = 3;
export declare const MIN_INLINE_ANGLES = 3;
export declare const MAX_INLINE_ANGLES = 6;
export declare const VERIFY_SHARD = 8;
/**
 * The floor is what a small diff's walk legitimately needs (brief + chunk
 * reads + a handful of enclosing-function reads and greps); the ceiling sits
 * above every healthy per-agent count measured on real reviews (25-45) and
 * below the wandering pathology (40-100+). One extra call per twenty
 * effective lines lets a larger territory earn a longer walk.
 */
export declare const MIN_AGENT_TOOL_BUDGET = 30;
export declare const MAX_AGENT_TOOL_BUDGET = 60;
/**
 * The review budget for a plan.
 *
 * Negative, non-finite and absent inputs all read as zero rather than throwing:
 * this is computed while a plan is being written, and a plan that fails to write
 * because a line count arrived as `NaN` costs the whole review, while a budget
 * that lands on its floor costs one under-walked small diff. It fails toward the
 * cheap end on purpose — the floors are the *minimum* work, not the maximum, so
 * a garbled input still walks three angles and still verifies.
 */
export declare function reviewBudget(input: BudgetInput): ReviewBudget;
/**
 * The reverse-audit round cap a plan's budget carries, for every reader
 * that enforces or narrates it (the admission gate and the cold-check
 * note, both in `agent-prompt`; the retirement scheduler deliberately
 * ignores the cap — whether a scheduled cold check is allowed is the note
 * composer's question, not the schedule's). A plan without the field — an
 * older CLI — or a garbled value reads as the full cap: an old plan errs
 * toward more auditing, never less, exactly like every other budget
 * fallback.
 *
 * The accepted range is floored at `HUGE_REVERSE_AUDIT_ROUNDS`, the
 * smallest cap the CLI ever writes. A value of one or two is out of band
 * (a hand-edited plan): honouring it would force a non-converged round-cap
 * stop where the full loop would have kept auditing, so it too falls back
 * to the full cap — never less.
 */
export declare function reverseAuditRoundCap(budget: unknown): number;
/**
 * The per-launch tool ceiling: the exploration allowance for this launch,
 * PLUS the launch's mandatory reads.
 *
 * Review findings shaped every term here. A whole-diff role on a
 * 25,000-line diff is ASSIGNED 63 chunk reads — a flat 60-call cap is
 * exhausted by the reading list before any analysis begins, so mandatory
 * reads ride on top of the allowance, never inside it. A scoped agent (one
 * chunk, one heavy file) inheriting the whole-diff ceiling keeps exactly
 * the wandering headroom the budget exists to cut, so a scoped launch's
 * allowance is derived from its own territory at the same rate. And the
 * plan's recorded number stays the authority for every launch — the skill
 * promises "every reader sees one number", so the scoped derivation may
 * only LOWER the plan's allowance, never raise it, and the plan's value is
 * clamped into the same [floor, ceiling] band in both directions: a
 * version-skewed or hand-edited plan carrying `0.5` or `100000` must not
 * become a three-call or a hundred-thousand-call brief.
 *
 * `territoryLines: null` is a whole-diff launch — no territory smaller
 * than the plan's, so the clamped plan allowance is used as-is.
 */
/**
 * The hard ceiling on the TOTAL a brief may state. The allowance is
 * clamped, but the reads term comes from the same unchecked-cast plan —
 * a garbled `chars` of 1e9 flowed through as a forty-thousand-call
 * brief, the exact number the clamp exists to make impossible. High
 * enough that no legitimate reading list reaches it (a 63-chunk 3B
 * fan-out with paged chunks and the findings list sits well under),
 * low enough that a garbled plan cannot erase the ceiling.
 */
export declare const MAX_TOTAL_TOOL_CALLS = 200;
export declare function launchToolBudget(planBudget: number, territoryLines: number | null, mandatoryReads: number): number;
/**
 * The disclosure marker ANYWHERE in a line — for the one consumer that
 * cannot rely on the own-line format: a receipt clause with the disclosure
 * appended after the separator (`No new issues found — …; Budget gap: X`)
 * would otherwise absorb the gap text as its own substance. The general
 * parser deliberately stays line-anchored (a mid-line mention is how the
 * format is QUOTED); this is only for cutting a clause, never for minting
 * gaps.
 */
export declare const INLINE_BUDGET_GAP_RE: RegExp;
/**
 * Every budget-gap disclosure in an agent's final return, sanitized for the
 * two places it lands: an operator's terminal (stderr NOTE) and the posted
 * review body. Dangerous codepoints are stripped, each gap is capped in
 * length (on code points) and the list in count, duplicates are folded
 * (an agent that states its gap mid-return and restates it in the summary
 * disclosed one gap, not two), and placeholder text (the brief's own
 * `<the check>` template, `none` in any punctuation) is dropped rather
 * than handed to the orchestrator as a gap to rule on.
 */
export declare function budgetGapDisclosures(finalText: string): string[];
/**
 * `finalText` with its budget-gap disclosure lines removed — what the
 * reverse-audit retirement judges a receipt on, so an agent's admission of
 * what it skipped can neither serve as the receipt's substance nor block a
 * receipt that is substantive without it.
 */
export declare function stripBudgetGapLines(finalText: string): string;
