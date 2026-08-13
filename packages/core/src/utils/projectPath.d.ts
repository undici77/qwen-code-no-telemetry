/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import * as path from 'node:path';
/**
 * Compute a project-relative, forward-slash-normalized path for matching
 * against `paths:` globs in conditional rules and conditional skills, or
 * `null` if the input falls outside the project root.
 *
 * Pure (no I/O), and parameterized over a `path` module so unit tests
 * can pin the Windows-specific `path.win32` cross-drive case (where
 * `path.relative('C:\\proj', 'D:\\elsewhere')` returns an absolute
 * string that, after normalizing backslashes, would otherwise
 * false-match a broad glob like `**\/*.ts`).
 *
 * Shared by `ConditionalRulesRegistry` and `SkillActivationRegistry`
 * so the two registries cannot drift on path validation.
 */
export declare function resolveProjectRelativePath(filePath: string, projectRoot: string, pathModule?: typeof path): string | null;
/**
 * Resolve project-relative paths with symlink awareness.
 *
 * When a file is accessed via a symlinked path (e.g., in a git worktree or
 * monorepo with symlinked directories), this function returns both the
 * original relative path and the realpath-resolved relative path, so that
 * glob patterns like `src/ **\/*.ts` can match either form.
 *
 * Falls back gracefully if `realpath` fails (e.g., ENOENT for non-existent
 * files or permission errors).
 *
 * @param filePath - Absolute or relative path to the file being accessed.
 * @param projectRoot - Absolute path to the project root.
 * @param realpath - Async realpath function (defaults to `fsPromises.realpath`).
 * @param pathModule - Path module (defaults to `path`, parameterized for testing).
 * @returns Array of unique project-relative paths (1 or 2 elements).
 */
export declare function resolveSymlinkAwareRelativePaths(filePath: string, projectRoot: string, realpath?: (path: string) => Promise<string>, pathModule?: typeof path): Promise<string[]>;
