/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
/** Why a drive stopped. Every value is a fact about the run, not a verdict. */
export type DriveOutcome =
  /** The sentinel was reached; `exitCode` is the driven script's own. */
  | 'completed'
  /** Readiness never arrived within the budget — nothing was driven. */
  | 'not-ready'
  /** Driven, but the sentinel never appeared before the deadline. */
  | 'timed-out'
  /** Stopped because its output crossed the log cap — no verdict, by design. */
  | 'overflowed'
  /** The harness itself could not run (no tmux, server would not start). */
  | 'unavailable';
export interface DriveReport {
  outcome: DriveOutcome;
  /**
   * True only for `completed`. The gate every reader should branch on, for the
   * reason `base-tree` has one: an observation from a run that never finished
   * is not a weaker observation of the same thing, it is a different thing.
   */
  observed: boolean;
  /** The driven script's exit code; null unless the sentinel was reached. */
  exitCode: number | null;
  /** Milliseconds spent waiting for readiness — reported even when it arrived. */
  readyAfterMs: number | null;
  /** Milliseconds from drive start to sentinel (or to the deadline). */
  droveForMs: number;
  /** Everything the pane held, trimmed. Partial unless `observed`. */
  output: string;
  /** True when `output` was cut by the capture cap rather than by the sentinel. */
  truncated: boolean;
  /** A stale server from an earlier run that this one had to kill first. */
  killedStale: boolean;
  note: string;
}
export interface DriveArgs {
  /** The script to drive. Runs inside the tmux window; its exit code is captured. */
  script: string;
  /** Working directory for both the readiness probe and the script. */
  cwd: string;
  /**
   * Shell command polled until it exits 0 — the readiness signal. Omit it and
   * the drive starts immediately, which is honest for a script that has nothing
   * to wait for and dishonest for anything that binds a port.
   */
  ready?: string;
  /** Seconds to wait for readiness before giving up. */
  readyTimeout: number;
  /** Seconds to wait for the sentinel after the drive starts. */
  timeout: number;
  out?: string;
  /**
   * tmux server name. Namespaced per run so a leaked server from another PR
   * cannot be captured from, or killed, by this one.
   */
  server: string;
  /** Test seam — production shells out for real. */
  exec?: (cmd: string, args: string[], input?: string) => ExecResult;
  /** Test seam — production derives it from `server`. */
  logPath?: string;
}
export interface ExecResult {
  status: number | null;
  stdout: string;
  stderr: string;
}
/** Single-quote a path for `bash -lc`, closing over any embedded quote. */
export declare function shellQuote(v: string): string;
export declare const DRIVE_SENTINEL = '__QWEN_REVIEW_DRIVE_DONE__';
/**
 * The wrapper the driven script runs inside.
 *
 * The sentinel carries the exit code with it on ONE line, because the two facts
 * are read from the same capture and a capture that caught the marker but not
 * the code would report `completed` with an unknown result.
 *
 * Emitted from a `trap … EXIT`, not from a trailing `echo`. A drive script
 * reports its result by calling `exit N` — that is what `exit` is for — and
 * `exit` terminates the shell immediately, so a trailing echo is never reached
 * and `set +e` does nothing about it. Measured: `echo failing; exit 17` came
 * back as `timed-out` with a null exit code, i.e. a run that finished in
 * milliseconds and told us its answer was reported as one that never finished.
 * The trap fires on every way out — falling off the end, an explicit `exit`,
 * or an abort under `set -e`.
 *
 * And it writes to its OWN file, not into the captured stream. The log is
 * size-capped at the write end, and a cap on the stream is a cap on the
 * sentinel too: measured, a script printing 200k lines then `exit 5` had its
 * sentinel swallowed by the closed pipe and came back `timed-out` with a null
 * code — the same wrong answer, reintroduced by the fix for a different
 * problem. Two facts, two channels: the log may be trimmed, the verdict may
 * not.
 */
export declare function wrapScript(
  script: string,
  sentinelPath: string,
  sentinel?: string,
): string;
/** Parse the sentinel line back out of a capture. Null when it is not there. */
export declare function sentinelExitCode(
  capture: string,
  sentinel?: string,
): number | null;
/** Trim a capture to the cap, keeping the TAIL — the end is where the result is. */
export declare function trimCapture(s: string): {
  text: string;
  truncated: boolean;
};
export declare function runDrive(args: DriveArgs): DriveReport;
export declare const driveCommand: CommandModule;
