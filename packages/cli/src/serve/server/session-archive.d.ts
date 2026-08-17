/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  SessionService,
  type SessionLocation,
} from '@qwen-code/qwen-code-core';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
export interface DaemonArchiveSessionsResult {
  archived: string[];
  alreadyArchived: string[];
  notFound: string[];
  errors: Array<{
    sessionId: string;
    error: unknown;
  }>;
}
export interface DaemonUnarchiveSessionsResult {
  unarchived: string[];
  alreadyActive: string[];
  notFound: string[];
  errors: Array<{
    sessionId: string;
    error: unknown;
  }>;
}
export interface DaemonDeleteSessionsResult {
  removed: string[];
  notFound: string[];
  errors: Array<{
    sessionId: string;
    error: unknown;
  }>;
}
export type DaemonDeleteErrorPhase = 'close' | 'remove' | 'delete';
export declare class DaemonDrainingError extends Error {
  readonly name = 'DaemonDrainingError';
  readonly code = 'daemon_draining';
  constructor();
}
export declare class SessionArchiveCoordinator {
  private readonly exclusive;
  private readonly shared;
  private maintenanceSealed;
  private activeMaintenance;
  private maintenanceDrain;
  assertNotTransitioning(sessionId: string): void;
  runExclusiveMany<T>(sessionIds: string[], fn: () => Promise<T>): Promise<T>;
  sealMaintenanceAndWait(): Promise<void>;
  runSharedMany<T>(sessionIds: string[], fn: () => Promise<T>): Promise<T>;
}
export declare function deleteDaemonSessions(params: {
  sessionIds: string[];
  service: SessionService;
  bridge: Pick<AcpSessionBridge, 'closeSession'>;
  coordinator: SessionArchiveCoordinator;
  onError?: (entry: {
    phase: DaemonDeleteErrorPhase;
    sessionId: string;
    error: string;
  }) => void;
}): Promise<DaemonDeleteSessionsResult>;
export declare function deleteDaemonSessionIfOrphan(params: {
  sessionId: string;
  service: SessionService;
  bridge: Pick<AcpSessionBridge, 'killSession'>;
  coordinator: SessionArchiveCoordinator;
}): Promise<boolean>;
export declare function assertSessionLoadable(
  workspaceCwd: string,
  sessionId: string,
  runtimeBaseDir?: string,
): Promise<SessionLocation>;
export declare function assertSessionArchived(
  workspaceCwd: string,
  sessionId: string,
  runtimeBaseDir?: string,
): Promise<void>;
export declare function logSessionArchiveWarning(message: string): void;
export declare function archiveDaemonSessions(params: {
  sessionIds: string[];
  service: SessionService;
  bridge: Pick<AcpSessionBridge, 'closeSession'>;
  coordinator: SessionArchiveCoordinator;
}): Promise<DaemonArchiveSessionsResult>;
export declare function unarchiveDaemonSessions(params: {
  sessionIds: string[];
  service: SessionService;
  coordinator: SessionArchiveCoordinator;
}): Promise<DaemonUnarchiveSessionsResult>;
