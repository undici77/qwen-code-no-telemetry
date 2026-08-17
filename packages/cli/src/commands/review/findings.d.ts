/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
/** The severity ladder, most severe first — this array IS the sort order. */
export declare const SEVERITIES: readonly [
  'Critical',
  'Suggestion',
  'Nice to have',
];
export type Severity = (typeof SEVERITIES)[number];
export declare const CONFIDENCES: readonly ['high', 'low'];
export type Confidence = (typeof CONFIDENCES)[number];
/**
 * What happened to a finding once the fixer ran.
 *
 * `no_change_needed` is not a synonym for `skipped`, and collapsing the two is
 * how a review quietly retracts a finding: `skipped` says "real, not applied"
 * and stays on the reader's plate; `no_change_needed` says "this was wrong, or
 * already handled" and takes it off. They are different claims about the code,
 * so they are different words, and the fixer has to pick one.
 */
export declare const OUTCOMES: readonly [
  'fixed',
  'skipped',
  'no_change_needed',
];
export type Outcome = (typeof OUTCOMES)[number];
/** Where a finding came from — the tag that decides whether it was verified. */
export declare const SOURCES: readonly [
  'review',
  'build',
  'test',
  'probe',
  'lint',
];
export type Source = (typeof SOURCES)[number];
/** One location a finding applies to. A pattern aggregate carries several. */
export interface FindingLocation {
  file: string;
  line?: number;
  /** The verbatim snippet `resolve-anchors` turns into a line number. */
  anchor?: string;
}
export interface Finding {
  id: string;
  severity: Severity;
  confidence: Confidence;
  source: Source;
  /** One sentence stating the defect. */
  summary: string;
  /** `summary` compressed to <= 60 characters, for a list UI. */
  shortSummary: string;
  /** The concrete trigger and wrong outcome — the finding's evidence. */
  failureScenario: string;
  suggestedFix?: string;
  /** Free-form kebab-case tag (`correctness`, `security`, `test-coverage`, …). */
  category?: string;
  /** Every location, in report order. A standalone finding has exactly one. */
  locations: FindingLocation[];
  /**
   * Local evidence-image paths attached by the review (screenshots, rendered
   * output). Published to the designated assets repo by `publish-assets`,
   * which weaves the resulting URLs into `assets`.
   */
  assetFiles?: string[];
  /** Commit-pinned URLs of published evidence images (see `publish-assets`). */
  assets?: string[];
  /** Set only after the fixer ran. */
  outcome?: Outcome;
  /** The fixer's reason, carried from the ledger — mainly for `skipped`. */
  outcomeNote?: string;
  /**
   * Set when `--test-delta` lowered this finding's severity: the test file the
   * measurement matched. Structured, not prose only — the sibling command makes
   * the same argument about its own budget skips, and for the same reason. A
   * later round reads the artifact, not the paragraph, so a hold discoverable
   * only by substring-matching `failureScenario` is a hold the round ledger
   * cannot see, and it re-files the finding at whatever severity it likes.
   */
  heldByMeasurement?: {
    file: string;
  };
}
export interface FindingsReport {
  findings: Finding[];
  counts: {
    total: number;
    bySeverity: Record<Severity, number>;
    byConfidence: Record<Confidence, number>;
    /** Present only once outcomes have been recorded. */
    byOutcome?: Record<Outcome, number>;
    /** How many findings a measurement lowered. Counted, not inferred from
     *  prose, so a later round can act on it. */
    held: number;
  };
  /** True once every finding carries an outcome. */
  outcomesRecorded: boolean;
}
/** `shortSummary`, when the caller did not supply one. */
export declare function compressSummary(summary: string, max?: number): string;
/**
 * Validate and canonicalize the orchestrator's findings list.
 *
 * Strict about the fields that carry evidence and lenient about the rest, for
 * the reason the finding format gives: a finding with no failure scenario is not
 * a finding, so an entry that omits one is a malformed entry rather than a
 * finding with a blank field. `shortSummary` and `category` are conveniences and
 * are derived or dropped, never demanded.
 */
