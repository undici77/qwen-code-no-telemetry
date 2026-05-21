/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, WorktreeSession } from '@qwen-code/qwen-code-core';
/**
 * Watches the active session's WorktreeSession sidecar file and returns
 * its current contents (or `null` when no active worktree exists).
 *
 * The sidecar lives at `<chatsDir>/<sessionId>.worktree.json`. We watch the
 * directory rather than the file directly because the file may not exist
 * yet when `enter_worktree` hasn't run. Directory watchers also catch
 * rename/delete events that file watchers miss.
 *
 * Known limitation: `fs.watch` holds an inode handle to `chatsDir` at
 * mount time. If the directory is deleted out-of-band (manual cleanup,
 * antivirus quarantine, reset scripts) and then recreated, the watcher
 * does NOT re-attach to the new inode — the Footer indicator stops
 * responding to sidecar changes until the session restarts. In normal
 * use `chatsDir` is stable for the session's lifetime; if rotation
 * becomes a real failure mode, add a polling fallback or listen for
 * `watcher.on('error')` and re-run `setupWatcher`. (PR #4174 review
 * #3256239608.)
 */
export declare function useWorktreeSession(config: Config): WorktreeSession | null;
