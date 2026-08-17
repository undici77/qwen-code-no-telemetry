/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import { isWorkspaceMember } from './lib/workspaces.js';
export type ProbeVerdict = 'gated' | 'inert' | 'inconclusive';
/**
 * WHY a probe was `inconclusive`, as the run knew it at the time.
 *
 * Seven different things arrive at the same verdict and they are not
 * interchangeable:
 *
 * - `control-failed` — the suite ran and read green, but the positive control
 *   proved the runner could not have gone red, so the reading is not evidence.
 * - `not-run` — no suite ran for it: the tree could not be prepared, or the
 *   runner could not be started at all. Nothing was measured.
 * - `runner-died` — a suite WAS started and did not survive: killed at the
 *   deadline, or by a signal. It may have executed most of its tests, so
 *   "nothing ran" is a claim about it that nothing checked.
 * - `no-output` — the runner ran and produced nothing parseable, so whether it
 *   collected anything is unknown.
 * - `not-in-results` — the run produced results and this file was not among
 *   them. A compile or import error looks like this, and so does a path that
 *   failed to match.
 * - `no-tests` — the file WAS in the results and collected zero assertions.
 * - `all-skipped` — it collected tests and executed none of them.
 *
 * Anything downstream that explains an `inconclusive` has to pick between
 * these, and the prose `detail` is written for a human, not for that decision.
 */
export type ProbeReason =
  | 'control-failed'
  | 'not-run'
  | 'runner-died'
  | 'no-output'
  | 'not-in-results'
  | 'no-tests'
  | 'all-skipped';
/**
 * A union, not an optional field: every `inconclusive` MUST say which way, and
 * the compiler is what enforces it. Left optional, a branch that forgot to tag
 * itself fell through to a vague catch-all wording with nothing failing —
 * measured, deleting one tag left all 116 tests green while every hold of that
 * kind silently degraded. The one part of this file that has to be right is the
 * part a runtime fallback was quietly covering for.
 */
export type ProbeResult =
  | {
      file: string;
      verdict: 'gated' | 'inert';
      detail: string;
    }
  | {
      file: string;
      verdict: 'inconclusive';
      detail: string;
      reason: ProbeReason;
    };
/**
 * `Omit` applied across each arm instead of to the union as a whole. A plain
 * `Omit`/`Pick` collapses `ProbeResult` into one object type and makes `reason`
 * optional again — which is how an `inert` entry could reach the explanation
 * helper and come back described as "did not come back green", the opposite of
 * what `inert` means. Distributing keeps the discrimination, so the helper
 * cannot read `reason` without first narrowing on `verdict`.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;
/** What the two explanation helpers read: `ProbeResult` without its prose. */
export type ProbeOutcome = DistributiveOmit<ProbeResult, 'detail'>;
export interface FileEntry {
  path: string;
  kind: string;
}
export { isWorkspaceMember };
export interface EfficacyPlan {
  /** Test files the diff adds or changes that the test command never collects. */
  unreachable: string[];
  /** Test files worth probing — they are reachable, so they can be run. */
  probes: string[];
  /** Production files to revert to base for the probe. */
  revert: string[];
}
/**
 * Split the diff into what to report and what to run.
 *
 * A diff with no source changes has nothing to gate, so it gets no probe: a
 * test-only PR (a new test for old code) must not be told its tests are inert.
 */
export declare function planTestEfficacy(
  files: FileEntry[],
  workspaceGlobs: string[],
): EfficacyPlan;
export type MutantVerdict = 'killed' | 'survived' | 'inconclusive';
/**
 * A candidate the probe will run. The two shapes are a union so an operator
 * without its replacement line is UNREPRESENTABLE: `runOneMutant` takes the
 * ACTION from `mutated` and the verdict WORDING from `operator`, so a
 * half-populated candidate would delete a line while reporting "with its
 * `?? fallback` dropped".
 */
