/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { RoleId } from './agent-briefs.js';
/**
 * How this review's diff was captured — which decides what can be asked of it.
 *
 * Inferred from the fields the capturing command wrote, rather than taken as an
 * argument: `fetch-pr` alone creates a worktree, `capture-local` alone reports the
 * untracked files it swept in, and `plan-diff` — the cross-repo lightweight path —
 * writes neither, because it has neither a pull request it can reach locally nor a
 * tree to look at.
 */
export type ReviewMode =
  /** Same-repo PR: a worktree, a PR number, a local tree to build and grep. */
  | 'pr-worktree'
  /** Uncommitted local changes or a single file: a tree, but no PR. */
  | 'local'
  /** Cross-repo lightweight: the diff and nothing else. */
  | 'diff-only';
/** The plan, as far as the roster needs it. */
export interface RosterPlan {
  ownerRepo?: unknown;
  chunks?: Array<{
    id?: unknown;
  }>;
  files?: Array<{
    path?: unknown;
    kind?: unknown;
    heavy?: unknown;
    addedLines?: unknown;
    removedLines?: unknown;
    /** Lines in the post-change file; 0 for a true deletion (see report.ts). */
    fileLines?: unknown;
  }>;
  srcDiffLines?: unknown;
  diffLines?: unknown;
  worktreePath?: unknown;
  prNumber?: unknown;
  untrackedFiles?: unknown;
  /**
   * The review's effort, as the capturing command recorded it (`--effort`).
   * `'medium'` is the balanced tier and drops the adversarial personas; anything
   * else — including absent — keeps the full roster. It lives in the plan, not in
   * a caller argument, on purpose: the roster this file computes must not be
   * shrinkable by whoever calls `requiredAgents`, or the shrink is what gets
   * called. `check-coverage`, `agent-prompt --roster` and `compose-review`'s
   * recomputation then all read the same value and cannot disagree.
   */
  effort?: unknown;
  repositoryContext?: unknown;
}
/** One agent this review must launch. */
export interface RequiredAgent {
  /** The key `agent-prompt` records its prompt under, and coverage looks up. */
  key: string;
  /** A dimension role, or a Step 3B territory. */
  role: RoleId | 'chunk';
  /** The territory a chunk agent owns. */
  chunk?: number;
  /** The heavy file an invariant agent owns. */
  file?: string;
}
export declare function reviewMode(plan: RosterPlan): ReviewMode;
/**
 * The topology gate, in code.
 *
 * The same two numbers the skill's prose turns on. It is here so the roster and
 * the reader cannot disagree about which fan-out was owed — a disagreement that
 * would show up as a review being told it forgot eleven agents it was never
 * supposed to launch.
 */
export declare function isTerritoryFanOut(plan: RosterPlan): boolean;
/** A PR number the plan actually resolved: a positive integer, as a number or the
 *  string `fetch-pr` writes. `null`, `0`, `''` and non-numeric junk are 'no PR'. */
export declare function isPositivePrNumber(value: unknown): boolean;
/**
 * Does the diff touch a file a linter owns by path — a shell script, a workflow,
 * a Dockerfile? Detected by path alone (`pathTool`), the same detector the command
 * uses, because here only the plan's file paths are in hand, not the files. A
 * shebang-only extensionless script does not trip this — the roster cannot read it.
 *
 * `compose-review`'s deterministic script-lint gate reads this to decide whether a
 * script-lint report was OWED — a diff that carries such a file but produced no
 * report fails closed to unreviewed. It is the one predicate both the orchestrator's
 * `qwen review script-lint` step and the gate that checks its output share, so they
 * cannot disagree about what counts as an executable script.
 */
export declare function hasExecutableScript(plan: RosterPlan): boolean;
/**
 * Every agent this plan requires, and the key each one's prompt is recorded under.
 *
 * Maxima are not requirements: Agent 8 is optional by construction ("launch none
 * when no domain stands out — the common case"), so it is not here. Nothing in this
 * list is discretionary. If a role is in it, a review that did not launch it has a
 * dimension nobody reviewed, and must not certify the diff.
 */
export declare function requiredAgents(plan: RosterPlan): RequiredAgent[];
