/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ChannelStartupAttemptFailure, ChannelWorkerLogEntry, ChannelWorkerRestartPolicy, ChannelWorkerSnapshot, ChannelWorkerSupervisor, CreateChannelWorkerSupervisorOptions } from './channel-worker-supervisor.js';
import type { ChannelWorkspaceGroup } from './channel-workspace-grouping.js';
import type { WorkspaceRegistry } from './workspace-registry.js';
/** A channel worker snapshot annotated with its owning workspace. */
export interface ChannelWorkerGroupSnapshot extends ChannelWorkerSnapshot {
    workspaceId: string;
    workspaceCwd: string;
    primary: boolean;
}
export interface ChannelWorkerGroupReconcileResult {
    changed: boolean;
    workers: ChannelWorkerGroupSnapshot[];
}
export declare class ChannelWorkerReconcileError extends Error {
    readonly rolledBack: boolean;
    readonly rollbackError?: string;
    readonly stopFailed: boolean;
    readonly startupFailures?: ChannelStartupAttemptFailure[];
    readonly startupFailuresTruncated?: boolean;
    constructor(message: string, options: {
        rolledBack: boolean;
        rollbackError?: string;
        stopFailed?: boolean;
        startupFailures?: readonly ChannelStartupAttemptFailure[];
        startupFailuresTruncated?: boolean;
    });
}
/**
 * Manages one `ChannelWorkerSupervisor` per owning workspace. Single-workspace
 * runs collapse to one primary supervisor, preserving the legacy behavior.
 */
export interface ChannelWorkerGroup {
    start(): Promise<void>;
    stop(): Promise<void>;
    reconcile(groups: readonly ChannelWorkspaceGroup[], options?: {
        force?: boolean;
        forceWorkspaceCwd?: string;
        onRollingBack?: () => void;
    }): Promise<ChannelWorkerGroupReconcileResult>;
    isHealthy(): boolean;
    killAllSync(): void;
    snapshots(): ChannelWorkerGroupSnapshot[];
    /** Primary workspace snapshot, backing the legacy single-worker fields. */
    primarySnapshot(): ChannelWorkerSnapshot;
    beginWorkspaceDrain(workspaceCwd: string): void;
    cancelWorkspaceDrain(workspaceCwd: string): void;
    workspaceActivity(workspaceCwd: string): number;
    removeWorkspace(workspaceCwd: string): Promise<void>;
    restoreWorkspace(workspaceCwd: string): Promise<void>;
    deliverChannelMessage(request: Parameters<NonNullable<ChannelWorkerSupervisor['deliverChannelMessage']>>[0], workspaceCwd?: string): ReturnType<NonNullable<ChannelWorkerSupervisor['deliverChannelMessage']>>;
    enqueueWebhookTask: ChannelWorkerSupervisor['enqueueWebhookTask'];
}
export interface ChannelWorkerGroupSharedOptions {
    cliEntryPath: string;
    daemonUrl: string;
    daemonToken?: string;
    restartPolicy?: ChannelWorkerRestartPolicy;
    startupTimeoutMs?: number;
    heartbeatTimeoutMs?: number;
}
export interface CreateChannelWorkerGroupOptions {
    groups: readonly ChannelWorkspaceGroup[];
    registry: WorkspaceRegistry;
    createSupervisor: (opts: CreateChannelWorkerSupervisorOptions) => ChannelWorkerSupervisor;
    shared: ChannelWorkerGroupSharedOptions;
    onReady?: (snapshot: ChannelWorkerGroupSnapshot) => void;
    onExit?: (snapshot: ChannelWorkerGroupSnapshot) => void;
    onStateChange?: () => void;
    onLog?: (entry: ChannelWorkerLogEntry & {
        workspaceCwd: string;
    }) => void;
}
export declare function createChannelWorkerGroup(opts: CreateChannelWorkerGroupOptions): ChannelWorkerGroup;
