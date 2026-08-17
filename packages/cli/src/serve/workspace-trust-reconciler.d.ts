/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type DaemonTrustPolicySnapshot,
  type DaemonWorkspaceTrustDecision,
} from '../config/daemon-trust-policy.js';
import {
  type WorkspaceEntry,
  type WorkspaceGenerationGuard,
  type WorkspaceRegistry,
  type WorkspaceRuntime,
} from './workspace-registry.js';
export type WorkspaceTrustReplacementReason = 'trust_reconfigured';
export interface WorkspaceTrustReconcilerOptions {
  readonly registry: WorkspaceRegistry;
  readonly readLatestSnapshot: () => Promise<DaemonTrustPolicySnapshot>;
  readonly buildRuntime: (input: {
    entry: WorkspaceEntry;
    trusted: boolean;
    snapshot: DaemonTrustPolicySnapshot;
    decision: DaemonWorkspaceTrustDecision;
    generationGuard: WorkspaceGenerationGuard;
  }) => Promise<WorkspaceRuntime>;
  readonly drainRuntime: (
    runtime: WorkspaceRuntime,
    reason: WorkspaceTrustReplacementReason,
  ) => Promise<void>;
  readonly disposeRuntime: (
    runtime: WorkspaceRuntime,
    reason: WorkspaceTrustReplacementReason,
  ) => Promise<void>;
  readonly runtimeActivated?: (
    runtime: WorkspaceRuntime,
    previous: WorkspaceRuntime | undefined,
  ) => void | Promise<void>;
  readonly materializationKey?: (input: {
    entry: WorkspaceEntry;
    snapshot: DaemonTrustPolicySnapshot;
    decision: DaemonWorkspaceTrustDecision;
  }) => string;
  readonly isTrustDecrease?: (input: {
    entry: WorkspaceEntry;
    runtime: WorkspaceRuntime;
    nextMaterialization: string;
    decision: DaemonWorkspaceTrustDecision;
  }) => boolean;
  readonly onError?: (entry: WorkspaceEntry, error: unknown) => void;
}
export interface WorkspaceTrustReconciler {
  reconcile(snapshot: DaemonTrustPolicySnapshot): Promise<void>;
}
export declare function createWorkspaceTrustReconciler(
  options: WorkspaceTrustReconcilerOptions,
): WorkspaceTrustReconciler;
