/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type Unsubscribe = () => void;
export interface ResolvedWorkspaceDirectories {
  directories: Set<string>;
  initialDirectories: Set<string>;
}
/**
 * WorkspaceContext manages multiple workspace directories and validates paths
 * against them. This allows the CLI to operate on files from multiple directories
 * in a single session.
 */
export declare class WorkspaceContext {
  private directories;
  private initialDirectories;
  private onDirectoriesChangedListeners;
  /**
   * Memoized realpath results. Every workspace-bounded tool call ultimately
   * routes through {@link fullyResolvedPath} → `fs.realpathSync`; without
   * this cache the same path gets re-resolved on every Read/Glob/Grep/Ls
   * invocation. Bounded so long sessions touching many files don't grow
   * without limit; FIFO eviction is good enough — the working set tends to
   * be the small set of paths the model is actively manipulating.
   */
  private resolvedPathCache;
  private static readonly RESOLVED_PATH_CACHE_MAX;
  /**
   * Creates a new WorkspaceContext with the given initial directory and optional additional directories.
   * @param directory The initial working directory (usually cwd)
   * @param additionalDirectories Optional array of additional directories to include
   */
  constructor(directory: string, additionalDirectories?: string[]);
  /**
   * Registers a listener that is called when the workspace directories change.
   * @param listener The listener to call.
   * @returns A function to unsubscribe the listener.
   */
  onDirectoriesChanged(listener: () => void): Unsubscribe;
  private notifyDirectoriesChanged;
  /**
   * Adds a directory to the workspace.
   * @param directory The directory path to add (can be relative or absolute)
   * @param basePath Optional base path for resolving relative paths (defaults to cwd)
   */
  addDirectory(directory: string, basePath?: string): void;
  private static resolveAndValidateDir;
  static resolveRootDirectories(
    directory: string,
    additionalDirectories?: readonly string[],
  ): ResolvedWorkspaceDirectories;
  /**
   * Gets a copy of all workspace directories.
   * @returns Array of absolute directory paths
   */
  getDirectories(): readonly string[];
  getInitialDirectories(): readonly string[];
  /**
   * Removes a directory from the workspace.
   * Cannot remove initial directories (those set at construction time).
   * @param directory The directory path to remove
   * @returns True if the directory was removed, false if not found or is an initial directory
   */
  removeDirectory(directory: string): boolean;
  /**
   * Checks whether a directory is an initial (non-removable) directory.
   */
  isInitialDirectory(directory: string): boolean;
  setDirectories(directories: readonly string[]): void;
  applyRootDirectories(resolved: ResolvedWorkspaceDirectories): void;
  /**
   * Checks if a given path is within any of the workspace directories.
   * @param pathToCheck The path to validate
   * @returns True if the path is within the workspace, false otherwise
   */
  isPathWithinWorkspace(pathToCheck: string): boolean;
  /**
   * Fully resolves a path, including symbolic links.
   * If the path does not exist, it returns the fully resolved path as it would be
   * if it did exist.
   *
   * Result is memoized in {@link resolvedPathCache}. Filesystem-state cache:
   * if a file is renamed / a symlink is retargeted mid-session the cache
   * goes stale, which is the same correctness profile as any single
   * `realpathSync` call (it captures a moment in time). The win is cutting
   * 8+ syscalls per tool-heavy prompt down to 1.
   */
  private fullyResolvedPath;
}
/**
 * Resolves a workspace path using the same missing-path and symlink semantics
 * used by WorkspaceContext containment checks.
 */
export declare function resolveWorkspacePath(pathToCheck: string): string;
/**
 * Checks if a path is within a given root directory.
 * @param pathToCheck The absolute path to check
 * @param rootDirectory The absolute root directory
 * @returns True if the path is within the root directory, false otherwise
 */
export declare function isPathWithinRoot(
  pathToCheck: string,
  rootDirectory: string,
): boolean;
