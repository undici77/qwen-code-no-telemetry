/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapted from gemini-cli (Google LLC, Apache-2.0):
 * packages/cli/src/ui/utils/mouse.ts + utils/input.ts. Trimmed to the
 * subset the virtual-viewport scroll path needs (SGR + X11 parsing,
 * incomplete-sequence detection, enable/disable helpers).
 */
export declare const SGR_EVENT_PREFIX = '\u001B[<';
export declare const X11_EVENT_PREFIX = '\u001B[M';
/**
 * Upper bound on an SGR mouse sequence's length while still incomplete. SGR
 * sequences (`\x1b[<btn;col;rowM`) are short; once a buffer exceeds this
 * without a terminator it is treated as garbage and abandoned so it doesn't
 * swallow real input. Shared by isIncompleteMouseSequence and the SGR
 * reassembly buffer in KeypressContext.
 */
export declare const MAX_SGR_MOUSE_SEQUENCE_LENGTH = 50;
export declare const SGR_MOUSE_REGEX: RegExp;
export declare const X11_MOUSE_REGEX: RegExp;
export type MouseEventName =
  | 'left-press'
  | 'left-release'
  | 'right-press'
  | 'right-release'
  | 'middle-press'
  | 'middle-release'
  | 'scroll-up'
  | 'scroll-down'
  | 'scroll-left'
  | 'scroll-right'
  | 'move';
export interface MouseEvent {
  name: MouseEventName;
  col: number;
  row: number;
  shift: boolean;
  meta: boolean;
  ctrl: boolean;
  button: 'left' | 'middle' | 'right' | 'none';
}
export declare function parseSGRMouseEvent(buffer: string): {
  event: MouseEvent;
  length: number;
} | null;
export declare function parseX11MouseEvent(buffer: string): {
  event: MouseEvent;
  length: number;
} | null;
export declare function parseMouseEvent(buffer: string): {
  event: MouseEvent;
  length: number;
} | null;
export declare function isIncompleteMouseSequence(buffer: string): boolean;
/**
 * Mouse tracking level:
 * - `'button'` (`?1002h`): button-event tracking — presses, releases, wheel,
 *   and motion *while a button is held down* (drag). Does NOT report bare
 *   hover. This is the cheaper mode used by scroll/drag consumers.
 * - `'any'` (`?1003h`): any-event tracking — everything `'button'` reports
 *   plus bare pointer motion (hover) with no button down. Required for
 *   hover highlighting; the cost is a continuous stream of motion events and
 *   suppression of the terminal's native click-drag text selection (holding
 *   Shift/Option lets the user select text regardless).
 *
 * `?1006h` = SGR extended coordinates (handles cols/rows beyond 223), enabled
 * for both levels. Modes are sent together — most terminals ignore unknown
 * modes silently. 1002 and 1003 are mutually exclusive on the terminal, so
 * switching levels must disable the old one (see useMouseEvents).
 */
export type MouseTracking = 'button' | 'any';
export declare function enableMouseEvents(
  stdout: NodeJS.WriteStream,
  tracking?: MouseTracking,
): void;
export declare function disableMouseEvents(
  stdout: NodeJS.WriteStream,
  tracking?: MouseTracking,
): void;
