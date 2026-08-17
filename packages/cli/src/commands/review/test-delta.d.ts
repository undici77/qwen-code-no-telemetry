/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import { type CommandResult } from './build-test.js';
/**
 * Test files a runner named as failing, out of one command's output.
 *
 * Two shapes cover vitest and jest, the runners build-test drives:
 * `FAIL  src/x.test.ts > name` (both, in the failure section) and vitest's
 * per-file `❯ src/x.test.ts (12 tests | 3 failed)` progress line. Matching is
 * on the path token, so a `FAIL` line whose path was truncated mid-token by
 * output trimming simply does not match — an unparsed failure surfaces as a
 * count mismatch in the caller's disclosure, never as an invented path.
 */
export declare function failingFilesOf(output: string, root?: string): string[];
/** Strip the run's own root (and any leading `./`) so the two sides compare. */
export declare function relativeToRoot(file: string, root: string): string;
/** One rerun: the same command, in the base tree. */
export interface DeltaEntry {
  command: string;
  /** Failing test files parsed from the PR-side report's captured output. */
  prFailingFiles: string[];
  /** Failing test files from the base-side rerun. */
  baseFailingFiles: string[];
  /** Failing on the PR side only — the PR's own, by measurement. */
  netNew: string[];
  /** Failing on BOTH sides — pre-existing, whatever file the diff touches. */
  shared: string[];
  base: CommandResult;
  /**
   * True when the PR side named no parseable failing file although the
   * command failed — the delta for this command proves nothing, and the
   * path-based judgment stays in force. Disclosed, never silently dropped.
   */
  unparsed: boolean;
  /**
   * True when the PR-side output this read was already trimmed by `build-test`.
   * The failing-file list may be short, which can only understate `shared`.
   */
  prTruncated: boolean;
}
export interface TestDeltaReport {
  entries: DeltaEntry[];
  /** Union across entries, deduplicated. */
  netNew: string[];
  shared: string[];
  /**
   * Commands the whole-command budget could not fit — their failures stay
   * unattributed. A STRUCTURED field, not prose only: `mutants.skippedForBudget`
   * and `hunks.skippedForBudget` are what Agent 7's brief teaches a reader to
   * check, and an equivalent discoverable only by substring-matching `note` is
   * the silent cap the same brief rules out.
   */
  skippedForBudget: string[];
  note: string;
}
export interface TestDeltaArgs {
  report: string;
  baseline: string;
  out?: string;
  /**
   * The PR worktree the report's failures were produced in — its root is
   * stripped so both sides compare as repo-relative paths. Named for yargs'
   * camel-cased `--pr-worktree`; a field named for the flag itself would read
   * `undefined` on every real invocation.
   */
  prWorktree?: string;
  timeout: number;
  /** Test seam — production spawns the real command. */
  exec?: (command: string, cwd: string, timeoutMs: number) => BaseRunResult;
  /** Injectable clock, for tests only — the budget math cannot be driven to
   *  its cutoff in real time. Matches `test-efficacy`'s seam; without it a
   *  test has to reassign the global `Date.now`. */
  now?: () => number;
}
/**
 * A base-side rerun, plus what it measured BEFORE its output was bounded.
 *
 * `output` is trimmed for the report, and `trimOutput` rescues only module
 * errors and runner summaries out of the omitted middle — not the per-file
 * `FAIL` lines this command parses. A base suite with a failure section over
 * the tail budget would therefore lose failing files into the gap, and a
 * SHORTER base set is the dangerous direction: `netNew` is the PR side minus
 * the base side, so every file trimming hid becomes a fabricated Critical
 * attributed to this PR by "measurement". Parse the raw text, report the
 * bounded one.
 */
export interface BaseRunResult extends CommandResult {
  /** Parsed from the untrimmed output. Absent from a seam that predates this. */
  failingFiles?: string[];
}
export declare function runTestDelta(args: TestDeltaArgs): TestDeltaReport;
export declare const testDeltaCommand: CommandModule;