export type MutantCandidate = DeletionMutant | ReplacementMutant;
export interface ReplacementMutant extends MutantBase {
  operator: 'coalesce' | 'guard-true' | 'term-drop';
  /** The full replacement LINE (untrimmed). Required by construction. */
  mutated: string;
}
/** What both mutant shapes carry. */
export interface MutantBase {
  file: string;
  /** 1-based line number in the post-change file. */
  line: number;
  /** The statement's text, trimmed — quoted back verbatim in the report. */
  statement: string;
}
/**
 * The legacy shape: the line is DELETED. `operator` is absent (or `'delete'`)
 * and there is no replacement line — see the union above for why that is
 * enforced by the type rather than by a convention.
 */
export interface DeletionMutant extends MutantBase {
  operator?: 'delete';
  mutated?: undefined;
}
/** An intersection, not `extends`: the candidate is a union now. */
export type MutantResult = MutantCandidate & {
  verdict: MutantVerdict;
  detail: string;
};
/**
 * At most this many deletion mutants per run. Every mutant is a full vitest run
 * over the affected test files, so the cap — not the candidate count — is what
 * keeps this command inside its budget on a diff that clears eight Maps.
 */
export declare const MAX_MUTANTS = 8;
export type HunkVerdict = MutantVerdict;
export interface HunkCandidate {
  file: string;
  /** 0-based index of this hunk within the file's diff against base. */
  index: number;
  /** The `@@ … @@` line, quoted back in the report. */
  header: string;
  /** New-side first line the hunk occupies — where the finding points. */
  startLine: number;
  /** A complete patch: the file header plus this ONE hunk. */
  patch: string;
}
export interface HunkResult extends Omit<HunkCandidate, 'patch'> {
  verdict: HunkVerdict;
  detail: string;
}
/**
 * At most this many per-hunk probes per run.
 *
 * Lower than {@link MAX_MUTANTS} on purpose: a hunk probe costs the same full
 * suite run, but it is the THIRD claim on a budget the mutants and the revert
 * probe already share, and it runs last. The cap is what keeps a 40-hunk diff
 * from starving the revert probe rather than a statement about how many hunks
 * are worth probing.
 */
export declare const MAX_HUNK_PROBES = 6;
/**
 * At most this many REPLACEMENT mutants per run, inside the shared cap — see
 * the selection comment for the 24x pool measurement that forced this.
 */
export declare const REPLACEMENT_SUB_CAP = 3;
export interface MutantSourceFile {
  file: string;
  /** Post-change content at the PR head — what the probe tree checks out. */
  content: string;
  /** 1-based new-side line numbers the diff ADDED in this file. */
  addedLines: number[];
  /** The diff also adds/changes this file's collocated test. Preference only:
   *  under the cap these candidates go first — a mutant is most informative
   *  exactly where the PR claims its new tests cover the new code. */
  hasNewTests: boolean;
}
/**
 * Deterministic mutant selection: among the diff's added lines, the complete
 * single-line safety-verb statements, capped at {@link MAX_MUTANTS} — files
 * with new tests first, then diff order, then line order. Candidates the cap
 * cannot fit are counted in `skippedForCap`, not silently lost — a report that
 * omits them lets a capped `survived: 0` read as "every safety statement is
 * covered", the same false assurance `skippedForBudget` exists to prevent. A
 * file whose scan ends outside code state (a regex literal holding a quote or
 * backtick derails it) has ALL its candidates dropped and is returned in
 * `derailed` — the caller must disclose that zero for the same reason.
 */
