/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type PairingRequest } from '@qwen-code/channel-base';
import type { ChannelSecretUpdate, ChannelSettingsMutationOptions, ChannelSettingsSnapshot, ChannelSettingsUpsertOptions, WorkspaceChannelSettingsStore } from './channel-settings-store.js';
import type { ChannelWorkerControlState, ChannelWorkerManager, ChannelWorkerRequiredOwner } from './channel-worker-manager.js';
import type { ChannelWorkerSnapshot } from './channel-worker-supervisor.js';
export interface ChannelRuntimeState {
    state: 'stopped' | 'starting' | 'connected' | 'partial' | 'error';
    lastError?: string;
}
export interface ChannelSecretState {
    present: boolean;
    source?: 'literal' | 'environment';
}
export interface ChannelInstanceSnapshot {
    name: string;
    config: Record<string, unknown>;
    secrets: Record<string, ChannelSecretState>;
    startsWithServe: boolean;
    runtime: ChannelRuntimeState;
}
export interface DaemonChannelsSnapshot {
    revision: string;
    instances: Record<string, ChannelInstanceSnapshot>;
}
export interface ChannelUpsertRequest {
    expectedRevision: string;
    config: Record<string, unknown> & {
        type: string;
    };
    secrets?: Record<string, ChannelSecretUpdate>;
}
export type RevisionRequest = ChannelSettingsMutationOptions;
export interface ChannelStartupRequest extends RevisionRequest {
    enabled: boolean;
}
export interface ChannelMutationResult {
    snapshot: DaemonChannelsSnapshot;
    instance: ChannelInstanceSnapshot;
}
export interface ChannelPairingRequestsSnapshot {
    requests: PairingRequest[];
}
export interface ChannelPairingApprovalResult extends ChannelPairingRequestsSnapshot {
    approved: PairingRequest;
}
export interface ChannelPairingApprovalsSnapshot {
    senderIds: string[];
    groupIds: string[];
}
export interface ChannelPairingApprovalSubject {
    type: 'user' | 'group';
    id: string;
}
export interface ChannelPairingRevocationResult extends ChannelPairingApprovalsSnapshot {
    revoked: string;
}
export interface ChannelManagementService {
    list(): Promise<DaemonChannelsSnapshot>;
    upsert(name: string, request: ChannelUpsertRequest): Promise<ChannelMutationResult>;
    remove(name: string, request: RevisionRequest): Promise<ChannelMutationResult>;
    setStartup(name: string, request: ChannelStartupRequest): Promise<ChannelMutationResult>;
    start(name: string): Promise<ChannelMutationResult>;
    stop(name: string): Promise<ChannelMutationResult>;
    restart(name: string): Promise<ChannelMutationResult>;
    pairingRequests(name: string): Promise<ChannelPairingRequestsSnapshot>;
    approvePairing(name: string, code: string): Promise<ChannelPairingApprovalResult>;
    pairingApprovals(name: string): Promise<ChannelPairingApprovalsSnapshot>;
    revokePairingApproval(name: string, subject: ChannelPairingApprovalSubject): Promise<ChannelPairingRevocationResult>;
}
interface ChannelManagementSettingsStore {
    snapshot(): ChannelSettingsSnapshot;
    upsert(name: string, options: ChannelSettingsUpsertOptions): Promise<ChannelSettingsSnapshot>;
    remove(name: string, options: ChannelSettingsMutationOptions): Promise<ChannelSettingsSnapshot>;
    setStartupNames(names: readonly string[], options: ChannelSettingsMutationOptions): Promise<ChannelSettingsSnapshot>;
}
export interface ChannelManagementWorkerManager {
    committedChannelNames(): string[];
    state(): ChannelWorkerControlState;
    setChannelEnabled(owner: ChannelWorkerRequiredOwner, enabled: boolean): Promise<unknown>;
    reloadWorkspace(workspaceCwd: string, name: string): Promise<ChannelWorkerSnapshot>;
}
export interface CreateChannelManagementServiceOptions {
    workspaceCwd: string;
    store: ChannelManagementSettingsStore | WorkspaceChannelSettingsStore;
    manager: ChannelManagementWorkerManager | ChannelWorkerManager;
}
export declare class ChannelManagementError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare function createChannelManagementService(opts: CreateChannelManagementServiceOptions): ChannelManagementService;
export {};
