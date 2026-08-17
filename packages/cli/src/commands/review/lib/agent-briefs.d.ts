/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Every role this review can launch. Chunk agents are `chunk-<id>`. */
export type RoleId =
  | '0'
  | '1a'
  | '1b'
  | '1c'
  | '2'
  | '3a'
  | '3b'
  | '3c'
  | '4'
  | '5'
  | '6a'
  | '6b'
  | '6c'
  | '7'
  | 'test-matrix'
  | 'invariant-a'
  | 'invariant-b'
  | 'invariant-c'
  | 'verify'
  | 'reverse-audit';
/**
 * The roles a repository context may require. One list is the single source for
 * BOTH the type and the runtime guard: an allow-list the type admitted while the
 * guard rejected it (or the reverse) would make the `is` predicate a lie, so
 * neither half is written by hand any more.
 */
export declare const REPOSITORY_CONTEXT_ROLES: readonly [
  '1a',
  '1b',
  '1c',
  '2',
  '3a',
  '3b',
  '3c',
  '4',
  '5',
  '6a',
  '6b',
  '6c',
  'test-matrix',
];
export type RepositoryContextRoleId = (typeof REPOSITORY_CONTEXT_ROLES)[number];
export declare function isRepositoryContextRoleId(
  value: string,
): value is RepositoryContextRoleId;
export interface Brief {
  /** How the role is named to a human reading a coverage failure. */
  label: string;
  /**
   * How the role is named in the POSTED review body — the author's register.
   *
   * `label` above carries the run's own codename (`Agent 1c: …`), which is the
   * selector an operator acts on and means nothing on a PR page; #7550 moved
   * chunk ids out of the posted body for exactly that reason, and this field
   * does the same for role names: the dimension, said as what it checks.
   * Distinct per role — two roles sharing a phrase would merge under one
   * subject in a grouped disclosure.
   */
  publicLabel: string;
  /**
   * `publicLabel`, for the Chinese half of a bilingual posted body — rendered
   * when the PR description is written in Chinese (the plan's
   * `prDescriptionHasHan`). Same invariants: author-facing, distinct per role.
   */
  publicLabelZh: string;
  /**
   * Does a path rule belong in this agent's brief?
   *
   * The path-scoped checklists (see `path-rules.ts`) name defects in the *code*.
   * The agents that do not review code do not get them: Build & Test runs commands,
   * Issue Fidelity reads an issue, and the test matrix maps behaviours to tests.
   * Giving them a workflow-security checklist would be handing a syllabus to
   * somebody sitting a different exam.
   */
  reviewsCode?: boolean;
  /**
   * Does this agent read the diff?
   *
   * One does not, and it is not a defect: Build & Test runs commands, and its
   * evidence is their output. Everyone else who does not read the diff is a bug.
   */
  readsDiff: boolean;
  /**
   * What the agent returns, which decides the shared tail of its prompt.
   *
   * `'findings'` (the default) gets the finding format, the severity definitions
   * and the Exclusion Criteria. `'verdicts'` is the Step 4 verifier: it does not
   * file findings, it rules on the ones it was handed, so it gets the Exclusion
   * Criteria (a finding that matches one is rejected) but not the finding format —
   * its output shape is the verdict, and its brief defines that.
   */
  output?: 'findings' | 'verdicts';
  /**
   * May this role be launched `--role <r> --chunk <id>` to own one chunk's
   * territory, the way a Step 3B reverse auditor does?
   *
   * It is declarative for two readers. The command guard rejects `--chunk` on any
   * role that does not set it, so a new per-chunk role is a data change here, not a
   * name hardcoded in the guard. And the brief builder scopes such a role's diff
   * reads to its one chunk — a per-chunk agent whose brief still said "walk it
   * chunk by chunk" over all twenty chunks would read the whole diff the `--chunk`
   * design exists to spare it, because the brief is what the agent is told to obey.
   */
  acceptsChunk?: boolean;
  /**
   * May this role be launched `--role <r> --findings <file>`, so the command
   * prints a launch block pointed at the findings list?
   *
   * The verifier rules on findings; the reverse auditor avoids re-reporting them.
   * Both used to get their findings the same way: the command printed a launch
   * block and the orchestrator hand-prepended the list above it. Dogfooded, that
   * hand-assembly is where the prompt got paraphrased — the model added a round
   * number, inserted its own summary, and truncated the line telling it the brief
   * is authoritative — so the delivery check failed even though the agent opened
   * its brief. With this flag the command copies the list to a digest-named file
   * and prints one block to paste — a pointer to that file, not the list itself,
   * which inlined made a 12-14-agent launch one 65-82 KB message (issue #8597) —
   * and there is no assembly step left to drift. The pointer is part of the
   * recorded prompt (see runAgentPrompt), keyed per findings digest, so a launch
   * that drops it matches no record, and the delivery floor counts the read it
   * instructs exactly as it counts the brief's.
   */
  acceptsFindings?: boolean;
  /**
   * This role's brief never carries the soft tool-call ceiling
   * (`agentToolBudget`).
   *
   * Declarative for the same reason `acceptsChunk` is: the exemption used to
   * be three role names hardcoded in the prompt builder, which is exactly how
   * a later role whose mandatory work does not scale with the diff would
   * silently receive a diff-derived ceiling. Each exemption carries its own
   * reason at the role's entry; a new role decides here, next to everything
   * else it declares, and the roster test walks `BRIEFS` so the exempt set
   * cannot drift unpinned.
   */
  budgetExempt?: boolean;
  /** The agent-facing text. */
  brief: string;
}
/**
 * The model receipt the reverse-audit brief hands every auditor as its
 * example. Exported so the retirement classifier can refuse a clause that
 * parrots it — measured: agents repeat what they are handed, and a receipt
 * the prompt wrote is not evidence of a walk.
 */
