/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AcpSessionBridge } from './acp-session-bridge.js';
import type { ClientMcpSenderRegistry } from './acp-http/client-mcp-sender-registry.js';
import type { WorkspaceFileSystemFactory } from './fs/index.js';
import type { WorkspaceRuntimeProvenance } from './managed-scratch-workspace.js';
import type { DaemonWorkspaceService } from './workspace-service/types.js';
export interface WorkspaceRuntimeEnvMetadata {
    readonly mode: 'parent-process' | 'runtime-overlay';
    readonly overlayKeys: readonly string[];
    readonly effectiveEnv?: Readonly<NodeJS.ProcessEnv>;
    readonly envFilePaths?: readonly string[];
    readonly envFileReadFailed?: boolean;
    readonly envFileReadFailures?: ReadonlyArray<{
        readonly path: string;
        readonly error: string;
    }>;
    readonly fallbackReason?: string;
}
export interface WorkspaceRuntime {
    readonly workspaceId: string;
    readonly workspaceCwd: string;
    readonly sessionRuntimeBaseDir: string;
    /** Optional presentation-only name. Workspace identity remains id/cwd. */
    displayName?: string;
    readonly primary: boolean;
    readonly trusted: boolean;
    /** Managed scratch trust is granted by daemon-owned path provenance. */
    readonly provenance?: WorkspaceRuntimeProvenance;
    /** Whether this runtime may be removed without restarting the daemon. */
    readonly removable?: boolean;
    /** Persistent registration ids that restore this runtime on daemon startup. */
    registrationIds?: string[];
    readonly env: WorkspaceRuntimeEnvMetadata;
    readonly bridge: AcpSessionBridge;
    readonly workspaceService: DaemonWorkspaceService;
    readonly routeFileSystemFactory: WorkspaceFileSystemFactory;
    readonly clientMcpSenderRegistry: ClientMcpSenderRegistry;
    readonly generationGuard?: WorkspaceGenerationGuard;
    readonly trustMaterialization?: string;
}
export type WorkspaceEntryState = 'active' | 'draining' | 'transitioning' | 'blocked' | 'removed';
export declare class WorkspaceGenerationClosedError extends Error {
    readonly code = "workspace_generation_closed";
    constructor(message?: string);
}
export interface WorkspaceGenerationGuard {
    readonly closed: boolean;
    assertOpen(): void;
    close(): void;
}
export declare function createWorkspaceGenerationGuard(): WorkspaceGenerationGuard;
export interface WorkspaceRuntimeGeneration {
    readonly generationId: number;
    readonly policyRevision: string;
    readonly runtime: WorkspaceRuntime;
    readonly guard: WorkspaceGenerationGuard;
}
export interface WorkspaceEntry {
    readonly workspaceId: string;
    readonly workspaceCwd: string;
    displayName?: string;
    readonly primary: boolean;
    readonly removable: boolean;
    registrationIds: readonly string[];
    lastGenerationId: number;
    state: WorkspaceEntryState;
    current?: WorkspaceRuntimeGeneration;
    configuredRevision: string;
    appliedRevision: string | null;
    applyError?: string;
}
export type WorkspaceSessionOwnerResolution = {
    readonly kind: 'found';
    readonly runtime: WorkspaceRuntime;
} | {
    readonly kind: 'not_found';
} | {
    readonly kind: 'ambiguous';
    readonly runtimes: readonly WorkspaceRuntime[];
};
export type WorkspaceSessionLifecycleEvent = {
    readonly type: 'registered';
    readonly sessionId: string;
    readonly workspaceCwd: string;
} | {
    readonly type: 'removed';
    readonly sessionId: string;
    readonly workspaceCwd: string;
};
export interface WorkspaceSessionOwnerIndex {
    register(sessionId: string, workspaceCwd: string): void;
    remove(sessionId: string, workspaceCwd?: string): void;
    getWorkspaceCwds(sessionId: string): readonly string[];
    removeWorkspace(workspaceCwd: string): void;
    handleBridgeSessionLifecycle(event: WorkspaceSessionLifecycleEvent): void;
}
export interface WorkspaceRegistry {
    readonly primary: WorkspaceRuntime;
    readonly primaryEntry: WorkspaceEntry;
    list(): readonly WorkspaceRuntime[];
    listEntries(): readonly WorkspaceEntry[];
    getEntryByWorkspaceCwd(workspaceCwd: string): WorkspaceEntry | undefined;
    getEntryByWorkspaceId(workspaceId: string): WorkspaceEntry | undefined;
    beginReplacement(entry: WorkspaceEntry, configuredRevision: string): boolean;
    activateReplacement(entry: WorkspaceEntry, runtime: WorkspaceRuntime, policyRevision: string): WorkspaceRuntimeGeneration;
    advancePolicyRevision(entry: WorkspaceEntry, policyRevision: string): void;
    blockReplacement(entry: WorkspaceEntry, error: string): void;
    getByWorkspaceCwd(workspaceCwd: string): WorkspaceRuntime | undefined;
    getByWorkspaceId(workspaceId: string): WorkspaceRuntime | undefined;
    resolveWorkspaceCwd(workspaceCwd: string | undefined): WorkspaceRuntime | undefined;
    resolveLiveSessionOwner(sessionId: string): WorkspaceSessionOwnerResolution;
    add(runtime: WorkspaceRuntime): void;
    listManaged(): readonly WorkspaceRuntime[];
    getManagedByWorkspaceCwd(workspaceCwd: string): WorkspaceRuntime | undefined;
    getManagedByWorkspaceId(workspaceId: string): WorkspaceRuntime | undefined;
    syncRuntimeMetadata(runtime: WorkspaceRuntime): void;
    beginDrain(runtime: WorkspaceRuntime): boolean;
    cancelDrain(runtime: WorkspaceRuntime): void;
    commitDrain(runtime: WorkspaceRuntime): void;
    completeDrain(runtime: WorkspaceRuntime): void;
}
export interface WorkspaceRegistryOptions {
    readonly sessionOwnerIndex?: WorkspaceSessionOwnerIndex;
    readonly scanUnindexedOwners?: boolean;
}
export declare function createWorkspaceSessionOwnerIndex(): WorkspaceSessionOwnerIndex;
export declare function createWorkspaceRegistry(inputRuntimes: readonly WorkspaceRuntime[], options?: WorkspaceRegistryOptions): WorkspaceRegistry;
export declare function createSingleWorkspaceRegistry(runtime: WorkspaceRuntime, options?: WorkspaceRegistryOptions): WorkspaceRegistry;
