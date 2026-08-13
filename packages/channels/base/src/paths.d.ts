/**
 * Expands tilde and resolves relative paths to absolute.
 * Mirrors Storage.resolvePath() in packages/core.
 */
export declare function resolvePath(dir: string): string;
/**
 * Returns the global Qwen home directory (config, credentials, etc.).
 *
 * Priority: QWEN_HOME env var > ~/.qwen
 *
 * This mirrors packages/core Storage.getGlobalQwenDir() without importing
 * from core to avoid cross-package dependencies.
 */
export declare function getGlobalQwenDir(): string;
/**
 * Canonicalizes a workspace path for identity purposes: tilde-expand and
 * resolve, then realpath so symlinked and platform-case-variant spellings of
 * the same directory collapse to one identity (e.g. macOS `/tmp/ws` vs
 * `/private/tmp/ws`). This locally mirrors the repo's cross-module workspace
 * identity contract, `canonicalizeWorkspace` in
 * `packages/acp-bridge/src/workspacePaths.ts` — channel-base intentionally
 * avoids cross-package imports, the same way this file mirrors core's
 * `Storage`. A path that does not exist keeps its resolved spelling, matching
 * the acp-bridge ENOENT fallback.
 *
 * Deliberately broader than acp-bridge on OTHER realpath errors
 * (EACCES/EIO/ELOOP): acp-bridge propagates those because workspace
 * registration must fail loudly, but pairing storage is a best-effort
 * subsystem — a transient FS error must not prevent the channel from
 * starting, so every failure falls back to the resolved spelling.
 */
export declare function canonicalizeWorkspacePath(workspaceCwd: string): string;
/**
 * Directory name for a workspace-scoped slice of channel state, derived from
 * the workspace's working directory.
 *
 * `<sanitized-basename>-<sha256[:12]>`: the basename keeps the directory
 * human-recognizable; the hash of the FULL canonicalized path makes it
 * unique, so two workspaces named `app` in different parents never collide.
 * The input is canonicalized (resolve + realpath) so `/a/b`, `/a/b/`, `~/…`,
 * and symlinked spellings of the same directory all map to the same scope —
 * keeping the CLI's `--cwd .` and a daemon worker's settings-provided cwd in
 * agreement about which store they address.
 */
export declare function getWorkspaceScopeDirName(workspaceCwd: string): string;
