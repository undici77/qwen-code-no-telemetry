/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Canonicalize a workspace path so the boot-time bound path and every
 * request's `workspaceCwd` collapse to the same key. `path.resolve`
 * alone normalizes `..` and `.` segments and absolutizes, but on
 * case-insensitive filesystems (macOS APFS, Windows NTFS) `/Work/A`
 * and `/work/a` are the same directory yet `resolve` returns them
 * verbatim — without normalization the `boundWorkspace` check would
 * reject every request that spelled the path with different casing
 * and `sessionScope: 'single'` re-attach would silently degrade to
 * "one per spelling".
 *
 * `realpathSync.native` (when the path exists) walks symlinks and returns
 * the on-disk casing; this matches what `config.ts` / `settings.ts` /
 * `sandbox.ts` use for their own workspace resolution. When the path
 * doesn't exist (test fixtures, ahead-of-mkdir flows) we fall back to
 * the resolved-but-uncanonicalized form rather than throwing — the
 * downstream `spawn({cwd})` will fail with a useful ENOENT if the
 * workspace truly doesn't exist.
 *
 * NOTE: This is a **cross-module contract** — `config.ts`,
 * `settings.ts`, `sandbox.ts`, and the bridge layer all need to
 * canonicalize the same way for the bound-workspace check +
 * `sessionScope: 'single'` re-attach to work correctly across paths.
 * The contract: use `realpathSync.native` on the resolved absolute
 * path; fall back to `path.resolve` only when the path doesn't exist
 * yet.
 *
 * Lifted to `@qwen-code/acp-bridge` in #4175 PR 22b so the bridge
 * package owns the cross-module primitive directly.
 * `cli/src/serve/fs/paths.ts` re-exports for callers still pointing
 * at the original location.
 */
export declare function canonicalizeWorkspace(p: string): string;
/**
 * PATH_MAX on Linux is 4096; macOS / BSD is 1024. We use the Linux
 * value as a generous ceiling — anything bigger is either a
 * malformed client request (memory amplification attack against the
 * 400 / stderr / error-message echo paths) or a synthetic test
 * input. The HTTP route's POST /session pre-check rejects bodies past
 * this; `WorkspaceMismatchError` truncates for any caller that
 * skips the pre-check.
 */
export declare const MAX_WORKSPACE_PATH_LENGTH = 4096;
