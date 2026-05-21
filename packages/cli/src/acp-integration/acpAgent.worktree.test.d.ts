/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase C ACP worktree context restore — agent-level integration tests.
 *
 * Coverage (this file):
 *   VP1: loadSession with a stale sidecar — pendingWorktreeNotice stays null.
 *   VP2: loadSession with a live sidecar — pendingWorktreeNotice is set to
 *        the contextMessage from restoreWorktreeContext.
 *   VP2b: restoreWorktreeContext throws — session still loads, notice null.
 *
 * VP3 / VP4 (Session.prompt consumption) are in Session.worktree.test.ts.
 */
export {};
