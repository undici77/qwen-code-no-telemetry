/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * OSC 8 hyperlink primitives (package-agnostic).
 *
 * These live in `core` so both the CLI renderers and core-side emitters — for
 * example the Qwen OAuth device-flow fallback message — can wrap a URL in a
 * single clickable link. `packages/cli/src/ui/utils/osc8.ts` re-exports them
 * so existing CLI imports keep resolving unchanged.
 *
 * Supported terminals (iTerm2 ≥ 3.1, WezTerm ≥ 20200620, Kitty, Ghostty,
 * Windows Terminal, VS Code ≥ 1.72, GNOME Terminal / VTE ≥ 0.50, …) render an
 * OSC 8 envelope as a clickable link that survives line wrapping. Terminals
 * without OSC 8 support ignore the escapes and print the visible label as-is.
 */
/**
 * Wrap an OSC sequence for tmux / screen passthrough.
 *
 * - tmux: DCS `\ePtmux;\e<seq>\e\\` with ESC doubling inside
 * - screen: DCS `\eP<seq>\e\\`
 *
 * BEL should NOT be wrapped — raw BEL triggers tmux's bell-action, whereas a
 * wrapped BEL becomes an opaque DCS payload and is ignored.
 */
export declare function wrapForMultiplexer(sequence: string): string;
/**
 * Strip C0 + DEL + C1 control characters AND Unicode bidi / line-separator
 * controls so an untrusted string can be safely embedded inside an OSC
 * escape and rendered without spoofing the visible label.
 *
 * Bytes removed:
 * - C0 + DEL (`\x00-\x1f\x7f`): a stray BEL (`\x07`) or ESC (`\x1b`) would
 *   prematurely terminate the OSC sequence and leak the tail bytes as
 *   interpretable escape codes.
 * - C1 (`\x80-\x9f`): includes 8-bit ST and 8-bit OSC introducers, which
 *   terminals that honor C1 controls treat the same as their two-byte ESC
 *   counterparts.
 * - Bidi controls (`U+200E`, `U+200F`, `U+202A`-`U+202E`, `U+2066`-`U+2069`):
 *   a model-emitted `U+202E` (RLO) in a link label visually reverses the
 *   trailing text, letting a label like `safe.com` actually read as a
 *   different host after rendering. The scheme allowlist guards the *target*;
 *   stripping bidi controls guards the visible *label* from the same class
 *   of click-deception attack.
 * - Line / paragraph separators (`U+2028`, `U+2029`): some terminals treat
 *   these as line breaks inside an OSC payload, fracturing the envelope.
 */
export declare function sanitizeForOsc(s: string): string;
/**
 * Wrap a URL in an OSC 8 hyperlink escape sequence. BEL (\x07) terminates
 * the OSC — more broadly supported than ST (ESC \\).
 */
export declare function osc8Hyperlink(url: string, label?: string): string;
/**
 * Detect whether the given writable stream's host terminal can render OSC 8
 * hyperlinks. Mirrors the version-gated detection used by the
 * `supports-hyperlinks` npm package — see https://github.com/jamestalmage/node-supports-hyperlinks —
 * with two intentional deviations:
 *
 *   1. Inside `tmux` or GNU `screen` we refuse by default. The multiplexer
 *      hides the actual host terminal's capabilities, so even when we DCS-
 *      passthrough the sequence the host may print visible garbage on
 *      terminals that don't understand OSC 8. Power users who know their
 *      host supports OSC 8 and have `allow-passthrough on` (tmux 3.3+) can
 *      opt in with `FORCE_HYPERLINK=1`.
 *
 *   2. `QWEN_DISABLE_HYPERLINKS=1` is a hard opt-out (e.g. for users whose
 *      terminal advertises support but breaks on long URLs).
 *
 * The detector deliberately allocates nothing and reads env vars on every
 * call — env state can change at runtime (`/theme` toggles, NO_COLOR set
 * mid-session) and memoizing would freeze a stale answer.
 */
export declare function supportsHyperlinks(stream?: NodeJS.WriteStream | undefined): boolean;
/**
 * Every env var `supportsHyperlinks()` reads. Test files clear these in
 * `beforeEach` so a developer's iTerm2 session doesn't leak into snapshot
 * output. Exported so tests stay in lockstep with the detector.
 */
export declare const HYPERLINK_ENV_KEYS: readonly ["NO_COLOR", "FORCE_COLOR", "CI", "TMUX", "STY", "TERM_PROGRAM", "TERM_PROGRAM_VERSION", "WT_SESSION", "KITTY_WINDOW_ID", "VTE_VERSION", "DOMTERM", "GHOSTTY_RESOURCES_DIR", "KONSOLE_VERSION", "TERMINAL_EMULATOR", "ALACRITTY_LOG", "ALACRITTY_WINDOW_ID", "ALACRITTY_SOCKET", "TERM", "TEAMCITY_VERSION", "FORCE_HYPERLINK", "QWEN_DISABLE_HYPERLINKS"];
