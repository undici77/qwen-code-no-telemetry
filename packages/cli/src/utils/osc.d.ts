/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * OSC (Operating System Command) escape sequence utilities for terminal
 * notifications, tab status indicators, and multiplexer passthrough.
 */
export declare const ESC = "\u001B";
export declare const BEL = "\u0007";
/** String Terminator — used by Kitty instead of BEL */
export declare const ST: string;
export declare const OSC_PREFIX: string;
export declare const OSC: {
    /** iTerm2 notification / progress */
    readonly ITERM2: 9;
    /** Kitty desktop notification protocol */
    readonly KITTY: 99;
    /** Ghostty / cmux notification */
    readonly GHOSTTY: 777;
};
export type TerminalType = 'iTerm.app' | 'kitty' | 'ghostty' | 'Apple_Terminal' | 'unknown';
/**
 * Detect the current terminal emulator from environment variables.
 *
 * Strategy: check TERM_PROGRAM first (identifies the actual emulator),
 * then fall back to TERM (describes capabilities, but Ghostty/Kitty set
 * distinctive TERM values when TERM_PROGRAM is absent — e.g. over SSH
 * or inside multiplexers), and finally check terminal-specific env vars.
 */
export declare function detectTerminal(): TerminalType;
/**
 * Strip control characters that could break out of an OSC payload.
 * Removes ESC (\x1b), BEL (\x07), ST (ESC + \), and other C0/C1
 * control bytes that terminals interpret as sequence boundaries.
 * Preserves HT (\t), LF (\n), and CR (\r) which are safe in payloads.
 */
export declare function sanitizeOscPayload(text: string): string;
/**
 * Build an OSC escape sequence from parts.
 *
 * Terminator selection:
 * - Kitty prefers ST (`ESC \`), but ST inside a GNU screen DCS wrapper
 *   would prematurely terminate the outer DCS. So when `STY` is set
 *   (screen session), we fall back to BEL even for Kitty.
 * - All other terminals always use BEL.
 *
 * All string parts are sanitized to prevent control character injection.
 */
export declare function osc(...parts: Array<string | number>): string;
/**
 * Wrap an OSC sequence for tmux / screen passthrough.
 *
 * - tmux: DCS `\ePtmux;\e<seq>\e\\` with ESC doubling inside
 * - screen: DCS `\eP<seq>\e\\`
 *
 * BEL should NOT be wrapped — raw BEL triggers tmux's bell-action,
 * whereas a wrapped BEL becomes an opaque DCS payload and is ignored.
 */
export declare function wrapForMultiplexer(sequence: string): string;
/**
 * Base64-encode a UTF-8 string for Kitty OSC 99 payloads.
 * Kitty requires `e=1` (base64) encoding to safely transport arbitrary
 * UTF-8 text without delimiter/control-character conflicts.
 */
export declare function encodeKittyPayload(text: string): string;
/**
 * iTerm2 notification via OSC 9.
 * Format: `\e]9;\n\n<title>:\n<message>\a`
 */
export declare function oscITerm2Notify(title: string, message: string): string;
/**
 * Kitty desktop notification via OSC 99 (three-step protocol).
 * Returns an array of sequences that must be written in order.
 *
 * Payloads are base64-encoded (`e=1`) as required by the Kitty
 * notification protocol to safely transport UTF-8 text.
 *
 * @see https://sw.kovidgoyal.net/kitty/desktop-notifications/
 */
export declare function oscKittyNotify(title: string, message: string, id: number): string[];
/**
 * Ghostty / cmux notification via OSC 777.
 * Format: `\e]777;notify;<title>;<message>\a`
 */
export declare function oscGhosttyNotify(title: string, message: string): string;
/**
 * Generate a random Kitty notification ID.
 */
export declare function generateKittyId(): number;
