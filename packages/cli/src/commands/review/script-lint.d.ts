/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
/** The deterministic checkers this command dispatches. */
export type LintTool = 'shellcheck' | 'actionlint' | 'hadolint';
/** One diagnostic, normalised across the three tools. */
export interface LintFinding {
  /** New-side line in the post-change file. */
  line: number;
  /** The tool's own rule id — `SC2086`, `DL3006`, or the actionlint kind. */
  code: string;
  /** `error` | `warning` | `info` | `style`. */
  level: string;
  message: string;
  /**
   * Whether `line` falls inside a hunk this diff changed. A lint finding on an
   * unchanged line is pre-existing — real, but not this PR's to answer for — so
   * the agent keys severity on this, exactly as Build & Test keys it on whether
   * the failing file was changed.
   */
  inDiff: boolean;
}
/** One executable file that had an applicable linter, and what it said. */
export interface FileLint {
  path: string;
  tool: LintTool;
  findings: LintFinding[];
}
export interface ScriptLintReport {
  /** Files an installed linter actually checked. */
  checked: FileLint[];
  /**
   * Executable files whose linter is **not installed** — checked by nothing, and
   * said so. Never silently dropped: an unrun checker is not a clean file.
   */
  skipped: Array<{
    path: string;
    tool: LintTool;
    reason: string;
  }>;
  /**
   * Files whose linter **ran but failed** — a spawn error, a signal, an
   * unexpected exit status, a `maxBuffer` overflow. Distinct from `skipped` (not
   * installed): a checker that crashed reviewed nothing, so we fail closed — an
   * errored file forces `ok` false, it is never a clean pass on the tool's silence.
   */
  errored: Array<{
    path: string;
    tool: LintTool;
    reason: string;
  }>;
  /**
   * Files a checker **deliberately declines** to lint (not absent, not crashed) —
   * today only actionlint, whose embedded-shell source mapping is not yet parsed.
   * Distinct from `skipped` precisely because the verdict must treat it
   * differently: a deferred checker is a known tool limitation, disclosed but NOT
   * capping — actionlint is installed on ~15% of PRs (every workflow change), and
   * capping all of them on a checker we choose not to run would make them
   * un-Approvable forever, which "install the tool" cannot fix.
   */
  deferred: Array<{
    path: string;
    tool: LintTool;
    reason: string;
  }>;
  /**
   * True when every applicable linter ran cleanly **and** no finding on a changed
   * line is above `style` — `info`/`warning`/`error` all count against it (the
   * SC2086 word-split is `info`, and it blocks). A run error (`errored[]`
   * non-empty) also makes this false. An uninstalled linter (`skipped[]`) does
   * not flip `ok`, but is disclosed for the agent to report as unreviewed.
   */
  ok: boolean;
  /** One line for the agent's report. */
  note: string;
  /**
   * A hash of the diff this report was produced against (the plan's captured
   * diff). `compose-review` re-hashes the plan's current diff and treats a
   * mismatch as no report. Content, not commit: it identifies **what was
   * reviewed**, so it is correct for a PR (a different commit → a different diff)
   * AND for a local review of uncommitted work (an edit changes the diff even
   * when `HEAD` does not) — a stale report from either can no longer certify.
   * `undefined` only when the diff could not be read.
   */
  diffHash?: string;
}
interface ScriptLintArgs {
  plan: string;
  worktree: string;
  out?: string;
}
/**
 * Which linter owns a path by its **name alone** — no file contents needed.
 *
 * Split out from `toolFor` because the roster (`lib/roster.ts`) must decide
 * whether to require the script-lint agent knowing only the plan's file paths,
 * not the files themselves. One detector, so the roster and the command cannot
 * disagree about what counts as an executable script.
 */
export declare function pathTool(path: string): LintTool | null;
/** Which linter owns a path, or null when it is not executable code we check.
 *  A name match wins; otherwise an extensionless script is decided by its shebang
 *  (a git hook, a CI helper) — which is why this one needs the file's first line. */
export declare function toolFor(
  path: string,
  firstLine: string,
): LintTool | null;
/** The outcome of pointing a linter at one file. */
export type ToolRun =
  | {
      kind: 'ok';
      stdout: string;
    }
  | {
      kind: 'missing';
    }
  | {
      kind: 'error';
      reason: string;
    };
/**
 * How `runScriptLint` invokes a linter. Injectable so a test can feed canned
 * output for all three tools — and exercise the fail-closed paths — without the
 * binaries installed; the default is the real `spawnSync`-backed runner.
 */
export type ToolRunner = (tool: LintTool, absPath: string) => ToolRun;
/**
 * The argv and environment for invoking one linter — the config-isolation layer,
 * factored out of `runTool` so it can be asserted WITHOUT spawning a binary. Every
 * defence here is load-bearing: a PR that adds its own linter config must not be
 * able to suppress the findings we run the linter to catch.
 *
 * - shellcheck: `--norc` ignores a PR-controlled `.shellcheckrc` (which could
 *   `disable=SC2086`), and `SHELLCHECK_OPTS` is dropped from the env for the same
 *   reason — configuration comes from us, not the diff.
 * - hadolint: reads a config from `--config`, then a `.hadolint.yaml` in the process
 *   CWD, then `$XDG_CONFIG_HOME/hadolint.yaml` — and NOT from any env var (real
 *   hadolint 2.14.0 has no `HADOLINT_CONFIG`; an earlier env-based attempt was a
 *   silent no-op, letting the diff's own `.hadolint.yaml` suppress findings because
 *   `--worktree .` runs the linter inside the reviewed tree). Isolation is therefore
 *   `--config <private neutral file>`, which overrides both the cwd and XDG configs.
 *   Set only for a hadolint run, and only when a private config exists; `runTool`
 *   fails hadolint closed when it does not (so it never runs unisolated).
 *
 * Also carries `timeoutMs`: the wall-clock bound `runTool` puts on the spawn, kept
 * here so the bound is one asserted value rather than a literal buried in the spawn.
 */
export declare function buildToolInvocation(
  tool: LintTool,
  absPath: string,
): {
  argv: string[];
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
};
/** A hash of the captured diff — the identity of *what was reviewed*. `undefined`
 *  when the diff cannot be read; the gate treats an absent hash on either side as
 *  unverifiable and fails closed (it does NOT skip the freshness check).
 *  Exported so `compose-review`'s gate hashes the plan's diff the SAME way. */
export declare function diffHashOf(diffPath: unknown): string | undefined;
export declare function runScriptLint(
  args: ScriptLintArgs,
  runner?: ToolRunner,
): ScriptLintReport;
export declare const scriptLintCommand: CommandModule;
export {};
