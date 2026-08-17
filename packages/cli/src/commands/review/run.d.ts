/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
export interface RunReviewArgs {
  target?: string;
  effort?: string;
  comment: boolean;
  json: boolean;
  failOn: 'none' | 'request-changes';
  timeoutMinutes: number;
  approvalMode: string;
  quiet: boolean;
}
export interface RunReviewResult {
  completed: boolean;
  event: string | null;
  verdictLine: string | null;
  baseEvent: string | null;
  cappedBy: string[];
  downgraded: boolean;
  downgradedFrom: string | null;
  remediation: string[];
  composedPath: string | null;
  reportPath: string | null;
  childExitCode: number | null;
  childSignal: string | null;
  timedOut: boolean;
  durationMs: number;
}
/** The /review invocation the child runs — built from flags, never hand-typed. */
export declare function buildReviewPrompt(args: {
  target?: string;
  effort?: string;
  comment?: boolean;
}): string;
/**
 * The newest file under `dir` matching `pattern` whose mtime is at or after
 * `startMs`, or null. Pre-existing artifacts from earlier reviews in the same
 * repo must not be mistaken for this run's verdict — a stale composed JSON says
 * whatever the LAST review decided, which is exactly the wrong thing to
 * republish — so anything older than the run is invisible here.
 */
export declare function newestArtifactSince(
  dir: string,
  pattern: RegExp,
  startMs: number,
): string | null;
/**
 * Exit code contract: 0 = the review completed (whatever it decided); 1 = it
 * never reached a verdict (child failed, timed out with no verdict captured,
 * or left no composed artifact); 3 = it completed AND the caller asked
 * --fail-on request-changes AND the event is REQUEST_CHANGES. 3, not 2 — yargs
 * exits 1 on usage errors and some shells reserve 2, so a CI gate can tell
 * "review is blocking" from "the tool broke" without parsing anything.
 */
export declare function exitCodeFor(
  completed: boolean,
  event: string | null,
  failOn: 'none' | 'request-changes',
): number;
/**
 * Terminate the child's process group — the detached relaunch wrapper AND the
 * real review it spawned. On POSIX a negative pid names the group; on Windows
 * there are no POSIX process groups and a negative pid is meaningless, so fall
 * back to `taskkill /T`, which walks the tree the detached child spawned. Both
 * are best-effort: killing a group that is already gone throws, and that is
 * fine.
 */
export declare function killProcessGroup(
  pid: number,
  signal: NodeJS.Signals,
): void;
export declare const runCommand: CommandModule;
