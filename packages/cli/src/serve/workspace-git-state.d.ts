/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type GitOperation } from '@qwen-code/qwen-code-core';
import type { AcpSessionBridge } from './acp-session-bridge.js';
export interface WorkspaceGitStatus {
  v: 2;
  workspaceCwd: string;
  branch: string | null;
  /** v2 enriched fields — absent when not a repo or git is unavailable. */
  detached?: boolean;
  staged?: number;
  unstaged?: number;
  untracked?: number;
  conflicted?: number;
  hasUpstream?: boolean;
  ahead?: number;
  behind?: number;
  stashCount?: number;
  /** In-progress operation (merge/rebase/cherry-pick/revert/bisect). */
  operation?: GitOperation;
  /** Epoch ms when the enriched fields were computed. */
  computedAt?: number;
}
export declare class WorkspaceGitState {
  private readonly entries;
  /**
   * Default (fast) path: return the last-known status immediately — branch-only
   * when the working-tree summary has never been computed — and kick a
   * throttled background refresh that publishes `git_status_changed` when it
   * finds a delta. `wait: true` awaits a fresh computation and returns the
   * full status (in-flight refreshes are shared), matching the pre-cache
   * blocking semantics.
   */
  getStatus(
    workspaceCwd: string,
    bridge: AcpSessionBridge,
    opts?: {
      wait?: boolean;
    },
  ): Promise<WorkspaceGitStatus>;
  dispose(): void;
  disposeWorkspace(workspaceCwd: string): void;
  private materialize;
  /**
   * Start a working-tree computation unless one is already in flight (shared)
   * or a non-forced kick lands within the throttle window. Returns the
   * in-flight promise, or undefined when throttled. A failed computation keeps
   * the previous cache and stays silent; a successful one publishes
   * `git_status_changed` only when the summary actually changed.
   */
  private startRefresh;
  private getOrCreateEntry;
  private createEntry;
}
