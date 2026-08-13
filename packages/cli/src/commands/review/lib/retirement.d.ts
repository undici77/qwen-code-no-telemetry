/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** What one prior audit of one chunk provably produced. */
export type AuditOutcome = 'yielded' | 'dry' | 'unknown';
/** A retired chunk skipped this round, with the receipts that earned it. */
export interface RetiredChunk {
    chunkId: number;
    /** The two most recent audit rounds — both substantive dry receipts. */
    dryRounds: [number, number];
    /** The next round whose parity puts the chunk back under audit. */
    nextColdCheck: number;
}
export interface RoundSchedule {
    /** Chunk ids to build this round, in the order the caller gave them. */
    due: number[];
    /** The subset of `due` that is a retired chunk's alternating cold check. */
    coldChecks: number[];
    /** Retired chunks NOT due this round — the retirement note names these. */
    skipped: RetiredChunk[];
    /** Every chunk is retired and none is due: the audit has converged. */
    converged: boolean;
}
/**
 * The diff lines a record's prompt points its chunk at, 1-based and
 * inclusive. Every per-chunk launch this CLI builds bakes exactly one
 * `read_file(file_path="…", offset=N, limit=M)` aimed at the diff; the dry
 * bar compares what the transcript actually read against it. Empty when the
 * prompt bakes no read, where the bar falls back to "opened the diff at
 * all" — a shape this module's own records never have.
 *
 * The scan is bound to the diff's own path because the prompt carries other
 * `read_file` lines — the brief, the findings list file — and prose quoting
 * ANY `offset=N, limit=M` pair (a read_file call under discussion, this very
 * file in a diff) would otherwise inject its range into the territory. When
 * the findings list was folded into the prompt verbatim it did exactly that:
 * `openedTheTerritory` passes on ANY overlap with ANY range, so an injected
 * range can only WIDEN the bar — an auditor whose only diff read was lines
 * 1-50 would retire a chunk whose territory is 1001-1200 the moment a
 * finding quoted `offset=0, limit=50` — the same range-blind hole the
 * territory check exists to close, reopened by honest findings. Only a read
 * aimed at the diff is territory. An unknown diff path reads as no
 * territory: the transcripts side then marks no call a diff read, every
 * transcript classifies `unknown`, and no chunk retires — the territory is
 * never consulted.
 */
export declare function bakedRanges(prompt: string, diffPath: string | undefined): Array<[number, number]>;
/**
 * Whether any of the transcript's reads lands in the chunk's baked
 * territory. Overlap is the bar, not containment: an honest auditor pages
 * an oversized chunk, and each page overlaps the territory even though no
 * single read holds it all. A read with no line range (a `read_file` with
 * no limit) proves no lines at all and overlaps nothing.
 */
export declare function openedTheTerritory(diffReads: Array<[number, number]>, territory: Array<[number, number]>): boolean;
/**
 * Which chunks round `round` owes an auditor, from the audit history the
 * harness and the prompt records agree on.
 *
 * Retirement: a chunk whose two most recent audits are both `dry` is due
 * only on even rounds — one round skipped, one round cold-checked,
 * alternating on a SINGLE global parity every retired chunk shares, so
 * staggered certificates re-align and the all-retired convergence stays
 * reachable (the loop below says why the anchor is not the chunk's own
 * parity). A retired chunk whose cold check yields simply stops satisfying
 * the two-most-recent-dry rule and is due every round again; no state is
 * kept anywhere, the history IS the state.
 *
 * Throws whatever the transcript or record readers throw
 * (`TranscriptsUnavailableError` included): the CALLER owns the fail-open,
 * because the right degradation — build every chunk — is a build decision,
 * not a schedule.
 */
export declare function scheduleReverseAuditRound(planPath: string, chunkIds: number[], round: number, env?: NodeJS.ProcessEnv, diffPath?: string): RoundSchedule;
