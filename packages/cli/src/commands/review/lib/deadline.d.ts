/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Unix seconds at which the review process will be killed. Set by CI. */
export declare const DEADLINE_ENV = "QWEN_REVIEW_DEADLINE_EPOCH";
/** Override for the tail reserve, in seconds. */
export declare const RESERVE_ENV = "QWEN_REVIEW_DEADLINE_RESERVE_SECONDS";
/**
 * What must still fit after the last reverse-audit round completes: the
 * verification of that round's findings, compose-review, anchor resolution
 * and the submission itself.
 *
 * Under the pipelined loop (SKILL.md Step 5), a round's verification
 * launches WITH the next round's auditors instead of sitting between
 * admissions — so the admission-to-admission span the gate measures
 * contains no verification pass, and the terminal round's verification has
 * exactly one cover: this reserve. That makes the reserve's sizing the
 * whole margin, not a top-up on an overlap the measurement already
 * carried — so the estimate refuses to be optimistic too: it prices the
 * round from the COSTLIEST span the run has measured (see
 * `expectedRoundSeconds`), because round costs do not climb smoothly —
 * each round re-reads the diff against a longer findings list, and a
 * repair relaunch lands mid-loop and makes one round the expensive one —
 * and the newest span alone under-predicts the next in exactly the runs
 * that end near the boundary. Over-reserving ends the loop at most one
 * round early, disclosed as a budget stop; under-reserving is #8368 —
 * killed mid-verification, holding every confirmed finding.
 *
 * Sized from the only tail measurement the record holds (#8368, +1699
 * lines): the loop ended with half an hour left and the outer kill found
 * round 5's verification STILL RUNNING — the tail had consumed more than 30
 * minutes and was nowhere through (compose, anchor resolution and
 * submission never started). No upper bound was ever measured, so the size
 * is insurance, not arithmetic: pipelining made this reserve the terminal
 * round's ONLY cover, and until pipelined runs measure their tails, the
 * reserve buys the unknown, not the known. Over-reserving ends the loop at
 * most one round early, disclosed as a budget stop; under-reserving is
 * #8368.
 *
 * This is only the fallback: the budget itself is
 * chosen outside the CLI (a repository variable, a workflow input, a
 * `/review --timeout=N` comment), so the review workflow passes a reserve
 * scaled to the budget it resolved rather than trusting this constant to fit
 * an arbitrary one. The workflow caps that scaled reserve at this same
 * number (`.github/workflows/qwen-code-pr-review.yml`) — keep the two in
 * sync. A local run has no deadline and no reserve at all.
 */
export declare const DEFAULT_RESERVE_SECONDS = 4800;
/**
 * The slice of the tail that composing and submitting a review need on
 * their own, with no verification in it. The reserve above covers the
 * terminal round's verification PLUS this; a review that stops verifying at
 * this boundary still composes and posts everything it has proved.
 *
 * A distinct, smaller floor exists because the two costs fail differently.
 * A round's verification scales with its finding count and — on a security
 * PR whose findings are shell/git bypasses re-checked with real filesystem
 * E2E — with the per-finding cost, without bound; compose-review is one CLI
 * call and the submission a handful of `gh` calls, both bounded. So the
 * verification is what a wall runs into, and the fix is to gate the
 * VERIFIER on this floor: below it, no verify shard is built, the
 * findings in hand keep their `— [unverified]` tag (compose-review caps the
 * verdict on it), and compose still runs. Measured: PR #8687, a 4 269-line
 * cross-worktree git guard, ran the audit to a correct budget stop with
 * ~110 minutes left, then a single hand-rolled re-verification agent
 * re-running a 15-family bypass battery with real bash+git consumed all of
 * it — the wall hit mid-verification, compose never ran, and ~20
 * E2E-confirmed Critical bypasses were never posted. Twenty minutes is
 * insurance sized like the reserve, not arithmetic: compose + anchor
 * resolution + submit has no measured upper bound, and over-reserving only
 * ends verification a shard early, disclosed as an unverified tag.
 */