export declare const REVERSE_AUDIT_EXAMPLE_RECEIPT =
  "No issues found \u2014 re-walked the reconnect state machine and the two changed exports' call sites; every gap I checked was already in the list";
/**
 * The model-of-EXECUTION divergence lens: the hunt for a guard, sandbox, or
 * interpreter whose model of another system's runtime STATE drifts from the real
 * thing. Agent 2 carries it on a 3A dimension fan-out; on a 3B territory fan-out
 * Agent 2 does not run, so `buildChunkAgentPrompt` attaches this same lens to
 * each chunk agent when the manifest declares the diff a modeled executable
 * system — one source, both topologies. Written self-contained (no back-reference
 * to a preceding bullet) so it reads correctly in either place.
 */
export declare const MODELED_SYSTEM_EXECUTION_LENS =
  "- **A model of another system's EXECUTION, diverging in state \u2014 not only its syntax.** Beyond a parser that *reads* a format two ways, an *interpreter* \u2014 a guard, sandbox, or permission model that re-implements how another system (a shell, git, a query engine) RUNS \u2014 can have its model of that system's runtime state drift from the real thing. Syntax divergence is one token read two ways; **state divergence** is the model carrying the wrong VALUE across a boundary the real system crosses differently, so the guard allows what it would have denied. Enumerate the boundaries where the modeled system carries state across a call, and for each ask what the real system does that the model does not: what SURVIVES a function call or `eval` (working directory, exported vars, shell options, defined functions) that a subshell or `$(\u2026)` does NOT propagate back but DOES inherit; what name-resolution order applies (a function shadowing `git`/`cd`, `command`/`builtin` bypassing it, `export -f` importing a function into a child shell); which options (`set -a`) a child or substitution inherits. The bug shape is a recursive evaluator that computes a nested body's post-state and then DISCARDS or fails to merge it, so a later check runs against state the real system has already moved past. **A second bug shape is state that only ACCUMULATES:** the real system has operations that DELETE what earlier ones added \u2014 `unset -f`/`unalias`/`export -n -f` remove a definition or its export attribute, `set +a`/`+o` clears an option, `cd -`/`popd` walks a directory back \u2014 so a model that grows an add-only map of definitions, export attributes, or options and never removes an entry diverges the moment the real system removes one (a `git` function defined, then `unset -f`'d, still replayed against a stale body while the real shell resolves the external program). For every piece of modeled state, check the model has a REMOVAL path for every ADD path the real system does. **When the boundary is subtle, do not argue it \u2014 run it:** build the payload, execute it against the real system (`run_shell_command` real bash/git in the worktree), trace the same payload through the model, and state the divergence with BOTH observed behaviours. A guard that models an executable system and is reviewed only by reading is judged against the very model of that system whose gaps are the vulnerability \u2014 the reading and the code share the blind spot by construction.";
export declare const BRIEFS: Record<RoleId, Brief>;
/** Roles that read the diff and therefore need the diff-reading block. */
export declare function readsDiff(role: RoleId): boolean;
