/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const CLEAR_WINDOW_MS = 600;
export interface ResizeReflowOptions {
  /** VP / alternate-screen mode: the shrink clear may blank the viewport. */
  virtualViewport?: boolean;
}
export interface TerminalResizeReflowHandle {
  restore: () => void;
  /**
   * Clear the viewport and replay the last frame that reached the terminal.
   * Ink skips redraws whose output is unchanged, so a wake/SIGCONT repaint
   * cannot rely on React alone after an external clear. Only the wake path
   * may call this — ordinary refreshStatic callers must stay write-free in
   * VP (replaying the pre-change frame would flash stale content). Absent
   * under QWEN_CODE_LEGACY_RESIZE_ERASE: the VP wake path then stays
   * write-free (static remount bump only), matching pre-PR behavior.
   */
  repaint?: () => void;
}
export interface WakeRepaintDeps {
  isVP: boolean;
  repaintViewport?: () => void;
  refreshStatic: () => void;
  remountStaticHistory: () => void;
}
/**
 * Wake/SIGCONT selection, extracted for unit coverage: VP repaints by
 * replaying the last frame over a clean viewport (Ink skips unchanged-output
 * redraws) and bumps the static remount key so one-shot <Static> history
 * (agent tabs) is re-emitted over the clear. Without a repaint (the legacy
 * escape hatch) VP wake stays write-free — a bare viewport clear would blank
 * the screen, since Ink then writes zero bytes for byte-identical output —
 * matching pre-PR behavior (stale but visible). Static mode uses the
 * ordinary refreshStatic.
 */
export declare function buildWakeRepaint(deps: WakeRepaintDeps): () => void;
/**
 * Corrects Ink's shrink-time clear on reflow-capable terminals (issue #8557).
 *
 * Ink's `resized()` clears with `eraseLines(previousLineCount)` computed at
 * the OLD width; after the terminal reflows the printed frame into more
 * physical rows at the new width, that erase under-erases and the frame top
 * (banner) is stranded as duplicate copies on every terminal.
 *
 * - VP (alternate screen): the whole viewport is ours, so for a short window
 *   after a shrink every redraw starts from a viewport-wide clear (2J+H) —
 *   exact row counts are uncomputable anyway (full-width wrap boundaries add
 *   rows no width model predicts), and over-erasing clamps harmlessly on the
 *   alt screen.
 * - Static: the live region is amplified to the reflowed height of the last
 *   frame that actually reached the terminal (greedy-packed per character,
 *   plus Ink's cursor-below line); walking further up would eat committed
 *   scrollback, so the count stays conservative there.
 */
export declare function installTerminalResizeReflow(
  stdout: NodeJS.WriteStream,
  options?: ResizeReflowOptions,
): TerminalResizeReflowHandle;