export declare function validateFindings(raw: unknown): Finding[];
/**
 * Hold a Critical that blames the PR for a test failure the base tree already
 * had — the one contradiction this pipeline measures and then used to ignore.
 *
 * `test-delta` reruns the PR side's failed test commands on the merge base and
 * splits the failures into `netNew` (the PR's own) and `shared` (failing on both
 * sides, whatever files the diff touches). A Critical naming a `shared` test file
 * is asserting a breakage against a file that was already red without the PR.
 *
 * Measured on #8368: `AuthDialog.test.tsx` was `shared` in two independent runs,
 * and the base tree fails the very same test — `drives API key provider steps
 * from endpoint options metadata` — at merge-base `e967cc90`. A Critical reading
 * "height-based pagination breaks the pre-existing test" was carried across four
 * rounds and into the composed review anyway, because nothing reconciled the two
 * artifacts. The path rule this replaced was closed off in `test-delta` itself;
 * the round ledger reopened it from the other side.
 *
 * Downgrade, never drop. The measurement contradicts the SEVERITY — the PR is
 * not breaking a passing test — but the finding may still describe something
 * real about a test that is red for two reasons. A Suggestion stays in front of
 * a human, carrying the measurement that demoted it; a deletion would not. Only
 * Critical is touched, and nothing is ever raised.
 */
export declare function holdCriticalsFailingOnBase(
  findings: readonly Finding[],
  sharedFailingFiles: readonly string[],
): {
  findings: Finding[];
  held: Array<{
    id: string;
    file: string;
  }>;
  readjudicated: Array<{
    id: string;
    file: string;
  }>;
};
/**
 * Every file `test-delta` measured as failing on BOTH sides, repo-relative.
 *
 * Read from `entries` only, because only an entry carries the `--workspace=`
 * its paths are relative to. The top-level `shared` is the union of the same
 * files with that context already lost, so it is never honoured — an artifact
 * with no entries measured nothing this can safely act on, and a bare
 * workspace-relative path matches inside any package.
 *
 * A file measured `netNew` anywhere in the run is dropped even if some other
 * command called it `shared`: the two claims cannot both license a hold, and the
 * direction that suppresses a real finding is the worse one to get wrong.
 *
 * A shape it does not recognise yields none: an unreadable measurement must not
 * silently hold a Critical back, and must not throw either — the review has
 * findings to report whether or not this file parsed.
 */
export declare function sharedFailingFilesOf(raw: unknown): {
  shared: string[];
  unidentifiable: string[];
};
/** Most severe first, then high-confidence before low, then file and line. */
export declare function sortFindings(findings: readonly Finding[]): Finding[];
/** The outcome ledger, as the fixer hands it back. */
export interface OutcomeEntry {
  id: string;
  outcome: Outcome;
  /** Why, for `skipped` — the reader is owed a reason for work not done. */
  note?: string;
}
export declare function validateOutcomes(raw: unknown): OutcomeEntry[];
/**
 * Merge the ledger into the findings — and refuse anything less than full
 * coverage.
 *
 * Both directions are errors, and neither is pedantry. An **unaccounted**
 * finding is one the fixer walked past: the reader sees a shorter list and has
 * no way to learn what fell off it. An **unknown** id is a report about a
 * finding this review never made, which means the ledger was built against some
 * other list — and merging it would attach outcomes to the wrong rows.
 */
export declare function applyOutcomes(
  findings: readonly Finding[],
  outcomes: readonly OutcomeEntry[],
): Finding[];
export declare function buildReport(
  findings: readonly Finding[],
): FindingsReport;
/** One line per finding, for a terminal that will not render the JSON. */
export declare function renderFindings(report: FindingsReport): string[];
export declare const findingsCommand: CommandModule;
