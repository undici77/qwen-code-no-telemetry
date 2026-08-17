/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  ExtensionManager,
  type ClaudeMarketplaceConfig,
  type ExtensionSetting,
} from '@qwen-code/qwen-code-core';
import type { Request, Response } from 'express';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
import { type ServeWorkspaceExtensionsStatus } from '@qwen-code/acp-bridge/status';
import type { DaemonWorkspaceService } from '../workspace-service/index.js';
import type { WorkspaceRuntime } from '../workspace-registry.js';
import { type FifoTaskQueue } from '../extension-operation-scheduler.js';
export declare const redactExtensionDisplaySource: (source: string) => string;
/**
 * Thrown by the per-workspace install queue when it is saturated, and matched
 * by the route layer to emit a 429. Shared so the throw site and the match
 * site (a separate module) can never silently drift apart.
 */
export declare const EXTENSION_QUEUE_FULL_MESSAGE =
  'Extension operation queue is full';
export type ExtensionMutationEvent = {
  status:
    | 'installed'
    | 'enabled'
    | 'disabled'
    | 'updated'
    | 'uninstalled'
    | 'checked'
    | 'refreshed';
  source?: string;
  name?: string;
  version?: string;
  updated?: boolean;
  reason?: string;
  states?: Record<string, string>;
};
export type ExtensionPendingInteraction =
  | {
      id: string;
      kind: 'marketplace_plugin';
      marketplace: {
        name: string;
      };
      plugins: Array<{
        name: string;
        description?: string;
        source: string;
        category?: string;
        tags?: string[];
      }>;
    }
  | {
      id: string;
      kind: 'setting';
      setting: {
        name: string;
        description: string;
        sensitive: boolean;
      };
    };
export interface ExtensionInteractionHandlers {
  requestSetting(setting: ExtensionSetting): Promise<string>;
  requestChoicePlugin(marketplace: ClaudeMarketplaceConfig): Promise<string>;
}
export type ExtensionOperationStatus = {
  v: 1;
  operationId: string;
  operation: string;
  status:
    | 'queued'
    | 'running'
    | 'waiting_for_input'
    | 'succeeded'
    | 'succeeded_with_warnings'
    | 'failed';
  phase?: 'preparing' | 'committing' | 'reconciling';
  createdAt: number;
  updatedAt: number;
  source?: string;
  name?: string;
  result?: ExtensionMutationEvent & {
    refreshed?: number;
    failed?: number;
    error?: string;
  };
  interaction?: ExtensionPendingInteraction;
  error?: string;
  code?: string;
  warnings?: Array<{
    workspaceId?: string;
    workspaceCwd: string;
    code?: string;
    error: string;
  }>;
};
export interface ExtensionOperationContext {
  prepare<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T>;
  commit<
    T extends {
      generation: number;
      warnings?: ReadonlyArray<{
        code: string;
        error: string;
      }>;
    },
  >(
    task: (onCommitted: (generation: number) => void) => Promise<T>,
  ): Promise<T>;
}
export interface RuntimeReconciliationReservation {
  run<T>(task: () => Promise<T>): Promise<T>;
  release(): void;
}
export type ReserveRuntimeReconciliation =
  () => RuntimeReconciliationReservation;
export interface CreateExtensionsControllerDeps {
  boundWorkspace: string;
  bridge: AcpSessionBridge;
  workspace: DaemonWorkspaceService;
  maxExtensionOperationHistory?: number;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
}
/** Shared coordinator for the legacy adapter and V2 global operations. */
export interface ExtensionsController {
  readonly boundWorkspace: string;
  readonly workspace: DaemonWorkspaceService;
  createExtensionManager(
    workspaceDir?: string,
    isWorkspaceTrusted?: boolean,
    interactions?: ExtensionInteractionHandlers,
  ): ExtensionManager;
  buildLocalExtensionsStatus(): Promise<ServeWorkspaceExtensionsStatus>;
  refreshExtensionsForAllSessions(): Promise<{
    refreshed: number;
    failed: number;
  }>;
  getOperation(operationId: string): ExtensionOperationStatus | undefined;
  getActiveOperations(): ExtensionOperationStatus[];
  updateOperation(
    operationId: string,
    patch: Partial<Omit<ExtensionOperationStatus, 'operationId' | 'createdAt'>>,
  ): void;
  preparationQueue: FifoTaskQueue;
  acquireOperationSlot(res: Response): (() => void) | undefined;
  validateExtensionMutationClient(
    req: Request,
    res: Response,
    opts?: {
      requireClientId?: boolean;
      bridges?: readonly AcpSessionBridge[];
    },
  ): boolean;
  runQueuedExtensionMutation(
    operation: string,
    failureContext: {
      source?: string;
      name?: string;
    },
    res: Response,
    run: (
      extensionManager: ExtensionManager,
      signal?: AbortSignal,
      context?: ExtensionOperationContext,
      operationId?: string,
    ) => Promise<ExtensionMutationEvent>,
    options?: {
      manager?: ExtensionManager;
      createManager?: (operationId: string) => ExtensionManager;
      onSettled?: (operationId: string) => void;
      refreshRuntimes?:
        | readonly WorkspaceRuntime[]
        | (() => readonly WorkspaceRuntime[]);
      reserveRuntimeReconciliation?: ReserveRuntimeReconciliation;
      operationBasePath?: string;
      skipRefresh?: boolean;
      deadlineMs?: number;
      onRuntimeReconciled?: (
        runtime: WorkspaceRuntime,
        generation: number,
      ) => void;
      assertGenerationOpen?: () => void;
    },
  ): void;
}
export declare function createExtensionsController(
  deps: CreateExtensionsControllerDeps,
): ExtensionsController;
