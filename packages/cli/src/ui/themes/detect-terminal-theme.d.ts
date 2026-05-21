/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type DetectedTheme = 'dark' | 'light';
interface Rgb {
    r: number;
    g: number;
    b: number;
}
/**
 * Parses an XParseColor RGB string returned by OSC 11.
 *
 * Accepted formats:
 *   - `rgb:RRRR/GGGG/BBBB` (1–4 hex digits per component)
 *   - `#RRGGBB` or `#RRRRGGGGBBBB` (equal-length triplets)
 */
export declare function parseOscRgb(data: string): Rgb | undefined;
/**
 * Converts an OSC 11 colour response into a dark/light theme decision
 * using ITU-R BT.709 relative luminance.
 */
export declare function themeFromOscColor(data: string): DetectedTheme | undefined;
/**
 * Sends an OSC 11 query (`ESC ] 11 ; ? BEL`) to the terminal and waits
 * for the response containing the background colour.
 *
 * The caller is responsible for having stdin in raw mode with an active
 * consumer (so the stream is in flowing mode). This probe only attaches
 * an extra listener to parse the OSC 11 response — it does NOT flip raw
 * mode or resume/pause stdin, because doing so interleaves with other
 * early-startup stdin consumers (kitty protocol detection, early input
 * capture) and causes terminal response bytes to leak into the TUI.
 *
 * Returns `undefined` when stdin/stdout is not a TTY or when no response
 * arrives within {@link OSC11_TIMEOUT_MS}.
 */
export declare function detectOsc11Theme(): Promise<DetectedTheme | undefined>;
/**
 * Detects the macOS system appearance using `defaults read -g AppleInterfaceStyle`.
 * Returns 'dark' if Dark Mode is active, 'light' when `defaults` reports the key
 * is missing (the canonical macOS Light Mode signal), and undefined for any
 * other failure (timeout, `defaults` not on PATH, killed by signal, …) so the
 * caller can continue its fallback chain instead of pinning to Light.
 * Returns undefined on non-macOS platforms.
 */
export declare function detectMacOSTheme(): DetectedTheme | undefined;
/**
 * Detects theme from the COLORFGBG environment variable.
 *
 * COLORFGBG is set by some terminals (e.g., rxvt, xterm, iTerm2, Konsole)
 * in the format "foreground;background" where values are ANSI color indices (0-15).
 *
 * A dark background (0-6, 8) → dark theme.
 * A light background (7, 9-15) → light theme.
 */
export declare function detectFromColorFgBg(): DetectedTheme | undefined;
/**
 * Synchronous theme detection (for theme dialog live-preview).
 *
 * Order: COLORFGBG → macOS system appearance → default dark.
 */
export declare function detectTerminalTheme(): DetectedTheme;
/**
 * Asynchronous theme detection (for startup).
 *
 * Checks cheap synchronous sources first (COLORFGBG) so we never pay the
 * ~200 ms OSC 11 timeout when a fast answer is already available.  OSC 11 is
 * tried only when no synchronous source provides an answer.
 *
 * Order: COLORFGBG → OSC 11 → macOS system appearance → default dark.
 */
export declare function detectTerminalThemeAsync(): Promise<DetectedTheme>;
export {};
