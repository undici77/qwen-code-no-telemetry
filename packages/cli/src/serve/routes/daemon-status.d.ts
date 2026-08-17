/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { AcpHttpHandle } from '../acp-http/index.js';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
import type {
  DeviceFlowProviderId,
  DeviceFlowRegistry,
} from '../auth/device-flow.js';
import type { DaemonLogger } from '../daemon-logger.js';
import {
  type DaemonMetricsBucket,
  type DaemonPerfSnapshot,
  type DaemonStartupSnapshot,
} from '../daemon-status.js';
import type { RateLimiterInstance } from '../rate-limit.js';
import type { ServeOptions } from '../types.js';
import type { ChannelWorkerSnapshot } from '../channel-worker-supervisor.js';
import type { ChannelWorkerGroupSnapshot } from '../channel-worker-group.js';
import type { DaemonWorkspaceService } from '../workspace-service/index.js';
import type { TotalSessionAdmissionSnapshot } from '../total-session-admission.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
import type { ChildHeapPolicySnapshot } from '@qwen-code/acp-bridge/childHeapPolicy';
interface RegisterDaemonStatusRoutesDeps {
  opts: ServeOptions;
  boundWorkspace: string;
  bridge: AcpSessionBridge;
  workspaceRegistry: WorkspaceRegistry;
  workspace: DaemonWorkspaceService;
  daemonLog?: DaemonLogger;
  startup?: DaemonStartupSnapshot;
  qwenCodeVersion?: string;
  getAcpHandle: () => AcpHttpHandle | undefined;
  getRateLimiter: () => RateLimiterInstance | undefined;
  getRestSseActive: () => number;
  currentServeFeatures: () => ReturnType<
    typeof import('../capabilities.js').getAdvertisedServeFeatures
  >;
  getSupportedDeviceFlowProviders: () => DeviceFlowProviderId[];
  deviceFlowRegistry: DeviceFlowRegistry;
  sessionShellCommandEnabled: boolean;
  getChannelWorkerSnapshot?: () => ChannelWorkerSnapshot;
  getChannelWorkerSnapshots?: () => ChannelWorkerGroupSnapshot[];
  getPerfSnapshot?: () => DaemonPerfSnapshot;
  getMetricsSeries?: () => DaemonMetricsBucket[];
  getTotalSessionAdmissionSnapshot?: () => TotalSessionAdmissionSnapshot;
  getChildHeapPolicySnapshot?: () => ChildHeapPolicySnapshot | undefined;
}
export declare function registerDaemonStatusRoutes(
  app: Application,
  deps: RegisterDaemonStatusRoutesDeps,
): void;
export {};
