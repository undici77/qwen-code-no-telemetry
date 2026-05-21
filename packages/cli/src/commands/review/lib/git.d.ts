/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Run `git` with args. Returns stdout, trimmed and CRLF-normalised. */
export declare function git(...args: string[]): string;
/**
 * Run `git`, return null on non-zero exit (e.g. ref / file does not exist).
 *
 * Unlike `git`, this swallows the child's stderr too — callers use it to
 * probe for things that may be absent (a tag, a file in `git show`,
 * a branch name) and don't want git's "fatal: ..." chatter on the user's
 * terminal.
 */
export declare function gitOpt(...args: string[]): string | null;
/** True iff a ref (branch / tag / commit) exists locally. */
export declare function refExists(ref: string): boolean;
