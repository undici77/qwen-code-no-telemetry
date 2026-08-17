/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import { type Ledger } from './lib/ledger.js';
export type ReviewEvent = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
/**
 * The floor above which a zero-finding Approve is disclosed as low-signal,
 * in the plan's `srcDiffLines` — diff lines belonging to `source` files, the
 * same field the review topology is chosen from (tests, docs and generated
 * files excluded by construction). A trivial edit stays under it even
 * scattered one changed line per hunk (~8 diff lines each with context and
 * hunk header, plus 4 file-header lines), and the smallest diff the topology
 * gate calls big is 500 — so the floor sits well past the typo-fix class and
 * well before "big".
 */
export declare const LOW_SIGNAL_SRC_DIFF_LINES = 100;
/**
 * Reads a PR's description body, given its `owner/repo` and number. The one
 * production implementation calls `gh pr view`; the bilingual fallback uses it
 * to recover the Han signal from the live PR when the plan does not carry it.
 */
export type PrBodyFetcher = (ownerRepo: string, prNumber: string) => string;
export interface ComposeReviewInput {
  /**
   * Critical findings anchored as inline `comments` entries.
   *
   * A seam for the two CLI boundaries and the tests — NEVER a field of the
   * model-written state JSON. Both boundaries derive it from the drafted
   * comments (`compose-review --comments`, `submit`'s payload) and refuse it
   * when the JSON carries it: a count handed over beside the thing it counts
   * is a count that can disagree with it, and a dogfooded report-only run —
   * where nothing downstream recounts — moved its one Critical from
   * `bodyCriticals` to an inline comment, lost the count on the way, and this
   * function printed `Verdict: Approve` over a Critical the report listed.
   */
  criticalsInline?: number;
  /** Suggestion findings anchored inline. Same seam, same refusal. */
  suggestionsInline?: number;
  /**
   * Critical descriptions whose only copy lives in the review body — the
   * last-resort unmappable findings and 422-relocated ones. They count
   * toward `C` exactly like anchored Criticals.
   */
  bodyCriticals?: string[];
  /** Suggestions discarded as unanchorable (offline validation or 422). */
  suggestionsDiscarded?: number;
  /**
   * Existing Criticals already on the PR whose Step 6 re-check landed on
   * `cannot tell` — one line each (location + what could not be decided).
   * Not counted in `C` (the review did not confirm them), but their
   * presence forbids an approval.
   */
  cannotTellCriticals?: string[];
  /** Uncoverable chunks, e.g. `"chunk 5 (src/big.min.js)"`. */
  uncoverableChunks?: string[];
  /**
   * Dimensions nobody reviewed. A bare name (`"security"`) means its agent
   * whiffed twice and gets the standard explanation; an entry carrying its
   * own reason after an em-dash (`"issue-fidelity — linked issue #123 could
   * not be fetched"`) is rendered verbatim.
   */
  unreviewedDimensions?: string[];
  /**
   * The plan report from Step 1.
   *
   * Coverage is derived from it plus the harness's transcripts — it is not an
   * input. See the recomputation below for why a caller does not get to say
   * whether the diff was read.
   */
  planPath?: string;
  /**
   * The cumulative reverse-audit findings file at loop end — the same file
   * every round's `agent-prompt --findings` received, after the final merge.
   * compose-review reads it itself for the one fact Step 6's confirmed-only
   * read is otherwise a model's word on: whether any entry still carries the
   * `— [unverified]` tag. A surviving tag means no verifier ever ruled on
   * that entry, and the verdict is capped whether or not the report excluded
   * it. A path that does not read fails closed — "could not show" and "was
   * not" read the same to the person the verdict posts at. Omitted, the
   * check is off: every non-high review, which runs no Step 5.
   */
  findingsPath?: string;
  /**
   * Where to look for the harness's records. Defaults to the environment the CLI
   * exported. A test seam only — production never passes it, and a model cannot:
   * `compose-review` reads its input as JSON, and this is not serialisable into
   * anything that would change where the transcripts are found on a real run.
   */
  env?: NodeJS.ProcessEnv;
  /**
   * How the bilingual fallback reads the live PR body when the plan carries a
   * PR identity but no `prDescriptionHasHan` (a `plan-diff` plan, or one an
   * improvising orchestrator wired in place of `fetch-pr`'s report). A test
   * seam ONLY: production leaves it undefined and the CLI reads the PR with
   * `gh pr view`. The handler **strips it from the input JSON** before use (the
   * same way it strips `env`), so a model cannot supply one — not even a
   * non-function value that would throw past the default and drop the fold. It
   * can neither force nor suppress the Chinese fold, which is the whole point of
   * keeping the signal the CLI's own.
   */
  prBodyFetcher?: PrBodyFetcher;
  /** Step 1's lightweight `pr-context` fetch failed. */
  contextUnavailable?: boolean;
  presubmit?: {
    downgradeApprove?: boolean;
    downgradeRequestChanges?: boolean;
    downgradeReasons?: string[];
  };
  /**
   * The drafted inline comments this review is posting — the ledger's own
   * input. A seam like `criticalsInline`, filled by the two CLI boundaries
   * from the same array they count, never by the model's state JSON (the
   * handler strips it, as it does `env` and `prBodyFetcher`).
   */
  draftedComments?: Array<{
    path?: unknown;
    line?: unknown;
    body?: unknown;
  }>;
  /** Model id for the footer, e.g. `qwen3.7-max`. */
  modelId: string;
}
export interface ComposeReviewResult {
  event: ReviewEvent;
  body: string;
  /** The table row before caps and downgrades — for the terminal report. */
  baseEvent: ReviewEvent;
  /** Which cap states applied (empty when none). */
  cappedBy: string[];
  /** True when a presubmit flag actually changed the event. */
  downgraded: boolean;
  /**
   * What the presubmit downgrade moved the event *from*, when it moved one.
   *
   * `baseEvent` cannot answer this: it is the row before caps AND downgrades, so a
   * `REQUEST_CHANGES` that a cap already softened to `COMMENT` before the downgrade
   * ran would look the same as one the downgrade itself moved. This names the
   * transition the downgrade made, so the terminal verdict can say a Request
   * changes — a review with confirmed Criticals — was downgraded, and not let it
   * read as "Comment, nothing blocking".
   */
  downgradedFrom: 'Approve' | 'Request changes' | null;
  /**
   * The orchestrator-facing fix for each coverage/verification gap the body
   * discloses — printed to stderr by the command, never rendered into the body.
   * The body tells the PR author what the review cannot certify; this tells the
   * operator which command repairs it. Two registers, two channels.
   */
  remediation: string[];
  /**
   * Set on an APPROVE composed from zero findings over a non-trivial source
   * diff (the plan's `srcDiffLines` above `LOW_SIGNAL_SRC_DIFF_LINES`).
   * Disclosure only — the event never moves on it: the coverage gate proves
   * the agents READ the diff, not that the review had discriminating power,
   * and a dogfooded weak-model run drafted nothing from its whole roster on a
   * diff where stronger same-condition runs found a verified blocker, then
   * printed a bare confident Approve. The verdict line names the shape.
   * `agents` is the plan's required roster — all on record at APPROVE, or
   * coverage would have capped — and `srcDiffLines` the plan's own count.
   */
  lowSignal: {
    agents: number;
    srcDiffLines: number;
  } | null;
}
export declare function composeReview(
  input: ComposeReviewInput,
  cliVersion?: string,
): ComposeReviewResult;
/**
 * A set of unreviewed chunk ids, said in the PR author's units.
 *
 * `chunk 28` is the run's own bookkeeping: the id selects a rebuild command
 * on stderr, and nothing on the PR page maps it to code. #7268's posted body
 * was two sentences enumerating all 49 of them — unsorted, because the first
 * group rode transcript order — and the one fact they carried (nothing was
 * certified) is the opener's job, not an enumeration's. The author's units
 * are their files and, at the limit, the diff itself, so the ids collapse to
 * whichever of those fits:
 *
 * - every planned chunk → `the entire diff`;
 * - a gap whose files are known and few → the files, named;
 * - anything wider (or a plan whose chunks carry no files) → a count against
 *   the plan's total.
 *
 * The ids never render. They stay in the structural entries — the caps, the
 * caller-echo dedup and the certification test all key on `chunk <id>` — and
 * in the stderr remediation, where the id is the selector a reader can act
 * on. `plural` is the phrase's grammatical number, for the one caller whose
 * sentence carries a pronoun; `phraseZh` is the same phrase for the Chinese
 * half of a bilingual body.
 */
