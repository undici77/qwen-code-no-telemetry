/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Thrown when the per-file mutex acquire times out. The route maps
 * this to a 500 with `code: 'memory_write_timeout'` so SDK callers
 * can branch on a stalled-fs / hung-write condition without parsing
 * a generic 500.
 */
export declare class WorkspaceMemoryWriteTimeoutError extends Error {
    readonly filePath: string;
    readonly timeoutMs: number;
    constructor(filePath: string, timeoutMs: number);
}
export type WriteContextFileScope = 'workspace' | 'global';
export type WriteContextFileMode = 'append' | 'replace';
export interface WriteContextFileOptions {
    scope: WriteContextFileScope;
    mode: WriteContextFileMode;
    /**
     * Content to write. For `append`, this is added under the
     * `MEMORY_SECTION_HEADER` block. For `replace`, this becomes the
     * file's full contents.
     */
    content: string;
    /**
     * Absolute path to the workspace root (used when `scope === 'workspace'`).
     * Ignored for `global` writes.
     */
    projectRoot: string;
}
export interface WriteContextFileResult {
    filePath: string;
    /**
     * Bytes actually written by this call. `0` on the no-op short-
     * circuit path (`changed: false`). NOT a measurement of the file's
     * on-disk size — callers that need that should `fs.stat` the
     * returned `filePath` directly.
     */
    bytesWritten: number;
    /**
     * `true` when the call actually mutated the file on disk; `false`
     * when the helper short-circuited because the requested write would
     * have been a no-op (e.g. `mode: 'append'` with whitespace-only
     * content). Callers like the `qwen serve` POST route use this to
     * suppress spurious `memory_changed` events that would otherwise
     * fan out for a write that didn't change anything.
     */
    changed: boolean;
}
/**
 * Append/replace `QWEN.md` for the workspace or the user's global
 * `~/.qwen/` directory. Used by the `qwen serve` daemon's
 * `POST /workspace/memory` route (issue #4175 PR 16) and any other
 * caller that needs to mutate hierarchical memory through code.
 *
 * Append mode preserves any prose already in the file: when a
 * `## Qwen Added Memories` section exists, the new content is
 * appended to the end of the file; when it doesn't, a fresh section
 * header is added before the content. This matches the shape the
 * agent-side `save_memory` tool produces, so files written through
 * the daemon route round-trip cleanly with the existing CLI surface.
 *
 * Replace mode overwrites the whole file with `content` verbatim.
 * Callers should canonicalize/validate `content` before passing.
 *
 * Path safety: `projectRoot` MUST be absolute. Callers are expected
 * to pass a daemon-canonicalized workspace path (the bridge's
 * `boundWorkspace`); this helper does not re-canonicalize.
 */
export declare function writeWorkspaceContextFile(options: WriteContextFileOptions): Promise<WriteContextFileResult>;
export declare class WorkspaceMemoryFileTooLargeError extends Error {
    readonly filePath: string;
    readonly bytes: number;
    readonly limit: number;
    constructor(filePath: string, bytes: number, limit: number);
}