export declare const DEFAULT_COMPOSE_FLOOR_SECONDS = 1200;
/** Override for the compose floor, in seconds. */
export declare const COMPOSE_FLOOR_ENV = "QWEN_REVIEW_DEADLINE_COMPOSE_FLOOR_SECONDS";
/**
 * The admission estimate for a round nothing has measured yet — round 1, or
 * a record dir that lost its stamps. Thirty minutes covers a measured
 * small-PR round (~17 min, #8456) with margin; a large PR's first round may
 * exceed it, but round 1 starts with the most headroom, and every later
 * admission uses the previous round's observed cost instead of this.
 */
export declare const DEFAULT_ROUND_SECONDS = 1800;
/**
 * The runtime's concurrent-agent slots — the pool every fan-out launch
 * shares. The core tool scheduler runs the orchestrator's parallel `agent`
 * calls under this cap (default 10), the review workflow does not override
 * it, and an `agent-prompt` subprocess inherits the orchestrator's
 * environment — so the gate and the launches it gates read the same pool.
 */
export declare const TOOL_CONCURRENCY_ENV = "QWEN_CODE_MAX_TOOL_CONCURRENCY";
export declare const DEFAULT_TOOL_CONCURRENCY = 10;
interface RoundStamp {
    round: number | null;
    atMs: number;
}
/**
 * The admission stamps written so far THIS RUN, oldest first. Unreadable →
 * empty; a stamp older than the plan's own capture belonged to a previous
 * run of the same PR and is dropped (see `runEpochMs`).
 */
export declare function readRoundStamps(planPath: string): RoundStamp[];
/**
 * Record an admission. One stamp per round: a per-chunk rebuild of a round
 * already admitted must not shrink the observed cost of the round before it.
 * Write errors are swallowed for the same reason `recordPrompt` swallows
 * them — a read-only tmp dir must not stop a review being built.
 */
export declare function stampRound(planPath: string, round: number | undefined, nowMs?: number): void;
/**
 * What the round about to be admitted is expected to cost, in seconds: the
 * COSTLIEST round the run has measured (admission-to-admission — its audit
 * fan-out and the orchestration around it; under the pipelined loop a
 * round's verification overlaps the NEXT round instead of sitting between
 * admissions, so it is not in this measure, and the terminal round's
 * verification is exactly what the deadline's reserve covers) when a stamp
 * exists, else the conservative constant. The costliest, not the newest:
 * the reserve is the terminal round's only cover, and the run's own worst
 * span is the evidence of what a round can cost — a newest-only estimate
 * nets a mid-loop repair relaunch away the round after it lands, in
 * exactly the runs that end near the boundary. A stamp of the SAME round
 * is ignored — that is a rebuild, and measuring it would report a round
 * as cheap because its prompts were built twice quickly.
 */
export declare function expectedRoundSeconds(planPath: string, round: number | undefined, nowMs?: number): number;
/**
 * What the ADMISSION itself commits, in seconds — `expectedRoundSeconds`,
 * except when the round being admitted launches while its predecessor is
 * still in flight: the convergence pair's second member, built in the same
 * response as the first. The predecessor's stamp is fresher than the
 * observation floor — nothing has measured the round yet, and no elapsed
 * time has paid for it — so the admission must cover BOTH members' wall,
 * not just its own. That wall is the pair's two fan-outs sharing the
 * tool-concurrency pool: ceil(2C/N) waves against one round's ceil(C/N),
 * for C auditors on a pool of N, and the first never exceeds twice the
 * second — so the price is the single-round estimate scaled by exactly
 * those waves: one round's price when the pool holds both members at once
 * (the 3A shape, and a 3B pair whose chunks fit), more as the pool
 * serializes them, and never beyond the two-round bound whatever the pool.
 * Pricing the second member off the just-written first stamp instead — a
 * seconds-old span clamped to the floor — committed the pair at one
 * round's price for up to two rounds' wall, and near the deadline the
 * pair consumed the reserve and hit the outer timeout before posting.
 *
 * The price deliberately covers the pair's AUDITOR fan-outs only: the pair
 * launches in the same response as the Step 4 verifier shards, which share
 * the same pool waves, and if they stretch the batch past the priced waves
 * the extra wall is bounded by the verifier batch's own wave count — one
 * wave for any normal finding set — which the reserve the gate holds ahead
 * of every admission is there to carry.
 *
 * One ledger shape the price does not correct: the pair stamps rounds 1
 * and 2 seconds apart, so after the pair returns, the span from round 2's
 * stamp to the next admission covers the pair's whole wall, and every solo
 * round after it prices at up to twice its true cost. Accepted
 * conservatism: an over-priced gate refuses a round near the deadline that
 * would have fit — a capped verdict that still posts — never the
 * killed-before-compose shape the gate exists to prevent.
 */
