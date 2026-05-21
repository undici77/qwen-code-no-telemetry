/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { canonicalizeWorkspace, MAX_WORKSPACE_PATH_LENGTH } from '@qwen-code/acp-bridge/workspacePaths';
export { canonicalizeWorkspace, MAX_WORKSPACE_PATH_LENGTH };
/**
 * Branded absolute path that has passed the workspace boundary check.
 * The runtime value is just a string; the brand is a compile-time
 * marker that prevents PR 19/20 routes from accidentally bypassing
 * `resolveWithinWorkspace` and reading user-supplied input straight
 * to disk. Construct one only via `resolveWithinWorkspace`.
 */
export type ResolvedPath = string & {
    readonly __brand: 'ResolvedPath';
};
/**
 * Intent declared at boundary entry. Used by callers (and the upcoming
 * `policy.ts` module) to decide ignore/trust handling.
 * `resolveWithinWorkspace` itself uses the intent to differentiate
 * ENOENT semantics: `'write'` and `'stat'` tolerate a non-existent
 * leaf (the file is about to be created, or the caller is asking
 * "does this exist?"), other intents do not.
 *
 * `'edit'` is a distinct intent from `'write'` so the trust gate,
 * audit payload, and exhaustiveness checks can reason about
 * partial-replace semantics separately from full-overwrite. Both
 * gate identically in `assertTrustedForIntent`; the split exists
 * to keep audit events faithful to the operation actually
 * performed.
 *
 * Why `'stat'` tolerates ENOENT: stat-ing a path that doesn't
 * exist is a legitimate existence check (a route handler asking
 * "should I 404?" before letting a downstream call fail with a
 * cryptic message). `WorkspaceFileSystem.stat()` re-`lstat`s the
 * resolved path itself and surfaces the natural ENOENT to the
 * caller, so the resolver doesn't need to pre-emptively reject.
 */
export type Intent = 'read' | 'write' | 'edit' | 'list' | 'glob' | 'stat';
/**
 * Detect Windows-targeted path attack patterns that bypass naive
 * boundary checks. Adapted from claude-code's
 * `hasSuspiciousWindowsPathPattern` (`src/utils/permissions/filesystem.ts`).
 *
 * Why detection rather than normalization:
 *
 * 1. Short-name normalization depends on the file existing. For a
 *    write intent the leaf is absent by definition, so normalization
 *    can't run.
 * 2. Filesystem state can change between normalization and access
 *    (TOCTOU), so a "normalized then check" pipeline still admits
 *    races. Detecting the dangerous *literal* on input closes that
 *    window.
 * 3. The patterns are cheap to detect and produce zero false
 *    positives on legitimate POSIX filenames the daemon expects to
 *    receive (workspace files are project sources / configs, never
 *    `\\?\` long-path prefixes).
 *
 * Checked patterns:
 * - NTFS ADS (`:` after position 2 — drive-letter slot exempted)
 * - 8.3 short names (`~\d`)
 * - Long-path prefixes (`\\?\`, `\\.\`, `//?/`, `//./`)
 * - Trailing dots / spaces (Windows strips during resolution)
 * - DOS device names as final extension (`.CON`, `.PRN`, ...)
 * - Three-or-more consecutive dots used as a path component
 * - UNC prefix (`\\server\share`, `//server/share`) — also blocks
 *   loopback DNS / SMB lookups during resolution.
 *
 * NTFS-on-Linux mounts (`ntfs-3g`) admit the same bypasses except
 * the colon syntax (which only the Windows kernel parses), so the
 * platform gate exists only for the ADS branch; everything else is
 * checked unconditionally.
 */
export declare function hasSuspiciousPathPattern(p: string): boolean;
/**
 * Resolve a daemon-input path to an absolute, symlink-canonicalized
 * `ResolvedPath` that is provably inside `boundWorkspace`. Throws
 * `FsError` on any boundary violation.
 *
 * Algorithm (#4175 PR 18 plan, claude-code-style chain check):
 *
 * 1. Reject suspicious literal patterns before any I/O.
 * 2. Resolve against `boundWorkspace` to absolutize relative inputs.
 * 3. Cheap pre-filter: textual containment check rejects obvious
 *    `..` traversal without paying for `realpath`.
 * 4. `fs.promises.realpath` on the absolute path. Node's realpath
 *    follows the entire symlink chain natively (SYMLOOP_MAX-bounded);
 *    if any hop escapes the workspace, the final canonical lands
 *    outside and step 5 catches it.
 * 5. ENOENT (write/stat intents): walk up to first existing ancestor,
 *    realpath the ancestor, re-attach the unresolved tail. The tail
 *    can't introduce new symlinks (it doesn't exist), so the joined
 *    result is the actual write target the OS will use.
 * 6. Final containment check against canonicalized `boundWorkspace`.
 *    If the canonical landed outside but the resolved-without-realpath
 *    version was inside, classify as `symlink_escape`; otherwise as
 *    `path_outside_workspace`.
 *
 * The brand on the return type is the contract that PR 19/20 routes
 * may not construct one without going through this function.
 */
export declare function resolveWithinWorkspace(input: string, boundWorkspace: string, intent: Intent): Promise<ResolvedPath>;
