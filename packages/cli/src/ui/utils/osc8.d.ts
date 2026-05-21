/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * OSC 8 hyperlink helpers.
 *
 * Supported terminals (iTerm2 ≥ 3.1, WezTerm ≥ 20200620, Kitty, Ghostty,
 * Windows Terminal, VS Code ≥ 1.72, GNOME Terminal / VTE ≥ 0.50, …) render
 * an OSC 8 envelope as a clickable link that survives line wrapping.
 * Terminals without OSC 8 support ignore the escapes and print the visible
 * label as-is.
 */
import { wrapForMultiplexer } from '../../utils/osc.js';
export { wrapForMultiplexer };
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
 * Open half of an OSC 8 hyperlink envelope. Pair with `osc8Close()` to wrap
 * a styled label without losing the surrounding SGR resets — OSC 8 and SGR
 * are orthogonal so nested color styling is preserved by terminals that
 * honor the hyperlink sequence.
 */
export declare function osc8Open(url: string): string;
/** Close half of an OSC 8 hyperlink envelope. */
export declare function osc8Close(): string;
/**
 * Return true if `url` carries an explicit allowlisted scheme. URLs without
 * a scheme (relative paths, `#anchor`, empty) are rejected — terminals can't
 * resolve them anyway, and rejecting them avoids creating un-clickable links.
 */
export declare function isSafeOscScheme(url: string): boolean;
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
 * Trim trailing sentence punctuation off a bare URL run before it becomes
 * an OSC 8 target. Models routinely produce `see https://example.com.` and
 * the inline regex greedily swallows the period; clicking the wrapped link
 * then opens a 404. The trailing characters stay in the visible text — only
 * the OSC 8 *target* is trimmed, so byte-output for unsupported terminals
 * is unchanged.
 *
 * The set of trimmable trailing characters matches GitHub / GitLab linkifier
 * behavior. We additionally rebalance a trailing `)` against opening `(` in
 * the URL so URLs that legitimately end with `)` (Wikipedia disambiguation,
 * MSDN) aren't truncated.
 */
export declare function trimTrailingUrlPunctuation(url: string): string;
/**
 * Inline link pattern allowing one level of balanced parens in the URL
 * group so `[wiki](https://en.wikipedia.org/wiki/Foo_(bar))` isn't truncated
 * at the inner `)`. Mirrors CommonMark's cap. Exposed for both the React
 * markdown renderer and the ANSI table renderer to keep them in lockstep.
 */
export declare const MD_LINK_PATTERN: string;
/**
 * Capture the label and URL out of a single matched link token. Anchored
 * with `^...$` because callers pass the whole match string.
 */
export declare const MD_LINK_CAPTURE: RegExp;
/**
 * Should the markdown renderers wrap a `[label](url)` token in an OSC 8
 * envelope? Returns true only when (a) the host terminal advertises OSC 8,
 * (b) the URL uses an allowlisted network/mail scheme, and (c) the URL
 * contains no whitespace — every terminal rejects or silently truncates a
 * whitespace-bearing OSC 8 target, which would turn the whole region into
 * an un-clickable trap on capable terminals.
 *
 * Centralizing the predicate keeps the React renderer and the ANSI table
 * renderer in lockstep; if a future scheme is allowlisted, both pick it up.
 */
export declare function shouldWrapMarkdownLink(url: string, canHyperlink: boolean): boolean;
export declare function labelMayDeceive(label: string, url: string): boolean;
/**
 * Every env var `supportsHyperlinks()` reads. Test files clear these in
 * `beforeEach` so a developer's iTerm2 session doesn't leak into snapshot
 * output. Exported so tests stay in lockstep with the detector.
 */
export declare const HYPERLINK_ENV_KEYS: readonly ["NO_COLOR", "FORCE_COLOR", "CI", "TMUX", "STY", "TERM_PROGRAM", "TERM_PROGRAM_VERSION", "WT_SESSION", "KITTY_WINDOW_ID", "VTE_VERSION", "DOMTERM", "GHOSTTY_RESOURCES_DIR", "KONSOLE_VERSION", "TERMINAL_EMULATOR", "ALACRITTY_LOG", "ALACRITTY_WINDOW_ID", "ALACRITTY_SOCKET", "TERM", "TEAMCITY_VERSION", "FORCE_HYPERLINK", "QWEN_DISABLE_HYPERLINKS"];
