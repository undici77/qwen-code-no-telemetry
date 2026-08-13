/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonWorkspaceFileUploadRequest, DaemonWorkspaceFileUploadResult } from '@qwen-code/sdk/daemon';
/**
 * Minimal structural client for uploads. Both `DaemonClient`
 * (legacy-primary) and `WorkspaceDaemonClient` (workspace-qualified) satisfy
 * it; the caller resolves the correct target before constructing the hook.
 */
export interface FileUploadClient {
    uploadWorkspaceFile(req: DaemonWorkspaceFileUploadRequest, clientId?: string): Promise<DaemonWorkspaceFileUploadResult>;
}
export type FileUploadStatus = 'pending' | 'uploading' | 'done' | 'error';
/** Machine-readable failure codes; the render site localizes them. */
export type FileUploadErrorCode = 'tooLarge' | 'noDaemon' | 'tooManyFiles';
export interface FileUploadItem {
    id: string;
    file: File;
    /** Requested relative path in the target workspace. */
    targetPath: string;
    status: FileUploadStatus;
    /** 0–1. */
    progress: number;
    /** Set for locally classified failures; localized at the render site. */
    errorCode?: FileUploadErrorCode;
    /** Raw failure message (server-side errors). */
    error?: string;
    /** Server-confirmed final path (may be auto-numbered). */
    resultPath?: string;
    /** Set on a `tooManyFiles` notice row: how many files were not queued. */
    skippedCount?: number;
}
export interface UseFileUploadOptions {
    client: FileUploadClient | undefined;
    maxBytes: number;
    /**
     * Identity of the target workspace AND the session composing into it.
     * When it changes (or the hook unmounts), in-flight uploads are aborted
     * and the queue is cleared, so an upload started for workspace A cannot
     * insert a path into workspace B, and an upload started in one session
     * cannot append its reference to another session's draft after a switch.
     */
    targetKey: string;
}
export interface UseFileUploadReturn {
    uploads: FileUploadItem[];
    /** True while any item is pending or in flight; gates composer submit. */
    isBusy: boolean;
    /**
     * Queue `files` for sequential upload into `targetDir` (relative to the
     * target workspace root; `'.'` for the root). `onUploaded` fires exactly
     * once per successful upload with the server-confirmed final path.
     * Returns how many files were actually queued (locally rejected files,
     * e.g. oversized ones, become error rows without queueing).
     */
    uploadFiles: (files: File[], targetDir: string, onUploaded?: (path: string) => void) => number;
    /** Remove a row and abort it if it is pending or in flight. */
    removeUpload: (id: string) => void;
}
export declare function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn;
