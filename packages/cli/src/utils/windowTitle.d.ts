/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { StreamingState } from '../ui/types.js';
export declare const DEFAULT_WINDOW_TITLE = 'qwen';
/** Strip control characters and BiDi/line-separator controls. */
export declare function sanitizeWindowTitle(title: string): string;
/**
 * Computes the window title for the Qwen Code application.
 *
 * Priority chain:
 *  1. CLI_TITLE environment variable (if set)
 *  2. folderName — typically the basename of the workspace directory
 *  3. DEFAULT_WINDOW_TITLE ('qwen')
 *
 * @param folderName - Optional workspace folder name for project identification.
 * @returns The computed window title.
 */
export declare function computeWindowTitle(folderName?: string): string;
/**
 * Writes the terminal window title escape sequences.
 *
 * Pads the title to 80 characters to prevent taskbar / dock icon resizing
 * when the title length changes between updates.
 *
 * On Windows, also sets `process.title` so the title appears in Task Manager.
 *
 * In terminal multiplexers (tmux, screen), only OSC 2 (window title) is
 * written to avoid cluttering the multiplexer's window list with padded
 * titles. Outside multiplexers, both OSC 0 (icon name + window title)
 * and OSC 2 are written for full terminal integration.
 */
export declare function writeTerminalTitle(
  write: (value: string) => void,
  title: string,
): void;
/**
 * Formats the terminal window title based on session name and fallback, with
 * an optional leading status symbol (mirroring Claude Code's tab status
 * icons, e.g. ◐ working / ✳︎ awaiting confirmation).
 *
 * Priority:
 *  1. sessionName — from /rename, auto-title, or --resume
 *  2. computeWindowTitle(folderName) — CLI_TITLE, project folder, or default
 *
 * @param sessionName - Current session name, or null if not set.
 * @param folderName - Optional workspace folder name for the fallback chain.
 * @param statusPrefix - Optional leading status symbol (e.g. "◐ "), sanitized
 *   with the title. Callers derive it from the streaming state.
 * @returns The formatted title string with control characters removed.
 */
export declare function formatSessionWindowTitle(
  sessionName: string | null,
  folderName?: string,
  statusPrefix?: string,
): string;
/**
 * Returns the leading status symbol for the window/tab title based on the
 * streaming state, mirroring Claude Code's tab status icons (◐ working,
 * ✳︎ awaiting confirmation). Idle gets no prefix.
 */
export declare function titleStatusPrefix(
  streamingState: StreamingState,
): string;
