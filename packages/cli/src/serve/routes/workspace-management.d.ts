/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request } from 'express';
import type {
  WorkspaceRegistry,
  WorkspaceRuntime,
} from '../workspace-registry.js';
import type { AcpHttpHandle } from '../acp-http/index.js';
import { type WorkspaceRegistrationStore } from '../workspace-registration-store.js';
import {
  type ManagedScratchRoot,
  type WorkspaceRuntimeProvenance,
} from '../managed-scratch-workspace.js';
export interface WorkspaceManagementRouteDeps {
  workspaceRegistry: WorkspaceRegistry;
  mutate: (opts?: { strict?: boolean }) => import('express').RequestHandler;
  safeBody: (req: Request) => Record<string, unknown>;
  createWorkspaceRuntime?: (
    cwd: string,
    options: {
      provenance: WorkspaceRuntimeProvenance;
    },
  ) => Promise<WorkspaceRuntime>;
  managedScratchRoot?: ManagedScratchRoot;
  validateWorkspaceRuntimeForPublication?: (
    runtime: WorkspaceRuntime,
  ) => Promise<WorkspaceRuntime>;
  runWorkspaceTrustOperation?: <T>(operation: () => Promise<T>) => Promise<T>;
  workspaceRegistrationStore?: WorkspaceRegistrationStore;
  getAcpHandle?: () => AcpHttpHandle | undefined;
  runtimeRemoval?: WorkspaceRuntimeRemovalController;
  pickWorkspaceDirectory?: (
    signal?: AbortSignal,
  ) => Promise<string | undefined>;
}
export interface WorkspaceRemovalActivity {
  sessions: number;
  activePrompts: number;
  pendingSessionStarts: number;
  acpConnections: number;
  memoryTasks: number;
  channelWorkers: number;
  voiceSessions: number;
}
export interface WorkspaceRuntimeRemovalController {
  runtimeAdded?(runtime: WorkspaceRuntime): Promise<void>;
  beginDrain(runtime: WorkspaceRuntime): void;
  cancelDrain(runtime: WorkspaceRuntime): void;
  completeDrain(runtime: WorkspaceRuntime): void;
  getActivity(runtime: WorkspaceRuntime): {
    pendingSessionStarts: number;
    channelWorkers: number;
    voiceSessions: number;
  };
  disposeRuntime(
    runtime: WorkspaceRuntime,
    reason?: 'daemon_shutdown' | 'workspace_removed' | 'trust_reconfigured',
  ): Promise<void>;
}
export interface WorkspaceManagementHandle {
  sealAndWait(): Promise<void>;
  publishOwnedRuntime(
    canonicalCwd: string,
    provenance: Exclude<WorkspaceRuntimeProvenance, 'existing'>,
    validate: (runtime: WorkspaceRuntime) => void | Promise<void>,
  ): Promise<WorkspaceRuntime>;
}
export declare function registerWorkspaceManagementRoutes(
  app: Application,
  deps: WorkspaceManagementRouteDeps,
): WorkspaceManagementHandle;