/**
 * (Below: the replacement operators. `selectMutants`' own contract doc sits
 * directly above `selectMutants` — this block documents its helper.)
 *
 * Replacement mutants for one added line. High-precision by construction: each
 * pattern is anchored to a shape whose survival maps to one crisp sentence,
 * because a survivor becomes a public Suggestion and a fuzzy operator would
 * flood the report with "so what" mutations.
 *
 * The edit is computed on `codeLine` — the scanner's literal-blanked,
 * comment-stripped, TRIMMED view — and reattached to the raw line's leading
 * whitespace. That is only sound when the two views agree, so a line whose
 * trimmed raw text differs from its code view (it carries a string literal or
 * a comment) yields NO candidate: an index computed on one view and applied to
 * the other spliced `iftrue 0)` into a guard the first time this ran, and a
 * mangled mutant is worse than a skipped one — its compile error reads as
 * `inconclusive` and quietly eats a cap slot. Conservative silence, as with
 * every other selector here.
 *
 * At most ONE candidate per line, first match wins (coalesce → term-drop →
 * guard-true, most-specific first): two mutants of the same line would run the
 * suite twice to say nearly the same thing.
 */
export declare function replacementMutantsOf(
  raw: string,
  codeLine: string,
): {
  operator: 'coalesce' | 'guard-true' | 'term-drop';
  mutated: string;
} | null;
export declare function selectMutants(
  files: MutantSourceFile[],
  cap?: number,
): {
  selected: MutantCandidate[];
  skippedForCap: number;
  derailed: string[];
};
/**
 * The new-side line numbers a `--unified=0` diff ADDED, per post-change path.
 * Zero context is what the caller asks git for, but context lines are counted
 * anyway so a diff captured with the default `-U3` still numbers correctly.
 */
export declare function parseAddedLines(
  diffText: string,
): Map<string, number[]>;
/**
 * The probe file that is the collocated test of `file` (the repo convention
 * `file.test.ts` / `file.spec.ts` beside it), if one is in `testPaths`.
 */
export declare function collocatedProbe(
  file: string,
  testPaths: readonly string[],
): string | undefined;
/**
 * Should this candidate be held `inconclusive` because the test collocated with
 * the file it touches was not green in the unmutated baseline — and if so, with
 * what explanation?
 *
 * ONE decision for both loops. The rule and its wording had already been
 * duplicated across the mutant and hunk guards, and the duplication had already
 * drifted twice: the hunk loop had the rule first and the mutant loop shipped
 * eight survivors through the gap before it was copied over, and the shared
 * explanation was then corrected in one place and hand-copied to the other.
 * A rule stated twice is a rule that will be true in one place.
 */
export declare function heldForRedCollocatedTest(
  kind: 'mutant' | 'hunk',
  file: string,
  probes: readonly string[],
  greenProbes: readonly string[],
  baselinePerFile: readonly ProbeOutcome[],
): string | undefined;
/**
 * Did this spawn result start a suite and lose it, or never start one?
 *
 * Read off the result's STRUCTURE, not its message. The first version of this
 * matched `/^runner (killed|spawn failed)/` against the thrown text and was
 * inoperative: `spawnSync` reports a timeout as `error` (`ETIMEDOUT`, with
 * `signal` also set) and `runProbeSuite` throws `r.error` before it ever
 * composes a "runner killed by" sentence, so the real messages are
 * `spawnSync … ETIMEDOUT` and `spawnSync … ENOENT` and neither matched. The
 * tag it exists to produce was therefore never produced, and the test that
 * covered it asserted strings the code does not emit.
 *
 * A deadline kill may have executed most of the suite; a runner that could not
 * be started ran nothing. That is the distinction a reader acts on.
 */
export declare function runnerFailureReason(r: {
  error?:
    | (Error & {
        code?: string;
      })
    | undefined;
  signal?: NodeJS.Signals | null;
}): ProbeReason;
/** A probe run that threw, carrying WHY rather than leaving it to be parsed
 *  back out of the message. */
