/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
/** Which `env:`/`defaults:` level a resolved value came from. */
export type EnvScope = 'workflow' | 'job' | 'step';
export interface ExtractedStep {
  workflow: string;
  job: string;
  /** The step's `name:` (or `id:`), plus its index within the job. */
  step: string;
  index: number;
  shell: string;
  workingDirectory?: string;
  /**
   * The EFFECTIVE `env:` the runner would hand the step — workflow, job and
   * step levels merged, nearest wins — values verbatim (they may hold
   * `${{ … }}`). Step-level only would be a lie: a step whose behaviour turns
   * on a job-level `NODE_ENV` is exactly the by-hand transcription error this
   * command exists to remove.
   */
  env: Record<string, string>;
  /** Which level each effective `env:` key came from. */
  envSources: Record<string, EnvScope>;
  /**
   * Every distinct `${{ … }}` expression in anything this command carries —
   * the script, the effective env, the working directory, the shell template.
   * The stub list, and the caller reads it as complete.
   */
  expressions: string[];
  /** Top-level commands the script invokes — a starting point for stubbing. */
  invokes: string[];
  /** Where the executable was written. */
  scriptPath: string;
}
/**
 * Every distinct `${{ … }}` site, in order of first appearance. Scans forward
 * to the closing `}}` rather than matching `[^}]*`: a GitHub expression may
 * legally contain a brace — `format('refs/pull/{0}/head', …)`,
 * `fromJSON('{"a":1}')` — and a pattern that stops at the first `}` does not
 * mis-list such a site, it DROPS it. Silence is the one failure this list
 * cannot afford: the caller reads it as "these are all the values to supply",
 * so a missing entry is a value that never gets stubbed.
 */
export declare function expressionsOf(...texts: string[]): string[];
export declare function invokedCommandsOf(script: string): string[];
/**
 * `text` rendered as comment lines — EVERY line, not just the first. A YAML
 * block scalar (`SETTINGS_JSON: |`) reaches here as a multi-line string, and a
 * continuation line that escaped the `#` would sit in command position: under
 * the `set -e` this header emits, the extracted step then dies in its own
 * preamble, before its `run:` body ever runs.
 */
export declare function commentLines(
  firstPrefix: string,
  text: string,
): string[];
export interface ExtractStepArgs {
  workflow: string;
  job: string;
  step: string;
  out: string;
}
export declare function runExtractStep(args: ExtractStepArgs): ExtractedStep;
export declare const extractStepCommand: CommandModule;
