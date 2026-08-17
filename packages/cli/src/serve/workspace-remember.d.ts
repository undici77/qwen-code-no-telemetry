/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type {
  AcpSessionBridge,
  BridgeWorkspaceMemoryDreamResult,
  BridgeWorkspaceMemoryForgetResult,
  BridgeWorkspaceMemoryRememberContextMode,
  BridgeWorkspaceMemoryRememberResult,
} from './acp-session-bridge.js';
export type WorkspaceMemoryTaskStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed';
/** @deprecated Use WorkspaceMemoryTaskStatus. */
export type WorkspaceMemoryRememberTaskStatus = WorkspaceMemoryTaskStatus;
export type WorkspaceMemoryTaskKind = 'remember' | 'forget' | 'dream';
interface WorkspaceMemoryTaskBaseSnapshot {
  taskId: string;
  status: WorkspaceMemoryTaskStatus;
  createdAt: string;
  updatedAt: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}
export interface WorkspaceMemoryRememberTaskSnapshot
  extends WorkspaceMemoryTaskBaseSnapshot {
  contextMode: BridgeWorkspaceMemoryRememberContextMode;
  result?: BridgeWorkspaceMemoryRememberResult;
}
export interface WorkspaceMemoryForgetTaskSnapshot
  extends WorkspaceMemoryTaskBaseSnapshot {
  result?: BridgeWorkspaceMemoryForgetResult;
}
export interface WorkspaceMemoryDreamTaskSnapshot
  extends WorkspaceMemoryTaskBaseSnapshot {
  result?: BridgeWorkspaceMemoryDreamResult;
}
type WorkspaceMemoryTaskRecord = (
  | ({
      kind: 'remember';
    } & WorkspaceMemoryRememberTaskSnapshot)
  | ({
      kind: 'forget';
    } & WorkspaceMemoryForgetTaskSnapshot)
  | ({
      kind: 'dream';
    } & WorkspaceMemoryDreamTaskSnapshot)
) & {
  originatorClientId?: string;
};
export interface WorkspaceRememberRouteDeps {
  bridge: AcpSessionBridge;
  lane: WorkspaceRememberTaskLane;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  parseClientId: (req: Request, res: Response) => string | undefined | null;
  safeBody: (req: Request) => Record<string, unknown>;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
}
type WorkspaceRememberResolvedRouteDeps = Omit<
  WorkspaceRememberRouteDeps,
  'mutate'
>;
export declare function publicErrorMessage(
  code: string,
  kind: WorkspaceMemoryTaskKind,
): string;
export declare function publicErrorStatus(code: string): number;
export declare class WorkspaceRememberTaskLane {
  private readonly bridge;
  private readonly workspaceCwd;
  private static readonly MAX_TASKS;
  private static readonly TERMINAL_TASK_TTL_MS;
  private static readonly MAX_PENDING;
  private static readonly MAX_NON_REMEMBER_PENDING;
  private static readonly NON_REMEMBER_KINDS;
  private readonly tasks;
  private tail;
  private draining;
  private disposed;
  constructor(bridge: AcpSessionBridge, workspaceCwd?: string);
  beginDrain(): void;
  cancelDrain(): void;
  pendingCount(): number;
  dispose(): void;
  private failRunningTaskAfterRemoval;
  private pendingCounts;
  private evictTerminalTasks;
  private assertCapacity;
  private queue;
  private publishManagedMemoryChanged;
  enqueue(params: {
    content: string;
    contextMode: BridgeWorkspaceMemoryRememberContextMode;
    originatorClientId?: string;
    assertGenerationOpen?: () => void;
  }): WorkspaceMemoryRememberTaskSnapshot;
  enqueueForget(params: {
    query: string;
    originatorClientId?: string;
    assertGenerationOpen?: () => void;
  }): WorkspaceMemoryForgetTaskSnapshot;
  enqueueDream(params: {
    originatorClientId?: string;
    assertGenerationOpen?: () => void;
  }): WorkspaceMemoryDreamTaskSnapshot;
  get(
    taskId: string,
    requesterClientId?: string,
    kind?: WorkspaceMemoryTaskRecord['kind'],
  ):
    | WorkspaceMemoryRememberTaskSnapshot
    | WorkspaceMemoryForgetTaskSnapshot
    | WorkspaceMemoryDreamTaskSnapshot
    | undefined;
}
interface WorkspaceRememberRouteResolveOptions {
  /** POST routes create a lane on demand; GET routes must not allocate. */
  creating: boolean;
  kind: WorkspaceMemoryTaskKind;
}
type WorkspaceRememberRouteDepsResolver = (
  req: Request,
  res: Response,
  options: WorkspaceRememberRouteResolveOptions,
) => WorkspaceRememberResolvedRouteDeps | null;
export declare function mountWorkspaceMemoryRememberRoutes(
  app: Application,
  deps: WorkspaceRememberRouteDeps,
): void;
export declare function mountWorkspaceQualifiedMemoryRememberRoutes(
  app: Application,
  deps: {
    mutate: WorkspaceRememberRouteDeps['mutate'];
    resolveRouteDeps: WorkspaceRememberRouteDepsResolver;
  },
): void;
export {};