export declare class ProbeRunFailure extends Error {
  readonly reason: ProbeReason;
  constructor(message: string, reason: ProbeReason);
}
/**
 * The whole sentence a mutant or hunk is held `inconclusive` with when its own
 * collocated test was not green in the unmutated baseline — the ONLY wording
 * either guard has, so what this returns is what the report says.
 *
 * It reads the reason off the baseline rather than asserting one. The ways a
 * probe fails to be green are different failures with different fixes, and the
 * guards used to name one of them flatly: measured on PR #8368,
 * `AuthDialog.test.tsx` compiled, collected 26 tests and failed exactly one,
 * and all three mutants in its source were held with "likely a compile or
 * import error in the probe tree" — sending a reader after an import problem
 * that was never there.
 *
 * A probe with no baseline entry at all is reported as not measured, which is a
 * different claim from measured-and-empty and the one the run actually
 * supports. It cannot arise in this pipeline — `classifyProbeRun` maps over
 * exactly the probe list `own` is drawn from — so it is a default, not a case.
 */
export declare function collocatedNotGreenDetail(
  kind: 'mutant' | 'hunk',
  probe: string,
  baselinePerFile: readonly ProbeOutcome[],
): string;
/**
 * Does the diff add or change a test collocated with this production file?
 * The repo convention is `file.test.ts` beside `file.ts`. Used only to ORDER
 * candidates under the cap, so a miss costs priority, not selection.
 */
export declare function hasCollocatedNewTest(
  file: string,
  testPaths: string[],
): boolean;
/**
 * Rule on one mutant from the per-file revert-probe verdicts of its run.
 *
 * `gated` on any file means an assertion failed with the statement deleted —
 * the mutant was caught, which is the good outcome and NOT a finding. But
 * `survived` requires every affected test file to have genuinely run and
 * passed: a file that collected nothing might be the very one that would have
 * caught the deletion, so any `inconclusive` without a kill makes the mutant
 * `inconclusive` — the same never-read-an-error-as-a-verdict asymmetry the
 * revert probe holds.
 */
export declare function classifyMutantRun(
  perFile: Array<{
    verdict: ProbeVerdict;
  }>,
): MutantVerdict;
/**
 * Can the remaining budget fit one more mutant? The revert probe's slot is
 * reserved by the deadline passed to {@link runProbeSuite}, so this guard
 * only prices the mutant's own suite run.
 */
export declare function fitsAnotherMutantRun(
  remainingMs: number,
  estimatedRunMs: number,
): boolean;
/**
 * Rule on the revert probe, **per test file**.
 *
 * Per-file, not per-run, and that distinction is load-bearing. One `vitest run`
 * covers every probe at once, but a run-level verdict lets one honest test cover
 * for a useless one: the gating test fails, the run reports failures, and the
 * inert test sitting beside it is scored `gated` too. Every inert test with a
 * working sibling would be invisible — which is the exact defect this command
 * exists to find. (Found by running it, not by unit-testing it. The unit tests
 * for the run-level classifier all passed.) `testResults[].name` carries the
 * file, so the mapping is available; use it.
 *
 * The three-way asymmetry is deliberate:
 *
 * - `inert` — this file's tests PASSED with the source change reverted. They do
 *   not gate the change. This is a finding.
 * - `gated` — at least one ASSERTION in this file failed. It caught the revert;
 *   it is doing its job. Requires a real assertion failure, never a bare
 *   non-zero exit: reverting source routinely breaks a test's own compile (it
 *   imports a symbol the diff introduced), and a compile error proves nothing
 *   about whether the test would catch a behavioural regression.
 * - `inconclusive` — everything else: the file collected nothing, an
 *   import/type error, unparseable output. Do NOT let this read as `gated`; a
 *   review that mistakes "it errored" for "it caught the bug" is back where it
 *   started.
 */
export declare function classifyProbeRun(
  exitCode: number,
  stdout: string,
  probes: string[],
  stderr?: string,
): ProbeResult[];
/**
 * Resolve the vitest CLI entry the probe runs with.
 *
 * Spawning `process.execPath` against vitest's own entry — not `npx` — sidesteps
 * `npx.cmd` and shell quoting on Windows entirely. The entry is read from
 * vitest's `bin` field rather than a hard-coded `vitest.mjs`: `package.json`
 * pins a caret range, so a minor bump can move the bin target. A miss must also
 * explain itself — name the search root and what was sought — because the throw
 * lands in the probe's catch and an unexplained `inconclusive` is the one failure
 * shape a review must not have. `createRequire` anchored at the worktree does the
 * same up-tree walk Node uses for the probe's own imports, so it also survives
 * non-hoisted layouts.
 */
