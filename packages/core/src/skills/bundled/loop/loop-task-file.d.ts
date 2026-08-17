/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const LOOP_TASK_FILE_MAX_BYTES = 25000;
/** Which candidate a found loop.md came from. The caller maps this to a label
 * (an exhaustive map fails closed if a new candidate is added). */
export type LoopTaskFileSource = 'project' | 'home';
export type LoopTaskFileResult =
  | {
      status: 'found';
      path: string;
      source: LoopTaskFileSource;
      content: string;
      truncated: boolean;
    }
  | {
      status: 'missing';
      checkedPaths: string[];
    };
export interface ReadLoopTaskFileOptions {
  projectRoot: string;
  /**
   * Confinement root for the home candidate's resolved (symlink-followed)
   * target — a target escaping this dir (e.g. `-> /etc/passwd`) is refused while
   * an in-root dotfile symlink is followed. Pass `$QWEN_HOME` when set, else
   * `$HOME` (see `homeQwenDir`).
   */
  homeDir: string;
  /**
   * Directory holding the home/global `loop.md` candidate (`<homeQwenDir>/loop.md`).
   * Pass the QWEN_HOME-aware global dir (`Storage.getGlobalQwenDir()`) so a
   * relocated config home is honored instead of always reading the real OS home.
   * Defaults to `<homeDir>/.qwen` so a direct barrel caller keeps the `~/.qwen`
   * layout.
   */
  homeQwenDir?: string;
  /**
   * When false, the project `.qwen/loop.md` candidate is skipped entirely — it
   * is repo-controlled, so an untrusted workspace must not read it and feed it
   * to the model (mirrors the folder-trust gate on project hooks). The
   * home/global `~/.qwen/loop.md` is user-owned and always allowed.
   *
   * Defaults to false (fail-secure): this function is re-exported from the core
   * barrel, so a caller that omits the option must NOT silently read an
   * untrusted workspace's repo-controlled file — callers opt IN by passing the
   * trust-derived value explicitly.
   */
  allowProjectFile?: boolean;
  /**
   * Per-resolver cache for the boundary `fs.realpath()` results. LoopTickResolver
   * passes its own instance-scoped Map so the cache lifetime is tied to the
   * resolver (rebuilt on `/cd`, cleared by `resetCache()`) instead of living
   * forever at module scope. Omitted by direct barrel callers, who fall back to a
   * process-lifetime cache. Eviction-on-failure is preserved either way.
   */
  realDirCache?: Map<string, Promise<string>>;
}
/**
 * Reads `.qwen/loop.md`, project before home, byte-capped at 25 KB. A missing,
 * directory, non-regular, or empty (whitespace-only) path is skipped to the next
 * candidate rather than treated as present; all candidates exhausted → missing.
 * Only the byte cap lives here — the fire-time resolver owns the user-facing
 * truncation notice so the byte-vs-line nuance stays in one place.
 *
 * Project candidate: must be a real regular file at the literal path, and is
 * stat'd BEFORE the blocking open. A symlinked `.qwen/loop.md` is refused
 * outright — a repo-controlled symlink such as `-> ../.env` resolves *inside*
 * the workspace, so confinement alone would pass and exfiltrate that file to the
 * model. A FIFO/socket/device/dir is refused too, so a named pipe can never
 * wedge the tick (a blocking `open` on a FIFO waits for a writer) or be read as
 * a task list. The canonical path is still confined to the workspace root to
 * catch an *ancestor* symlink like a checked-in `.qwen -> /outside` that a
 * final-component `lstat` cannot see. When `allowProjectFile` is false (untrusted
 * folder) the candidate is dropped entirely.
 *
 * Home candidate: `<homeQwenDir>/loop.md` (the QWEN_HOME-aware global dir, not
 * always the real `~/.qwen`). It is the user's own dotfile, so a symlink IS
 * followed (a common, legitimate setup — e.g. into a synced dotfiles repo), but
 * the resolved target must be a regular file AND stay within the home
 * confinement root (`homeDir`: `$QWEN_HOME` or `$HOME`) so a FIFO/device/dir
 * can't hang the tick and an escaping symlink (e.g. `-> /etc/passwd`) can't be
 * exfiltrated.
 */
export declare function readLoopTaskFile({
  projectRoot,
  homeDir,
  homeQwenDir,
  allowProjectFile,
  realDirCache,
}: ReadLoopTaskFileOptions): Promise<LoopTaskFileResult>;