export declare function expectedAdmissionSeconds(planPath: string, round: number | undefined, fanOutWidth: number, env: NodeJS.ProcessEnv, nowMs?: number): number;
export interface BudgetExhausted {
    /** Whole seconds until the deadline; can be negative when already past. */
    remainingSeconds: number;
    /** The tail reserve the remaining time failed to clear. */
    reserveSeconds: number;
    /** The admission estimate for the refused round itself. */
    expectedRoundSeconds: number;
}
/**
 * Decide whether another reverse-audit round still fits the review's time
 * budget: the remaining time must cover the round being admitted AND the
 * tail after it. Returns `null` when it does — or when no (well-formed)
 * deadline is present, which is every local run.
 */
export declare function reverseAuditBudgetExhausted(env: NodeJS.ProcessEnv, roundCostSeconds: number, nowMs?: number): BudgetExhausted | null;
export interface ComposeFloorExhausted {
    /** Whole seconds until the deadline; can be negative when already past. */
    remainingSeconds: number;
    /** The compose floor the remaining time failed to clear. */
    composeFloorSeconds: number;
}
/**
 * Decide whether a verification shard still fits before the compose floor:
 * the deterministic backstop that keeps the terminal round's verification
 * from consuming the time compose-review and submission need. Returns
 * `null` when a verify build may proceed — or when no deadline is set (a
 * local run), so the gate is inert exactly where the reverse-audit gate is.
 *
 * This fires only when the reserve has already been spent down into the
 * compose floor — the reverse-audit gate keeps `reserve` (which includes
 * this floor) ahead of the last round, so a healthy run never reaches it.
 * It is the cover for the one span the reserve cannot bound: a terminal
 * verification whose cost the finding set made larger than the reserve
 * planned for.
 */
export declare function verifyBudgetExhausted(env: NodeJS.ProcessEnv, nowMs?: number): ComposeFloorExhausted | null;
/**
 * The stderr line the verify gate prints on refusal — a termination rule
 * for the verification pass, not an error, spelled so the orchestrator
 * composes now rather than re-attempting the build.
 */
export declare function verifyBudgetMessage(spent: ComposeFloorExhausted): string;
export interface BudgetStop {
    /**
     * Which termination wrote this marker: the time budget (the reverse-audit
     * loop ran out of clock) or the round cap (it ran its full allotted
     * rounds without converging). `compose-review` picks the disclosure text
     * by this; an absent value reads as `time-budget` for back-compat.
     */
    cause?: 'time-budget' | 'round-cap';
    /** The round cap, when `cause` is `round-cap` — what `compose-review`
     * re-derives the disclosure from, the way it uses `round` for a time stop. */
    cap?: number;
    /** The exact `unreviewedDimensions` entry, composed here so the text that
     * caps the verdict is this module's in both channels. */
    entry: string;
    /** The Chinese pair of `entry` — the posted body is bilingual. */
    entryZh: string;
    round: number | null;
    remainingSeconds: number;
    reserveSeconds: number;
    atMs: number;
}
/**
 * The phrase that identifies the budget-stop disclosure wherever it is
 * relayed. Exported so `compose-review` dedups the orchestrator's copy
 * against the marker's by the same text the entry itself is spelled with —
 * a reword of the entry moves its key along with it.
 */
