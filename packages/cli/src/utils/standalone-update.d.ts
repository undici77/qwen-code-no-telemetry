/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Stats } from 'node:fs';
import type { ReadEntry } from 'tar';
type TarFilterEntry = Stats | ReadEntry | {
    type?: string;
    linkpath?: unknown;
};
export declare function isSafeTarLinkTarget(entryPath: string, linkPath: string, resolvedDest: string): boolean;
export declare function isSafeTarEntry(entryPath: string, entry: TarFilterEntry, resolvedDest: string): boolean;
export declare function isSafeTarEntryPath(entryPath: string): boolean;
export declare function acquireLock(lockPath: string, standaloneDir?: string): boolean;
export type ShellPathUpdate = {
    rcFile?: string;
    blockAdded: boolean;
    error?: string;
};
export type BinWrapperArtifacts = {
    wrapperPath?: string;
    wrapperCreated: boolean;
    shellPathUpdate?: ShellPathUpdate;
    wrapperNeedsAttention?: boolean;
};
/**
 * Ensures ~/.local/bin/qwen exists and points to the standalone install.
 * Required for npm→standalone migration so the new binary is on PATH.
 */
export declare function ensureBinWrapper(standaloneDir: string, target: string): BinWrapperArtifacts;
/**
 * Appends binDir to the user's shell rc file if not already present.
 * Mirrors the logic in install-qwen-standalone.sh maybe_update_shell_path.
 */
export declare function ensurePathInShellRc(binDir: string): ShellPathUpdate;
export declare function cleanupFirstTimeMigrationArtifacts(artifacts?: BinWrapperArtifacts): void;
export declare function performStandaloneUpdate(standaloneDir: string, newVersion: string): Promise<'done' | 'deferred'>;
export type RollbackResult = {
    ok: true;
} | {
    ok: false;
    reason: 'no-old' | 'no-manifest' | 'rename-failed';
    detail: string;
};
/**
 * Rolls back a standalone installation to the previous version (.old directory).
 */
export declare function rollbackStandaloneUpdate(standaloneDir: string): RollbackResult;
export {};
