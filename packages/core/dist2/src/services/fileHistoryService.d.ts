/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Hunk } from 'diff';
type BackupFileName = string | null;
export interface FileHistoryBackup {
    backupFileName: BackupFileName;
    version: number;
    backupTime: Date;
    failed?: boolean;
}
export interface FileHistorySnapshot {
    promptId: string;
    trackedFileBackups: Record<string, FileHistoryBackup>;
    timestamp: Date;
}
export interface FileHistoryState {
    snapshots: FileHistorySnapshot[];
    trackedFiles: Set<string>;
}
export interface DiffStats {
    filesChanged: string[];
    insertions: number;
    deletions: number;
}
export interface RewindResult {
    filesChanged: string[];
    filesFailed: string[];
}
export interface TurnFileDiff {
    filePath: string;
    hunks: Hunk[];
    isNewFile: boolean;
    isDeleted: boolean;
    linesAdded: number;
    linesRemoved: number;
    /** True when the before/after content exceeded `MAX_DIFF_SIZE_BYTES` and
     *  hunk generation was skipped to keep dialog memory bounded. The stats
     *  remain a best-effort line-count delta. */
    oversized: boolean;
    /** True when either endpoint's content contains NUL bytes (the standard
     *  binary sniff). Hunks are empty in that case — rendering them as text
     *  would corrupt the terminal or freeze the renderer. */
    isBinary: boolean;
}
export interface TurnDiff {
    promptId: string;
    timestamp: Date;
    files: TurnFileDiff[];
    stats: {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        /** Upper bound on candidate files dropped because the turn touched
         *  more than `MAX_TURN_DIFF_FILES`. It is intentionally counted at
         *  the candidate layer (pre-diff) rather than the diff layer (post-
         *  filter for unchanged), so a turn editing 600 files with cap 500
         *  reports `filesOmitted = 100` regardless of how many of the
         *  processed 500 turn out to have no actual change. Some of the
         *  100 may also have had no change — we can't know without paying
         *  the read the cap was specifically meant to avoid. Treat it as
         *  "up to N more files were not surfaced". */
        filesOmitted: number;
    };
}
/**
 * Tracks file edits made through the assistant's `edit` and `write_file`
 * tools so `/rewind` can roll the workspace back to the state at a chosen
 * turn boundary.
 *
 * Scope (intentional, mirrors upstream claude-code): only files touched
 * via `edit` and `write_file` are tracked. Changes made via
 * `run_shell_command` (`sed -i`, `cp`, `mv`, `rm`, `npm` scripts, `git`
 * apply, etc.) and any out-of-tool manual edits are NOT captured, and
 * `/rewind` cannot restore them.
 */
export declare class FileHistoryService {
    private state;
    private readonly sessionId;
    private readonly enabled;
    private readonly cwd;
    constructor(sessionId: string, enabled: boolean, cwd: string);
    isEnabled(): boolean;
    getSnapshots(): FileHistorySnapshot[];
    restoreFromSnapshots(snapshots: FileHistorySnapshot[]): void;
    trackEdit(filePath: string): Promise<void>;
    makeSnapshot(promptId: string): Promise<void>;
    rewind(promptId: string, truncateHistory?: boolean): Promise<RewindResult>;
    getDiffStats(promptId: string): Promise<DiffStats | undefined>;
    /**
     * Compute the file-level diff produced *during* the turn identified by
     * `promptId`. The turn's snapshot captures the workspace state at the
     * start of that turn (before any of its tool-driven edits), so:
     *   - "before" = this snapshot's backups
     *   - "after"  = the next snapshot's backups, or the live worktree if this
     *               is the most recent turn
     *
     * Only files whose backup pointer differs between the two endpoints (or
     * whose content differs in the most-recent-turn case) are returned.
     * Files that the snapshotter failed to capture are silently skipped:
     * we can't produce a meaningful per-turn diff without a known "before",
     * and surfacing a wrong hunk is worse than hiding the row.
     */
    getTurnDiff(promptId: string): Promise<TurnDiff | undefined>;
    private computeTurnFileDiff;
    private computeTurnFileDiffUnsafe;
    private findSnapshot;
    /** Same matching rule as `findSnapshot` (last occurrence wins) but
     *  returns the slot index so callers that need the neighbour snapshot
     *  (e.g. `getTurnDiff`) don't have to re-scan. Returns -1 on miss. */
    private findSnapshotIndex;
    private applySnapshot;
    private getBackupFileNameFirstVersion;
    private getMaxVersion;
    private cleanupOrphanedBackups;
    private maybeShortenFilePath;
    private maybeExpandFilePath;
}
export {};
