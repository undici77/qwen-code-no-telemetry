/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import { type ReviewToolchainAdapter } from './lib/toolchain.js';
import { type TestScope } from './lib/workspace-scope.js';
/**
 * The root toolchains build-test can select. One today; the registry exists so
 * the next one is a registration rather than another branch in this file.
 */
export declare const toolchainAdapters: readonly ReviewToolchainAdapter[];
/** A command this run actually executed, and what it did. */
export interface CommandResult {
    command: string;
    /** `null` when the command was killed by the deadline. */
    exitCode: number | null;
    seconds: number;
    timedOut: boolean;
    /** Trimmed output: enough to correlate a failure with the diff. */
    output: string;
    /**
     * The deadline the command was actually given (ms) — the whole-call budget
     * shortens it below the per-command default, and the timeout note must
     * quote the number that fired, not the flag default.
     */
    deadlineMs?: number;
}
export interface BuildTestReport {
    /** The scoped toolchain that ran, or `unsupported` when selection was unsafe. */
    toolchain: 'npm' | 'unsupported';
    /** Workspace dirs the diff changed. */
    affected: string[];
    /** What was built, dependencies first — after any widening. */
    buildSet: string[];
    /**
     * Packages the whole-call budget stopped BEFORE their build ran, when that
     * happened. Structural for the same reason `notRun` is: a tree missing
     * these was never fully compiled, and consumers of this report
     * (`base-tree`'s availability gate) must be able to see that without
     * parsing prose.
     */
    notBuilt?: string[];
    /** Packages the compiler asked for that the dependency graph had not predicted. */
    widenedWith: string[];
    install: CommandResult | null;
    build: CommandResult[];
    test: CommandResult[];
    /**
     * What the test phase covered, so the review can state exactly what was and
     * was not run: `workspaces` lists exactly the suites the run executes, and
     * `caveat` — when present — says why that set may be incomplete. Only set
     * for workspace monorepos on a test-running call: a single-package repo's
     * one suite IS its full suite, and a build-only probe runs no tests, so
     * neither may claim a scoping decision it never made.
     */
    testScope?: TestScope;
    /**
     * True when every build and test command exited 0. An install that exits non-zero
     * but leaves a usable tree (a failed `prepare` hook) does NOT set this false — the
     * build below is the authoritative signal, and the `note` explains the install.
     */
    ok: boolean;
    /**
     * Commands killed by the deadline. These are NOT findings: a review must not
     * file "the build timed out" as a defect in someone's pull request.
     */
    timedOut: string[];
    /** Why the run did what it did, in one line — rendered into the agent's report. */
    note: string;
}
/**
 * Did this spawn die on its deadline?
 *
 * Exported so `test-delta`'s rerun asks the SAME question rather than
 * re-deriving it — a copy there used `error.message.includes('ETIMEDOUT')`,
 * which misses an external SIGTERM and fed a silent "base is green".
 */
export declare function spawnTimedOut(r: {
    error?: Error;
    signal?: NodeJS.Signals | null;
    status?: number | null;
}): boolean;
export declare function trimOutput(s: string): string;
/**
 * The environment every build/test/install command runs under.
 *
 * `QWEN_SKIP_PREPARE` is the load-bearing entry, and it is exported and tested so
 * a future edit to this env cannot silently drop it. Without it, `npm ci` builds
 * the whole project through this repo's `prepare` hook — `npm run build` + `npm
 * run bundle` over every workspace, ~190s — which is entirely wasted, because this
 * command does its own *scoped* build right after. `prepare.js` reads this exact
 * flag, and its own comment names this exact case: "Release workflow jobs set this
 * when they run explicit build/bundle steps after npm ci." In a TUI A/B on PR
 * #6866 the install-time full build was the single largest thing left in Agent 7.
 * Harmless on any repo that does not read it.
 */
export declare function buildRunEnv(base?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export { unresolvedWorkspaceDeps } from './lib/npm-toolchain.js';
interface BuildTestArgs {
    plan: string;
    worktree: string;
    out?: string;
    timeout: number;
    install: boolean;
    /**
     * Build, then stop — do not run the changed workspaces' tests.
     *
     * For the merge-base tree an A/B probe compares against. Base's tests were
     * green before this PR existed and running them measures nothing about it;
     * what the probe needs from that tree is a compiled `dist/` to run against,
     * and paying for the suite twice is the difference between an A/B a reviewer
     * will use and one they will skip. Defaults false, so the PR-side call is
     * unchanged.
     */
    buildOnly?: boolean;
    /**
     * Whole-call wall-clock budget in seconds (default: 2× `timeout` − 30s of
     * headroom for process startup and the report write, floored at one
     * per-command deadline). Measured from the top of the call — install and
     * build time count against it. The closure's per-command deadlines SUM, and
     * a large one sums past the tool timeout the brief welds onto the call —
     * whose outer kill discards the report. Each suite is attempted with
     * whatever of this budget remains (a suite killed at the boundary is
     * reported as a timeout — infrastructure, not a finding); only suites never
     * attempted are named in `notRun`.
     */
    budget?: number;
    /**
     * How to run a command. Injectable so the tests can build the states that are
     * hard to force out of real npm — chiefly the one that cost a live review: an
     * install that exits non-zero and leaves a working `node_modules` behind.
     */
    exec?: (command: string, cwd: string, timeoutMs: number) => CommandResult;
}
export declare function runBuildTest(args: BuildTestArgs): BuildTestReport;
export declare const buildTestCommand: CommandModule;
