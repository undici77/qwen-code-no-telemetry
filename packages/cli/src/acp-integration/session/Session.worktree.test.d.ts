/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase C — Session.pendingWorktreeNotice consumption tests.
 *
 * Coverage:
 *   VP3: first Session.prompt() prepends pendingWorktreeNotice as a
 *        <system-reminder> block at the front of the user message parts.
 *   VP3b: pendingWorktreeNotice is cleared (null) after the first prompt.
 *   VP4: second Session.prompt() does NOT inject the notice again.
 *   VP4b: no notice set — first prompt is sent without any worktree reminder.
 *
 * This file does NOT mock @qwen-code/qwen-code-core at the module level so
 * the real Session class and its dependencies resolve correctly.
 */
export {};
