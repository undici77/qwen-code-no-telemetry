/**
 * Characters that must be neutralized in ANY attacker-controlled text we embed
 * into a prompt, independent of the wrapper's own delimiters: the C1 control
 * block (U+0080-U+009F) - notably NEL (U+0085), a Unicode line break (UAX#14 BK
 * class) that renders as a new line, i.e. prompt-line injection - plus the
 * Unicode line/paragraph separators (U+2028/U+2029, likewise rendered as
 * newlines) and the bidirectional override/isolate controls (U+202A-U+202E,
 * U+2066-U+2069 -> trojan-source, where the visual order differs from the
 * logical byte order). Also strips common zero-width format chars that make
 * visually identical names/text compare differently. ASCII C0/DEL (incl. CR/LF)
 * are stripped by each caller.
 */
export declare const PROMPT_UNSAFE_INVISIBLES: RegExp;
/**
 * Truncate to at most `max` Unicode CODE POINTS (not UTF-16 code units). A cap
 * applied with `.slice` counts code units, so one landing mid-surrogate-pair
 * (e.g. an emoji \ud83c\udf89 = 2 units) leaves a lone surrogate that renders as `\ufffd`.
 * `Array.from` iterates by code point, so slicing it never splits a pair.
 */
export declare function truncateCodePoints(str: string, max: number): string;
/**
 * Neutralize a platform display name before embedding it in a `[name]` prompt
 * tag: strip the bracket/newline delimiters, C0/DEL control chars, and the
 * Unicode line/bidi controls above that would let a crafted nickname break out
 * of the tag, inject extra lines, or smuggle terminal escape sequences, then
 * cap the length. Shared by ChannelBase group attribution and adapters that
 * self-prefix (e.g. QQ), so the rules stay identical everywhere.
 */
export declare function sanitizeSenderName(name: string): string;
/**
 * Neutralize attacker-controlled text embedded inside a `"..."` prompt wrapper
 * (reply quotes, attachment filenames): strip C0/DEL control chars, the
 * wrapper's own quote/bracket delimiters, and the Unicode line/bidi controls
 * above, then cap the length. Shared so the reply-quote and filename paths
 * can't drift apart. On truncation a single-char ellipsis is appended (kept
 * within maxLen) so the agent can tell a quote/filename was cut rather than
 * silently ending mid-token.
 */
export declare function sanitizeQuotedText(
  text: string,
  maxLen: number,
): string;
export declare function sanitizePromptText(text: string): string;
/**
 * Neutralize attacker-controlled text that is surfaced VERBATIM to users
 * (session-bus display projections, transcripts, session-list previews):
 * strip the Unicode line/bidi/zero-width controls that can reorder or hide
 * rendered text, plus C0/DEL controls EXCEPT newline — multi-line user text
 * keeps its line structure in the transcript. Capped by CODE POINT so a cap
 * landing mid-surrogate-pair cannot leave a lone surrogate. Unlike
 * sanitizePromptText it preserves newlines and brackets: display text is
 * rendered to a human, not parsed as prompt structure.
 */
export declare function sanitizeDisplayText(
  text: string,
  maxLen: number,
): string;
/**
 * Neutralize an attacker-influenced filesystem path before rendering it on
 * its own line in a prompt (`... saved to: <path>`). Unlike
 * sanitizeQuotedText, this PRESERVES `[`, `]`, `"`, and spaces: those are
 * valid, common path characters (e.g. Next.js `app/[slug]/page.tsx`, a
 * quoted segment, a space in a folder name), and a path rendered alone on a
 * line cannot use them to break out of that line, so stripping them would
 * only corrupt the path and make the agent's read-file tool miss a file that
 * exists on disk. We strip ONLY what can break or reorder the line: C0/DEL
 * controls (incl. CR/LF -> prompt-line injection) and the Unicode line/para
 * separators + bidi overrides (trojan-source). Length is capped generously
 * (1024) as defense-in-depth: well beyond any real path, but enough to stop a
 * pathological attacker filename from ballooning the prompt unboundedly.
 */
export declare function sanitizePromptPath(path: string): string;
/**
 * Neutralize attacker-controlled text before it is written to a single-line
 * stderr audit/diagnostic log. Caps to `maxLen` code points, renders ASCII
 * newlines as a visible `\n` escape (so a multi-line payload stays one readable
 * log line instead of collapsing to a space), then strips everything that could
 * forge or corrupt a log line: PROMPT_UNSAFE_INVISIBLES (the C1 block incl. NEL
 * U+0085, the Unicode line/paragraph separators U+2028/U+2029, and the bidi
 * override/isolate controls — all of which render as a line break or reorder
 * text) AND the C0/DEL controls (CR could overwrite the line, ESC could inject
 * ANSI/OSC). Shared by every audit-log site so the strip set can't drift apart.
 */
export declare function sanitizeLogText(text: string, maxLen: number): string;
