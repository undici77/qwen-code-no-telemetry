/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AutoMemoryType } from './types.js';
export declare const AUTO_MEMORY_DIRNAME = "memory";
export declare const AUTO_MEMORY_INDEX_FILENAME = "MEMORY.md";
export declare const AUTO_MEMORY_PINNED_DIRNAME = "pinned";
export declare const AUTO_MEMORY_METADATA_FILENAME = "meta.json";
export declare const AUTO_MEMORY_EXTRACT_CURSOR_FILENAME = "extract-cursor.json";
export declare const AUTO_MEMORY_CONSOLIDATION_LOCK_FILENAME = "consolidation.lock";
/**
 * Top-level directory name (under getMemoryBaseDir()) for the user-level
 * auto-memory layer — cross-project facts about the user (preferences,
 * working style, background). Mirror layout of the per-project memory dir.
 */
export declare const USER_AUTO_MEMORY_DIRNAME = "memories";
/**
 * Directory name (under the repo's `.qwen/`) for the team auto-memory layer —
 * project memory shared with every collaborator. Unlike the private layers it
 * lives INSIDE the repository and is tracked by git, which is the sync transport.
 */
export declare const TEAM_AUTO_MEMORY_DIRNAME = "team-memory";
export { MEMORY_PROJECT_SCOPES, type MemoryProjectScope } from './scopes.js';
/**
 * Returns the base directory for all auto-memory storage.
 * Defaults to the runtime output dir (`runtimeOutputDir`, `QWEN_RUNTIME_DIR`,
 * or the global qwen dir);
 * overridable via QWEN_CODE_MEMORY_BASE_DIR for tests.
 */
export declare function getMemoryBaseDir(): string;
export declare function getAutoMemoryRoot(projectRoot: string): string;
/** Clear the memoization caches (for tests that change environment or git layout). */
export declare function clearAutoMemoryRootCache(): void;
/**
 * The trusted filesystem anchor for a project's managed-memory root: the prefix
 * of getAutoMemoryRoot() that is derived from the user's environment rather than
 * repo-tracked contents, and is therefore safe to canonicalize through symlinks.
 *
 * In local-memory mode (`QWEN_CODE_MEMORY_LOCAL=1`) the root is
 * `<projectRoot>/.qwen/memory`, so the anchor is the project root; otherwise the
 * root lives under the shared memory base dir, which is the anchor. The write
 * boundary (isAllowedMemoryPath) canonicalizes this anchor but appends the
 * managed suffix literally, so a symlink planted INSIDE the suffix (e.g. a
 * repo-tracked `.qwen -> /outside`) can't silently relocate the allowed root
 * out of the trusted anchor.
 */
export declare function getAutoMemoryTrustedAnchor(projectRoot: string): string;
/**
 * Returns the project-level state directory that holds auxiliary files
 * (meta.json, extract-cursor.json, consolidation.lock) for the given project.
 * This is the parent of getAutoMemoryRoot(), so memory/ stays clean:
 * only MEMORY.md and topic files live inside it.
 */
export declare function getAutoMemoryProjectStateDir(projectRoot: string): string;
/**
 * Returns true if the given absolute path is inside the auto-memory root for
 * the given project.
 *
 * Uses path.relative() instead of startsWith() to correctly handle
 * platform path-separator differences (e.g. Windows backslash vs forward
 * slash) and to be resilient against path-traversal edge cases.
 */
export declare function isAutoMemPath(absolutePath: string, projectRoot: string): boolean;
export declare function getAutoMemoryIndexPath(projectRoot: string): string;
export declare function getAutoMemoryMetadataPath(projectRoot: string): string;
export declare function getAutoMemoryExtractCursorPath(projectRoot: string): string;
export declare function getAutoMemoryConsolidationLockPath(projectRoot: string): string;
export declare function getAutoMemoryTopicFilename(type: AutoMemoryType): string;
export declare function getAutoMemoryTopicPath(projectRoot: string, type: AutoMemoryType): string;
export declare function getAutoMemoryFilePath(projectRoot: string, relativePath: string): string;
/**
 * Returns the user-level (cross-project) auto-memory root.
 * Lives at `${getMemoryBaseDir()}/memories/` — typically `~/.qwen/memories/`.
 * Unlike project memory, this is NOT scoped to a git root; it is shared
 * across every project the user works in.
 */
export declare function getUserAutoMemoryRoot(): string;
export declare function getUserAutoMemoryIndexPath(): string;
export declare function getUserAutoMemoryTopicPath(type: AutoMemoryType): string;
/**
 * Returns true if the given absolute path is inside the user-level
 * auto-memory root. Uses path.relative() (not startsWith) so platform
 * path-separator differences and path-traversal edge cases are handled.
 */
export declare function isUserAutoMemPath(absolutePath: string): boolean;
/**
 * Returns the team auto-memory root: `<gitRoot>/.qwen/team-memory/`.
 * Anchored at the current worktree root so tracked writes appear in the active
 * branch diff. Falls back to projectRoot when there is no git root.
 */
export declare function getTeamAutoMemoryRoot(projectRoot: string): string;
export declare function getTeamAutoMemoryIndexPath(projectRoot: string): string;
/**
 * True if the given absolute path is inside the team memory root for the
 * given project. Uses path.relative() (not startsWith) so platform
 * path-separator differences and path-traversal edge cases are handled.
 */
export declare function isTeamAutoMemPath(absolutePath: string, projectRoot: string): boolean;
/**
 * Returns true when the resolved file lives in any managed-memory layer.
 *
 * Unlike {@link isAnyAutoMemPath}, this helper includes team memory and is
 * intended only for read retention. It does not grant write permissions.
 * Resolving the nearest existing path prevents a symlink inside a memory root
 * from protecting content that actually lives outside that root.
 */
export declare function isManagedMemoryPath(filePath: string, projectRoot: string, baseDir?: string): boolean;
/**
 * True if the path lives in EITHER the project-level memory root for the
 * given project OR the user-level memory root. Used by the extraction
 * agent's sandbox to allow writes to both scopes.
 *
 * Security-load-bearing: team memory is deliberately EXCLUDED. It is committed
 * to the repo and shared with collaborators, so its writes must stay 'ask' and
 * never be auto-approved through this predicate. Do not add team paths here.
 */
export declare function isAnyAutoMemPath(absolutePath: string, projectRoot: string): boolean;
