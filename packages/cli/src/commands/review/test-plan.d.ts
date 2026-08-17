/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import type { BuildTestReport } from './build-test.js';
/** What kind of assertion a claim is, which decides how it can be ruled. */
export type ClaimKind = 'path' | 'command' | 'count';
export type ClaimVerdict =
  /** Checked, and the tree agrees. */
  | 'reproduces'
  /** Checked, and the tree disagrees. Sound: a real defect in the Test Plan. */
  | 'contradicted'
  /**
   * Checked against something adjacent, and the numbers are not equal. NOT a
   * contradiction — see the header: the claim and the observation may be about
   * different suites, and this command cannot tell. Reported, never blocking.
   */
  | 'differs'
  /** Nothing here can settle it. Disclosed as scope, never capping. */
  | 'unchecked';
export interface TestPlanClaim {
  kind: ClaimKind;
  /** The claim as the author wrote it, for quoting back. */
  text: string;
  verdict: ClaimVerdict;
  /** What this command observed, when it observed anything. */
  observed?: string;
  /** One line: why the verdict is what it is. Rendered to the reader verbatim. */
  note?: string;
}
export interface TestPlanReport {
  /** False when the PR body has no Test Plan section — not a finding. */
  found: boolean;
  /** The heading the section was found under, verbatim. */
  heading?: string;
  claims: TestPlanClaim[];
  /**
   * Hash of the diff this ran against. `compose-review` re-hashes the plan's
   * current diff and refuses a report that does not match, exactly as it does
   * for `script-lint` — a report from an earlier commit is not this review's.
   */
  diffHash?: string;
  /** Why the run did what it did, in one line. */
  note: string;
}
/**
 * Pull the Test Plan section out of a PR body.
 *
 * Ends at the next heading of the SAME OR HIGHER level (`###` closes on `###`
 * and on `##`, not on `####`), so a Test Plan with sub-headings keeps them. The
 * bold form ends at the next heading of any level or the next standalone bold
 * line, which is as much structure as that form carries.
 */
export declare function extractTestPlanSection(body: string): {
  heading: string;
  content: string;
} | null;
/**
 * Turn a Test Plan section into the claims this command can rule on.
 *
 * Only three kinds are extracted, and prose is not one of them: a sentence has
 * no deterministic ruling, so lifting it into the report as an `unchecked`
 * entry would produce a list the length of the Test Plan and tell the reader
 * nothing they could not get by reading it. The `unchecked` verdict is for a
 * claim of a checkable KIND that this run could not settle — a count with no
 * observed count to compare against — which is a fact about the run.
 */
export declare function extractClaims(section: string): Array<{
  kind: ClaimKind;
  text: string;
}>;
/** Every test count the runners actually printed, summed per command. */
export declare function observedTestCounts(
  report: BuildTestReport | null,
): number[];
/** `npm run build` / `npm test` / `npm run x --workspace=y` → the script name. */
export declare function npmScriptOf(command: string): string | null;
export interface TestPlanArgs {
  plan: string;
  pr: string;
  repo: string;
  worktree: string;
  out?: string;
  /**
   * yargs' camel-case expansion turns `--build-test` into `buildTest`; naming
   * the field for the flag would read `undefined` on every real invocation and
   * silently downgrade every count claim to `unchecked`.
   */
  buildTest?: string;
  host?: string;
}
export declare function runTestPlan(
  args: TestPlanArgs,
  fetchBody?: (ownerRepo: string, pr: string) => string,
): TestPlanReport;
export declare const testPlanCommand: CommandModule;
