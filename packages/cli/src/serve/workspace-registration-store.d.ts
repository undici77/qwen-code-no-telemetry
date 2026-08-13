/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const MAX_WORKSPACE_DISPLAY_NAME_LENGTH = 256;
export interface WorkspaceRegistrationSnapshot {
    schemaVersion: 1;
    primaryWorkspace: string;
    workspaces: string[];
    displayNames?: Record<string, string>;
}
export declare class WorkspaceDisplayNameValidationError extends Error {
    constructor(message: string);
}
export declare function normalizeWorkspaceDisplayName(value: unknown): string | undefined;
export declare class WorkspaceRegistrationStoreError extends Error {
    constructor(message: string);
}
export declare class WorkspaceRegistrationStoreLimitError extends WorkspaceRegistrationStoreError {
}
export declare class WorkspaceRegistrationStoreCommittedError extends WorkspaceRegistrationStoreError {
}
export declare function workspaceRegistrationScopeHash(primaryWorkspace: string): string;
export declare function workspaceRegistrationId(workspace: string): string;
export declare function getWorkspaceRegistrationStorePath(primaryWorkspace: string, qwenHome?: string): string;
export declare class WorkspaceRegistrationStore {
    readonly primaryWorkspace: string;
    readonly filePath: string;
    constructor(primaryWorkspace: string, qwenHome?: string);
    /** Returns an unlocked point-in-time snapshot; mutations re-read under lock. */
    read(): Promise<WorkspaceRegistrationSnapshot>;
    add(workspace: string, displayName?: string): Promise<boolean>;
    removeById(id: string): Promise<boolean>;
    setDisplayNameByIds(ids: readonly string[], displayName?: string): Promise<number>;
    removeByIds(ids: readonly string[]): Promise<number>;
    private update;
}