export declare function findVitestBin(
  worktree: string,
  resolveModule?: (specifier: string) => string,
): string;
/**
 * Remove `join(worktree, relPath)` without following a PR-controlled symlink.
 *
 * `rmSync` follows symlinks in the path PREFIX, and the revert set is
 * PR-controlled: a diff that turns `dir` into a symlink to an outside directory
 * and has the probe delete `dir/victim` would make `rmSync` follow `dir` and
 * delete the outside file — a real P0 a reviewer reproduced. The lexical
 * `escapes the worktree` guard cannot catch it, because `dir/victim` is lexically
 * inside the tree; the escape happens at runtime through the link.
 *
 * So walk every component from the worktree root down and refuse if any
 * ANCESTOR is a symlink — the target must be reachable through real directories
 * only. The final component being a symlink is fine: `rmSync` unlinks the link
 * itself, not what it points at, which is exactly what reverting an added
 * symlink should do. A missing component means there is nothing to remove
 * (`force` rm is already a no-op there), so return quietly.
 */
export declare function safeRmWithin(worktree: string, relPath: string): void;
/**
 * The warning for a probe worktree that survived its discard.
 *
 * Pure, and for the same reason as `worktreeCreateFailureDetail`: the branch it lives on
 * fires only when the path outlives both `worktree remove` and `rmSync`, which
 * no portable test can force. The reason is what makes it useful — whoever has
 * to delete the tree by hand needs to know WHY it would not go, and a bare
 * "could not remove <path>" tells them nothing. Prefer the exception (`rmSync`
 * hit EPERM/EBUSY); fall back to what git said when it refused to unregister.
 */
export declare function probeCleanupFailureDetail(
  probeTree: string,
  removeError: unknown,
  sweepStderr: string,
): string;
export declare function exposeDependencies(
  probeTree: string,
  dependencyRoot: string,
): {
  linked: number;
  failed: number;
};
/**
 * Delete one statement in the probe tree, run the affected tests, put the file
 * back. The restore is a plain content write, not a git call: the original
 * bytes are already in hand, and a write cannot be confused by whatever
 * checkout state a failed run leaves. A restore failure throws — the caller
 * must not keep mutating a tree it cannot prove clean. (Writing through
 * `join(probeTree, file)` is symlink-safe here the way `safeRmWithin` has to
 * enforce for deletes: the candidate resolved as a blob at the head commit, and
 * one git tree cannot hold both `dir` as a symlink and `dir/file` as a blob, so
 * in a fresh checkout every ancestor is a real directory.)
 *
 * Exported for its tests: the never-delete-a-mismatched-line guard cannot be
 * reached through the command (selection and the probe tree derive from the
 * same commit), so the test pins it directly rather than not at all.
 */
/**
 * Split one file's diff into one self-contained patch per hunk.
 *
 * The statement mutants answer "is this one safety statement protected?" for a
 * deliberately narrow class of statement; the revert probe answers "is ANY of
 * this protected?" all at once. Between them sits the question neither can
 * reach: **which particular change in this diff has no test behind it.** A hunk
 * is the natural unit for that — it is the granularity the author wrote and the
 * granularity a reviewer reads — and reverting one at a time is the only way to
 * attribute a green suite to a specific change rather than to the diff at large.
 *
 * A column-0 `@@` is unambiguously a hunk header: every body line of a unified
 * diff starts with ' ', '+', '-' or '\', so a removed line whose own text begins
 * `@@` arrives as `-@@` and cannot be mistaken for one.
 *
 * Rename patches are not guarded here: `hunkProbeInputs` diffs one pathspec at
 * a time, so a rename renders as a pure add (`--- /dev/null`) and
 * `selectHunkProbes` skips it. A rename reaching `runOneHunkProbe` directly
 * would reverse-apply the rename and leave both paths present.
 */
