/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type ExtensionActivation = 'enabled' | 'disabled';
export type WorkspaceActivation = ExtensionActivation | 'inherit';
export interface ExtensionPolicy {
    name: string;
    artifactGeneration?: number;
    defaultActivation: ExtensionActivation;
    workspaceOverrides: Record<string, WorkspaceActivation>;
    legacyPathRules?: string[];
}
export interface ExtensionStoreSnapshot {
    version: 2;
    generation: number;
    legacyProjectionHash: string;
    extensions: Record<string, ExtensionPolicy>;
}
export interface ExtensionIdentity {
    id: string;
    name: string;
}
export interface ExtensionActivationResult {
    default: ExtensionActivation;
    workspace: WorkspaceActivation;
    effective: ExtensionActivation;
    source: 'cli_override' | 'workspace_override' | 'legacy_path_rule' | 'default';
}
export interface ExtensionStoreOptions {
    extensionsDir?: string;
    storeDir?: string;
    enablementPath?: string;
}
export type InitialExtensionActivation = {
    scope: 'user';
} | {
    scope: 'workspace';
    workspacePath: string;
};
export interface CommitExtensionArtifactInput {
    operation: 'install' | 'update' | 'uninstall';
    identity: ExtensionIdentity;
    destinationDirectory: string;
    stagingDirectory?: string;
    initialActivation?: InitialExtensionActivation;
    expectedArtifactGeneration?: number;
}
export declare class ExtensionStoreCorruptError extends Error {
    readonly code = "extension_store_corrupt";
    constructor(message: string, options?: ErrorOptions);
}
export declare class ExtensionStoreBusyError extends Error {
    readonly code = "extension_store_busy";
    constructor(storeDir: string, options?: ErrorOptions);
}
export declare class ExtensionConflictError extends Error {
    readonly code = "extension_conflict";
    constructor(message: string);
}
export declare class ExtensionStore {
    readonly extensionsDir: string;
    readonly storeDir: string;
    readonly enablementPath: string;
    private readonly statePath;
    private readonly previousStatePath;
    private readonly lockPath;
    constructor(options?: ExtensionStoreOptions);
    agentPluginDataRoot(extensionId: string): string;
    ensureInitialized(extensions: readonly ExtensionIdentity[]): Promise<ExtensionStoreSnapshot>;
    readConsistent<T>(readArtifacts: () => Promise<{
        value: T;
        extensions: readonly ExtensionIdentity[];
    }>): Promise<{
        value: T;
        snapshot: ExtensionStoreSnapshot;
    }>;
    private ensureInitializedUnlocked;
    createStagingDirectory(): Promise<string>;
    commitArtifact(input: CommitExtensionArtifactInput): Promise<ExtensionStoreSnapshot>;
    readSnapshot(): Promise<ExtensionStoreSnapshot>;
    getActivation(snapshot: ExtensionStoreSnapshot, extensionId: string, extensionName: string, workspacePath: string): ExtensionActivationResult;
    setDefaultActivation(identity: ExtensionIdentity, activation: ExtensionActivation): Promise<ExtensionStoreSnapshot>;
    setActivationScope(identity: ExtensionIdentity, activation: InitialExtensionActivation): Promise<ExtensionStoreSnapshot>;
    setWorkspaceActivation(identity: ExtensionIdentity, workspacePath: string, activation: ExtensionActivation): Promise<ExtensionStoreSnapshot>;
    clearWorkspaceActivation(identity: ExtensionIdentity, workspacePath: string): Promise<ExtensionStoreSnapshot>;
    setLegacyPathActivation(identity: ExtensionIdentity, scopePath: string, activation: ExtensionActivation): Promise<ExtensionStoreSnapshot>;
    private mutate;
    private emptySnapshot;
    private readSnapshotUnlocked;
    private readLegacyProjection;
    private buildLegacyProjection;
    private importLegacyProjection;
    private writeSnapshotUnlocked;
    private writeLegacyProjectionUnlocked;
    private legacyProjectionIsNewerThanState;
    private prepareDirectories;
    private withLock;
    private assertArtifactPaths;
    private pathExists;
    private recoverTransactionsUnlocked;
    private recoverCorruptStateUnlocked;
    private readJournalUnlocked;
    private readRecoverableJournalUnlocked;
    private assertRecoveredJournalPaths;
    private rollbackJournal;
    private cleanupCommittedJournal;
}
