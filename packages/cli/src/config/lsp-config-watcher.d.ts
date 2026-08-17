/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export type LspConfigChangeEvent =
  | LspConfigRuntimeChangeEvent
  | LspConfigInvalidEvent;
export interface LspConfigRuntimeChangeEvent {
  path: string;
  changeType: 'modified' | 'created' | 'deleted';
}
export interface LspConfigInvalidEvent {
  path: string;
  changeType: 'invalid';
  /** User-facing message; invalid configs preserve the current LSP runtime. */
  error: string;
}
export type LspConfigChangeListener = (
  event: LspConfigChangeEvent,
) => void | Promise<void>;
/**
 * Watches the workspace `.lsp.json` and reports semantic config changes.
 *
 * This watcher is intentionally narrow: it never creates files, only considers
 * the workspace-root `.lsp.json`, debounces noisy filesystem events, and
 * serializes listener calls so LSP reloads cannot overlap.
 */
export declare class LspConfigWatcher {
  private readonly workspaceRoot;
  private watcher?;
  private listener?;
  private refreshTimer;
  private activeDrain?;
  private processing;
  private pending;
  private started;
  private lastSnapshot;
  private readonly configPath;
  static readonly DEBOUNCE_MS = 300;
  static readonly LISTENER_TIMEOUT_MS = 30000;
  constructor(workspaceRoot: string);
  startWatching(listener: LspConfigChangeListener): void;
  stopWatching(): Promise<void>;
  private scheduleRefresh;
  /** Drains debounced changes one at a time while preserving a trailing update. */
  private drainPendingChange;
  /**
   * Compares the previous and current semantic snapshots.
   *
   * Invalid JSON emits an `invalid` event for user feedback but does not report
   * a runtime config change; the caller must keep the existing LSP state.
   */
  private handleChange;
  /**
   * Reads `.lsp.json` as a single operation. ENOENT is treated as deletion so a
   * file removed during a filesystem race still reconciles servers to empty.
   */
  private readSnapshot;
  /**
   * Runs the listener with timeout isolation so a hung reload cannot stall CLI.
   *
   * Returns whether the listener completed successfully; callers use this to
   * decide whether the semantic snapshot can advance or should be retried.
   */
  private notifyListener;
}