export declare function splitDiffIntoHunks(diffText: string): Array<{
  header: string;
  patch: string;
  startLine: number;
}>;
/**
 * The hunks worth probing, in the order they should be spent.
 *
 * Two selection rules, both about not paying twice for the same answer:
 *
 *  - **A hunk that already contains a mutant is skipped.** The mutant ran a
 *    finer-grained version of the same experiment on that hunk's own lines; a
 *    second run over the whole hunk buys a coarser answer at the same price,
 *    and the budget is better spent on ground nothing has covered.
 *  - **Files whose collocated tests the diff also touches go first**, as with
 *    mutants: a survivor is most informative exactly where the PR claims its
 *    new tests cover the new code.
 *
 * Candidates the cap cannot fit are counted, never dropped in silence — a
 * capped `survived: 0` that read as "every change is covered" is the same false
 * assurance the mutant cap already guards against.
 */
export declare function selectHunkProbes(
  files: Array<{
    file: string;
    diff: string;
    hasNewTests: boolean;
    mutantLines: number[];
  }>,
  cap?: number,
): {
  selected: HunkCandidate[];
  skippedForCap: number;
};
/**
 * Neutralise ONE hunk in the probe tree, run the affected tests, restore.
 *
 * Reverse-applying the hunk's own patch is what makes this attributable: `git
 * checkout base -- <file>` would revert the whole file and the verdict would
 * belong to no particular change, which is precisely the all-or-nothing limit
 * of the revert probe. `git` does the line-offset arithmetic, so a hunk later in
 * the file is neutralised at the right place without this code tracking offsets.
 *
 * The asymmetry the mutants established holds here too, and for the same
 * reason: a patch that will not apply, or a tree that will not compile without
 * the hunk, is `inconclusive` — NEVER `killed`. A compile error says nothing
 * about whether a test would have caught a behavioural regression, and scoring
 * it as "a test caught it" is exactly the false assurance this command exists
 * to remove.
 */
export declare function runOneHunkProbe(
  probeTree: string,
  hunk: HunkCandidate,
  probes: string[],
  deadlineAt?: number,
  now?: () => number,
): HunkResult;
/**
 * The positive control: append one always-failing test to a GREEN probe file,
 * run that file, restore. Red = the harness demonstrably executes assertions
 * (true), green = it does not (false). Restore is by content in finally, the
 * same discipline as every other probe edit in this file.
 *
 * `null` is the THIRD outcome, and it is not the same as `false`: the control
 * never ran, so nothing was demonstrated either way. Returning `false` there
 * would state as fact that an injected test stayed green when none was ever
 * injected — the fabricated verdict this file's budget path already refuses
 * ("never a fabricated true or false"), and it would additionally discard the
 * whole mutant/hunk window over an I/O error.
 *
 * KNOWN BOUND: it validates ONE file, not the collection. The injection goes
 * into `greenProbes[0]`, so a collector that silently drops a DIFFERENT probe
 * file still passes the control while that file's survivors stand. The
 * per-file baseline gate bounds the residual window — a file that collected
 * nothing is never scored green to begin with — so what is left is a collector
 * that runs one file and skips another. Named because a `true` here is read as
 * covering the whole run.
 */
export declare function runControlMutant(
  probeTree: string,
  probeFile: string,
  deadlineAt?: number,
  now?: () => number,
): boolean | null;
export declare function runOneMutant(
  probeTree: string,
  mutant: MutantCandidate,
  probes: string[],
  deadlineAt?: number,
  now?: () => number,
  dependencyRoot?: string,
): MutantResult;
export declare const testEfficacyCommand: CommandModule;
