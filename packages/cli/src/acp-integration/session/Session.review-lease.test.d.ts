/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * ACP prompt turns and the /review worktree lease.
 *
 * Coverage:
 *   RL1: the turn body runs inside promptIdContext, so shell subprocesses
 *        (via getShellContextEnvVars) see QWEN_CODE_PROMPT_ID and
 *        `qwen review fetch-pr` can record its worktree lease.
 *   RL2: a completed prompt sweeps this prompt's review-worktree leases
 *        (no-op when the review's own cleanup step already cleared them).
 *   RL3: the sweep still runs when the model stream throws — the
 *        interrupted-/review case the lease mechanism exists for.
 *   RL4: consecutive prompts sweep under their own prompt IDs.
 *
 * Mirrors the harness in Session.worktree.test.ts: real Session, no
 * module-level mock of @qwen-code/qwen-code-core.
 */
export {};
