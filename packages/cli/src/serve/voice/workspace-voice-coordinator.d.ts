/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { WorkspaceRuntime } from '../workspace-registry.js';
export declare const MAX_CONCURRENT_VOICE_SESSIONS = 8;
export declare class VoiceLeaseAbortError extends Error {
  readonly kind: 'daemon_shutdown' | 'workspace_removed' | 'trust_reconfigured';
  constructor(
    kind: 'daemon_shutdown' | 'workspace_removed' | 'trust_reconfigured',
    message: string,
  );
}
export interface VoiceAdmissionLease {
  readonly signal: AbortSignal;
  release(): void;
}
export type VoiceAdmissionResult =
  | {
      readonly kind: 'admitted';
      readonly lease: VoiceAdmissionLease;
    }
  | {
      readonly kind: 'rejected';
      readonly reason: 'draining' | 'capacity';
    };
export declare class WorkspaceVoiceCoordinator {
  private readonly states;
  private readonly disposed;
  private active;
  acquire(runtime: WorkspaceRuntime): VoiceAdmissionResult;
  beginWorkspaceDrain(runtime: WorkspaceRuntime): void;
  cancelWorkspaceDrain(runtime: WorkspaceRuntime): void;
  completeWorkspaceDrain(runtime: WorkspaceRuntime): void;
  getWorkspaceActivity(runtime: WorkspaceRuntime): number;
  disposeRuntime(
    runtime: WorkspaceRuntime,
    reason: 'daemon_shutdown' | 'workspace_removed' | 'trust_reconfigured',
  ): Promise<void>;
  private stateFor;
  private release;
  private deleteIfIdle;
}