export declare function describeChunkGap(
  ids: readonly number[],
  planned: ReadonlyArray<{
    id: number;
    files: string[];
  }>,
): {
  phrase: string;
  phraseZh: string;
  plural: boolean;
};
export declare function repositoryContextGate(planPath: string): string[];
/**
 * Read the script-lint report the orchestrator wrote and turn it into verdict
 * inputs, deterministically. Returns the pre-confirmed `[lint]` Criticals (a
 * finding on a changed line, above cosmetic `style`) and the unreviewed-scope
 * entries (a checker not installed or crashed, or — owed but absent — a report
 * the run never produced). The path is DERIVED from the plan, never taken from
 * the model's input JSON, and the plan itself decides whether the lint was owed:
 * this is what takes the model out of both the block decision and the proof it ran.
 */
export declare function scriptLintGate(planPath: string): {
  criticals: string[];
  unreviewed: string[];
  disclosed: string[];
};
/**
 * Read the test-plan report and turn its rulings into body notes.
 *
 * Unlike `scriptLintGate`, this one **never caps and never blocks**, and every
 * early return is therefore a plain "nothing to say" rather than a fail-closed
 * disclosure. That asymmetry is deliberate on both halves:
 *
 *   - A Test Plan defect is not a code defect. The author claimed a path that
 *     is not there, or a count from a different suite; the diff is unaffected.
 *     Blocking a merge on it would spend the review's one irreversible action
 *     on a documentation nit, and the skill's design philosophy is that a
 *     comment not worth the reader's time costs more than it returns.
 *   - Capping on a MISSING report would cap essentially every PR, because most
 *     PRs produce no notes at all and a run has no way to prove the difference
 *     between "checked, nothing to say" and "never checked" that is worth the
 *     un-Approvability. This is the `deferred`-checker precedent above: a
 *     limitation the author cannot fix must not become a permanent cap.
 *
 * A stale report is dropped in silence for the same reason a stale one is
 * refused elsewhere — a note about a previous commit's Test Plan is worse than
 * no note, and here there is no cap to fall back to.
 */
export declare function testPlanGate(planPath: string): {
  notes: string[];
};
export declare const composeReviewCommand: CommandModule;
/**
 * The next round's ledger: every finding this review is posting as its own —
 * the drafted inline comments plus the body Criticals. Low-confidence findings
 * never reach either input (they are terminal-only), so the ledger holds only
 * claims the review stands behind, which is what the next round re-asserts.
 */
export declare function buildLedger(
  round: number,
  drafted: Array<{
    path?: unknown;
    line?: unknown;
    body?: unknown;
  }>,
  bodyCriticals: string[],
): Ledger;
/** The terminal verdict, in the words Step 6 is told to print. */
export declare function verdictLine(r: ComposeReviewResult): string;
