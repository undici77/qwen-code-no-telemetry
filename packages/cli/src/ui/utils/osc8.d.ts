/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * OSC 8 hyperlink helpers.
 *
 * The shared primitives — `sanitizeForOsc`, `osc8Hyperlink`,
 * `supportsHyperlinks`, `wrapForMultiplexer`, `HYPERLINK_ENV_KEYS` — now live
 * in `@qwen-code/qwen-code-core` so core-side emitters (e.g. the Qwen OAuth
 * device-flow fallback message) can wrap a URL in a single clickable link.
 * They are re-exported here so existing CLI imports of this module keep
 * resolving unchanged. The markdown-link and label-deception helpers below are
 * CLI-renderer-specific and stay here.
 *
 * Supported terminals (iTerm2 ≥ 3.1, WezTerm ≥ 20200620, Kitty, Ghostty,
 * Windows Terminal, VS Code ≥ 1.72, GNOME Terminal / VTE ≥ 0.50, …) render
 * an OSC 8 envelope as a clickable link that survives line wrapping.
 * Terminals without OSC 8 support ignore the escapes and print the visible
 * label as-is.
 */
import { osc8Hyperlink, sanitizeForOsc, supportsHyperlinks, wrapForMultiplexer, HYPERLINK_ENV_KEYS } from '@qwen-code/qwen-code-core';
export { osc8Hyperlink, sanitizeForOsc, supportsHyperlinks, wrapForMultiplexer, HYPERLINK_ENV_KEYS, };
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
export declare function trimTrailingUrlPunctuation(url: string, nextCharacter?: string): string;
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
 * Bare-URL pattern shared between the React and ANSI renderers. Unlike a
 * plain `\S+` run it stops at CJK / full-width punctuation: Chinese prose
 * routinely glues `（…）`/`。` onto a URL with no space
 * (`https://x.com（2 commits）`), and `\S` swallows the punctuation plus
 * everything up to the next ASCII space, turning the OSC 8 target into a
 * 404. Raw CJK ideographs, U+3005 々, U+3006 〆, and U+3007 〇 stay in the
 * match because they are word-forming IRI characters. The exclusion also
 * covers punctuation in CJK Compatibility Forms and Vertical Forms while
 * preserving their word-forming repeat marks and vertical low lines. ASCII
 * and other typographic punctuation stays matched and is left to
 * `trimTrailingUrlPunctuation`.
 */
export declare const BARE_URL_PATTERN: string;
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
