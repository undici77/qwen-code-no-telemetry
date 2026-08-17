/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface InteractiveSessionOptions {
  /** Terminal columns, default 100 */
  cols?: number;
  /** Terminal rows, default 40 */
  rows?: number;
  /** Working directory, default project root */
  cwd?: string;
  /** Environment variables */
  env?: NodeJS.ProcessEnv;
  /** Extra CLI arguments (e.g. ['--approval-mode', 'yolo']) */
  args?: string[];
}
export declare class InteractiveSession {
  private ptyProcess;
  private terminal;
  private rawOutput;
  private pendingWrite;
  private constructor();
  /** Wait for all pending PTY data to be processed by xterm. */
  private flush;
  /**
   * Start a new interactive session with the CLI.
   *
   * @example
   * ```ts
   * const session = await InteractiveSession.start({
   *   env: { QWEN_CODE_ENABLE_CRON: '1' },
   *   args: ['--approval-mode', 'yolo'],
   * });
   * ```
   */
  static start(
    options?: InteractiveSessionOptions,
  ): Promise<InteractiveSession>;
  /** Send text followed by Enter. */
  send(text: string): Promise<void>;
  /** Wait for text to appear in raw output. */
  waitFor(text: string, timeout?: number): Promise<void>;
  /** Wait for output to stabilize (no new output for `stableMs`). */
  idle(stableMs?: number, timeout?: number): Promise<void>;
  /**
   * Read the rendered terminal screen — what a user would actually see.
   * Uses @xterm/headless buffer to get properly processed output,
   * handling cursor movement, line clearing, and scrollback.
   */
  screen(): Promise<string>;
  /**
   * Poll the screen until `predicate` returns true.
   * Returns the screen text when matched.
   */
  waitForScreen(
    predicate: (screen: string) => boolean,
    description: string,
    timeout?: number,
  ): Promise<string>;
  /** Kill the PTY process and dispose the terminal. */
  close(): Promise<void>;
}