export declare const BUDGET_STOP_PHRASE = "review time budget";
/**
 * The disclosure as structural parts, both languages: compose-review renders
 * it through the same bilingual coverage path as every other structural gap.
 * The entry texts below are these parts joined, never the other way around.
 */
export declare function budgetStopDisclosure(round: number | undefined): {
    subject: string;
    reason: string;
    subjectZh: string;
    reasonZh: string;
};
/** The disclosure entry, spelled once for the marker AND the stderr message. */
export declare function budgetStopEntry(round: number | undefined): string;
/** The Chinese pair of `budgetStopEntry` — the marker carries both. */
export declare function budgetStopEntryZh(round: number | undefined): string;
/**
 * The phrase identifying a ROUND-CAP disclosure wherever it is relayed —
 * the cap analogue of `BUDGET_STOP_PHRASE`, so `compose-review` dedups the
 * orchestrator's relayed copy against the marker's by shared text.
 */
export declare const ROUND_CAP_PHRASE = "reverse-audit round cap";
/**
 * The round-cap disclosure as structural parts, both languages — the
 * analogue of `budgetStopDisclosure` for a loop that ran its full allotted
 * rounds without converging.
 */
export declare function roundCapStopDisclosure(cap: number): {
    subject: string;
    reason: string;
    subjectZh: string;
    reasonZh: string;
};
/** The round-cap entry, spelled once for the marker AND the stderr message. */
export declare function roundCapStopEntry(cap: number): string;
/** The Chinese pair of `roundCapStopEntry`. */
export declare function roundCapStopEntryZh(cap: number): string;
/**
 * Persist a round-cap refusal beside the prompt records, so
 * `compose-review` caps the verdict on a loop that ran its full rounds
 * without converging — without depending on the orchestrator to relay the
 * entry. Same marker file and same swallow-on-write-error discipline as
 * `writeBudgetStop`; only one stop fires per run, whichever refusal comes
 * first — the same-run guard below enforces it, so a retry-past-cap after a
 * time-budget stop cannot flip the recorded cause.
 */
export declare function writeRoundCapStop(planPath: string, cap: number, round: number | undefined, nowMs?: number): void;
/**
 * Persist the refusal beside the prompt records, where `compose-review`
 * reads it back and synthesizes the verdict-capping disclosure without
 * depending on the orchestrator to relay a sentence. Write errors are
 * swallowed: the stderr instruction still carries the entry, and a gate
 * that cannot write must still refuse. First refusal wins here too — a
 * same-run marker already on disk is left untouched.
 */
export declare function writeBudgetStop(planPath: string, spent: BudgetExhausted, round: number | undefined, nowMs?: number): void;
/**
 * The budget-stop marker, if THIS RUN wrote one. Unreadable → null; so is a
 * marker older than the plan's own capture — a previous run's refusal, left
 * behind by a kill before cleanup, must not cap a verdict on a stop that
 * did not happen in this run (see `runEpochMs`). A marker without a numeric
 * `atMs` cannot prove which run it belongs to and is treated the same way —
 * only this module writes markers, and it always dates them.
 */
export declare function readBudgetStop(planPath: string): BudgetStop | null;
/**
 * Remove any stop marker beside the prompt records. Called when the loop
 * reaches a clean end that outranks an earlier same-run refusal — a
 * CONVERGED exit after an over-cap round was refused: the marker would
 * otherwise survive (nothing else unlinks it) and cap a verdict the audit
 * legitimately converged. Missing file and unlink errors are swallowed —
 * the file was the thing to be rid of.
 */
export declare function clearBudgetStop(planPath: string): void;
/**
 * The refusal, spelled as the termination rule it is. Printed to stderr by
 * `agent-prompt` alongside exit code 4; the disclosure sentence matches the
 * `budget-stop.json` marker byte for byte, so both channels cap the verdict
 * with one text.
 */
export declare function reverseAuditBudgetMessage(spent: BudgetExhausted, round: number | undefined): string;
export {};
