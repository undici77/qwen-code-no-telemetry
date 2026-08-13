/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Repaint the UI when the process resumes after a suspend / sleep.
 *
 * After macOS display-sleep or system-sleep the terminal emulator's screen
 * buffer may be reset or rearranged, but Ink's internal frame-diff state still
 * reflects the pre-sleep output.  The next render then moves the cursor to the
 * wrong row and the erase-and-redraw cycle strands border / separator
 * characters on screen (the "horizontal lines" artifact).
 *
 * Detection is two-pronged:
 *
 * 1. **Heartbeat timer** — a `setInterval` that records `Date.now()` on each
 *    tick.  If the gap between ticks exceeds {@link WAKE_THRESHOLD_MS} the
 *    event loop was frozen (display sleep, system sleep, laptop lid close).
 *    The timer is `.unref()`'d so it never keeps the process alive.
 *
 * 2. **SIGCONT** — delivered when a stopped process is continued (`fg` after
 *    `Ctrl+Z`).  The terminal's screen buffer is likewise stale in this case.
 *
 * `repaint` is read through a ref, so it does not need to be referentially
 * stable — the listeners are armed once on mount and never re-created.
 */
export declare function useWakeRepaint(repaint: () => void): void;
