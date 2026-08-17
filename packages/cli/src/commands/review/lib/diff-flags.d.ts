/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Config overrides that have no command-line equivalent.
 *
 * `diff.suppressBlankEmpty` is the only one so far: with it set, git prints a
 * blank context line as a physically empty record rather than a lone space, and
 * the parser's new-side cursor must know which it is getting.
 */
export declare const PINNED_DIFF_CONFIG: readonly string[];
/**
 * Flags pinned against user config on every diff we parse.
 *
 * `color.diff=always` alone injects ANSI escapes that make every `diff --git`
 * line unrecognisable — the plan comes back with zero chunks and the review
 * reads nothing. `diff.external` and textconv filters emit output that is not a
 * unified diff at all. `diff.mnemonicPrefix` renames the `a/`/`b/` prefixes to
 * `i/`/`w/`, which `stripPrefix` does not know. `diff.context` changes how many
 * lines each hunk carries. `diff.renames=false` reports a move as delete + add.
 * `diff.relative` strips the repo prefix from every path when git runs from a
 * subdirectory. `diff.ignoreSubmodules=all` hides a changed gitlink entirely,
 * and `diff.submodule=log` replaces the whole section with prose.
 */
export declare const PINNED_DIFF_FLAGS: readonly string[];
/**
 * The name git accepts for "the empty side" of a diff.
 *
 * `git diff --no-index -- <null> <file>` is how a file git does not track gets
 * rendered as a new file without writing to the index. Git special-cases both
 * spellings in `diff-no-index.c`'s `get_mode()` rather than stat-ing them, but
 * only `nul` is special-cased on native Windows — so pick by platform instead of
 * betting the Windows CI leg on which branch of that function is compiled in.
 */
export declare const NULL_DEVICE: string;
/**
 * Read every pathspec as a plain name.
 *
 * `--` ends option parsing; it does not turn off **pathspec magic**. A filename
 * is not a pathspec — `a[bc].ts` is a glob — so scoping a review to that one
 * file also pulls in `ab.ts` and `ac.ts`, and a leading `:` opens the magic
 * syntax outright. Every command that takes a user-supplied path pins this.
 */
export declare const LITERAL_PATHSPECS = '--literal-pathspecs';
