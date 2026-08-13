/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ScannedAutoMemoryDocument } from './scan.js';
import type { AutoMemoryMetadata } from './types.js';
export declare function buildManagedAutoMemoryIndex(docs: ScannedAutoMemoryDocument[], _metadata?: Pick<AutoMemoryMetadata, 'updatedAt' | 'lastDreamAt' | 'lastDreamSessionId'>): string;
/**
 * Build the team index with cross-author dedup: entries sharing a description
 * collapse into one line. See {@link groupTeamDocsByDescription}.
 */
export declare function buildTeamAutoMemoryIndex(docs: ScannedAutoMemoryDocument[]): string;
export declare function rebuildManagedAutoMemoryIndex(projectRoot: string): Promise<string>;
/**
 * Rebuild the MEMORY.md index for the user-level (cross-project) memory dir.
 * Mirrors {@link rebuildManagedAutoMemoryIndex} but uses the global root
 * and skips metadata (user memory has no per-project state file).
 */
export declare function rebuildUserAutoMemoryIndex(): Promise<string>;
/**
 * Thrown by {@link rebuildTeamAutoMemoryIndex} when the team-memory root (or any
 * parent component) is a symlink that could redirect the committed index OUTSIDE
 * the repository. This is a SECURITY rejection, deliberately distinct from
 * operational IO failures (EACCES/ENOSPC/EPERM): the git-sync gate MUST block on
 * it — never add/commit/push a root that escapes the repo — whereas an
 * operational failure self-corrects on the next rebuild and must not permanently
 * gate legitimate sync.
 */
export declare class TeamMemoryRootSecurityError extends Error {
    constructor(message: string);
}
/**
 * Rebuild the team (in-repo, git-tracked) MEMORY.md index from the saved memory
 * files. The team index is generated, never hand-edited — this removes the
 * git merge-conflict surface a hand-maintained shared index would have.
 *
 * Returns the index content, or null when the team dir does not exist yet (it
 * is created lazily on first write, not by a read). Unlike the private indexes,
 * docs are ordered by path (not mtime) so the committed file is deterministic
 * across machines and does not churn after a git checkout.
 */
export declare function rebuildTeamAutoMemoryIndex(projectRoot: string): Promise<string | null>;
