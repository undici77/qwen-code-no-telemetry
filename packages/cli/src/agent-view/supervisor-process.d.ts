/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AgentViewSupervisorHandler } from './supervisor-server.js';
export interface AgentViewSupervisorHibernationPolicy {
  autoExit?: boolean;
  autoExitGraceMs?: number;
}
export interface AgentViewSupervisorHibernationResult {
  hibernated: string[];
}
export interface AgentViewSupervisorMaintenanceResult
  extends AgentViewSupervisorHibernationResult {
  shutdownRequested: boolean;
}
export interface AgentViewSupervisorMaintenance {
  hibernateIdleSessions(): Promise<AgentViewSupervisorHibernationResult>;
  tickIdleHibernation(): Promise<AgentViewSupervisorMaintenanceResult>;
}
export interface AgentViewSupervisorPathOptions {
  globalDir?: string;
  platform?: NodeJS.Platform;
  runtimeDir?: string;
}
export interface AgentViewSupervisorProcessOptions
  extends AgentViewSupervisorPathOptions {
  hibernationPolicy?: AgentViewSupervisorHibernationPolicy;
  now?: () => Date;
  onShutdown?: () => void | Promise<void>;
}
export declare function getAgentViewSupervisorSocketPath(
  options?: AgentViewSupervisorPathOptions,
): string;
export declare function createAgentViewSupervisorHandler(
  options?: AgentViewSupervisorProcessOptions,
): AgentViewSupervisorHandler & AgentViewSupervisorMaintenance;
