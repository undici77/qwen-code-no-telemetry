/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * Inspired by gemini-cli's MouseContext (Google LLC, Apache-2.0): enable SGR
 * mouse mode while at least one subscriber is active, parse mouse sequences
 * out of the KeypressContext pipeline, call each handler, restore on cleanup.
 */
import { type MouseEvent, type MouseTracking } from '../utils/mouse.js';
export type MouseHandler = (event: MouseEvent) => void;
export interface MouseEventsOptions {
  /** Subscribe + enable SGR mouse mode only while this is true. */
  isActive: boolean;
  /**
   * Tracking level to request. `'button'` (?1002h) reports press/drag/release;
   * `'any'` (?1003h) additionally reports bare motion, needed for hover. The
   * effective terminal level is the highest any active subscriber requests.
   */
  tracking?: MouseTracking;
  /**
   * Opt out of the VP gate. By default mouse tracking is enabled only in VP
   * mode (`ui.useTerminalBuffer`), so non-VP keeps native terminal scrollback.
   * Set true for surfaces that own the wheel regardless — e.g. the VP viewport
   * (ScrollableList) — where there is no main-screen native scrollback to
   * protect.
   */
  bypassVpGate?: boolean;
}
/**
 * Subscribes to SGR mouse events while `isActive` is true.
 *
 * On activation: enables SGR mouse tracking at the requested `tracking` level
 * (`'button'` → `?1002h`, `'any'` → `?1003h` for hover) plus `?1006h` for SGR
 * coordinates. KeypressContext's readline pipeline receives the SGR fragments,
 * reconstructs the full sequence, parses it, and forwards the parsed
 * MouseEvent to subscribers registered via `subscribeMouse`. On cleanup (or
 * when `isActive` flips false): disables the mode to restore the terminal.
 * Reference counts are shared per terminal across all subscribers; the
 * effective level is the highest any active subscriber requests.
 *
 * Earlier versions used ink's `useInput` to receive mouse events, but
 * readline's `emitKeypressEvents` drains stdin in flowing mode before
 * ink's `readable` + `stdin.read()` reader can consume it — useInput
 * never fires when KeypressContext is active. The current approach routes
 * mouse events through the same readline pipeline as keyboard input.
 *
 * The handler is stored in a ref so callers don't need to memoize it.
 */
export declare function useMouseEvents(
  handler: MouseHandler,
  { isActive, tracking, bypassVpGate }: MouseEventsOptions,
): void;
