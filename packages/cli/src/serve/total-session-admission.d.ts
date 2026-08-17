/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type BridgeFreshSessionAdmission } from './acp-session-bridge.js';
interface SessionCountSource {
  readonly sessionCount: number;
}
export interface TotalSessionAdmissionOptions {
  readonly maxTotalSessions?: number;
  readonly getBridges: () => readonly SessionCountSource[];
}
export interface TotalSessionAdmissionSnapshot {
  readonly liveCount: number;
  readonly inFlight: number;
}
export interface TotalSessionAdmissionController {
  readonly admit: BridgeFreshSessionAdmission;
  readonly snapshot: () => TotalSessionAdmissionSnapshot;
  readonly snapshotForWorkspace: (
    workspaceCwd: string,
  ) => TotalSessionAdmissionSnapshot;
  readonly beginWorkspaceDrain: (workspaceCwd: string) => void;
  readonly cancelWorkspaceDrain: (workspaceCwd: string) => void;
  readonly completeWorkspaceDrain: (workspaceCwd: string) => void;
}
export declare function createTotalSessionAdmissionController({
  maxTotalSessions,
  getBridges,
}: TotalSessionAdmissionOptions): TotalSessionAdmissionController;
export {};
