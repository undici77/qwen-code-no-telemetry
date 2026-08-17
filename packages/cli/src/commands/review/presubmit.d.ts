/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface FindingAnchor {
  path: string;
  line: number;
}
interface CheckRun {
  name: string;
  status: string;
  conclusion: string | null;
  /** ISO timestamps from the API — how re-runs of one name are ordered. */
  started_at?: string | null;
  completed_at?: string | null;
  details_url?: string;
  html_url?: string;
}
interface CommitStatus {
  context: string;
  state: string;
}
/**
 * Read the `--new-findings` file into a validated anchor list, or `null` when
 * it cannot be trusted. `null` is the fail-safe value: `classifyHeadDrift`
 * treats an unknown finding set as at-risk, so a malformed file downgrades
 * the verdict rather than proving a false all-clear. A shorter-than-real list
 * would be the dangerous outcome (a dropped finding reads as disjoint), so
 * any entry lacking a string `path` rejects the WHOLE file rather than being
 * skipped.
 */
export declare function parseFindingsFile(path: string): FindingAnchor[] | null;
/** Best-effort delta between the reviewed SHA and the live head. */
export interface CompareSummary {
  /** GitHub compare `status`: ahead | behind | diverged | identical.
   * `diverged` means the reviewed commit is no longer an ancestor — a
   * force-push rewrote the history the review read. */
  status: string;
  aheadBy: number;
  /** Files the unreviewed commits touched (capped at FILES_TOUCHED_CAP). */
  filesTouched: string[];
  /** Count before the cap. When it exceeds `filesTouched.length` the list
   * was cut — and the compare endpoint itself caps at 300, so a total of
   * 300 may also be incomplete. `anchorsAtRisk` accounts for both. */
  filesTotal: number;
}
export interface HeadDrift {
  reviewedSha: string;
  liveHeadSha: string;
  drifted: boolean;
  compare: CompareSummary | null;
  /**
   * The submit-or-restart decision, computed here rather than delegated to
   * prose: could the unreviewed commits have invalidated the review's inline
   * anchors? True whenever the answer cannot be PROVEN no — compare
   * unavailable, history diverged (force-push), the touched-file list
   * truncated (locally or by the API's own 300 cap), or no findings list
   * supplied to intersect against. A dropped path cannot intersect, so a
   * naive intersection over a truncated list fails open — measured on a real
   * 283-file base-merge drift where the 50 surviving alphabetically-first
   * paths contained no packages/cli or packages/core file at all, i.e. the
   * gate read "safe" on exactly the largest drifts.
   */
  anchorsAtRisk: boolean;
}
/**
 * Did the PR advance while the review ran, and what does that do to the
 * verdict?
 *
 * A drifted head means commits exist on the PR that no agent read; an
 * Approve issued past them certifies code nobody reviewed. Dogfooded on a
 * live PR whose head moved four times in one day: the run that noticed did
 * so by luck (a context compression happened to trigger a re-fetch), and
 * runs that would not have noticed had no gate. So drift is detected here,
 * at the submission gate, and the downgrade rides the machinery that
 * already exists rather than a new rule the model must remember.
 *
 * `findingPaths` is the file set the review's inline comments anchor to
 * (null = unknown, which is fail-safe). Kept pure for unit testing; the gh
 * calls stay in `runPresubmit`.
 */
export declare function classifyHeadDrift(
  reviewedSha: string,
  liveHeadSha: string,
  compare: CompareSummary | null,
  findingPaths: string[] | null,
): {
  headDrift: HeadDrift;
  downgradeReason?: string;
};
export declare function classifyCi(
  checkRuns: CheckRun[],
  statuses: CommitStatus[],
): {
  class: 'all_pass' | 'any_failure' | 'all_pending' | 'no_checks';
  failedCheckNames: string[];
  /**
   * Checks that never executed at this commit. NOT a downgrade on its own —
   * most are routing jobs, and a docs-only PR legitimately skips the test
   * matrix. It is a disclosure: Step 7 rules on whether a skipped check is
   * one that would have exercised THIS diff, which presubmit cannot know.
   */
  skippedCheckNames: string[];
  totalChecks: number;
};
export declare const presubmitCommand: CommandModule;
export {};
