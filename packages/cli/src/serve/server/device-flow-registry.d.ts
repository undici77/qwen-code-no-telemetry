/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
import {
  DeviceFlowRegistry,
  type DeviceFlowProvider,
  type DeviceFlowProviderId,
} from '../auth/device-flow.js';
interface SetupDeviceFlowRegistryDeps {
  app: Application;
  bridge: AcpSessionBridge;
  registry?: DeviceFlowRegistry;
  providers?: DeviceFlowProvider[];
  resolveEventBridges?: () => AcpSessionBridge[];
}
export interface ServeDeviceFlowRuntime {
  deviceFlowRegistry: DeviceFlowRegistry;
  getSupportedDeviceFlowProviders: () => DeviceFlowProviderId[];
}
export declare function createDeviceFlowRegistry(deps: {
  bridge: AcpSessionBridge;
  registry?: DeviceFlowRegistry;
  providers?: DeviceFlowProvider[];
  /**
   * Phase 4: the set of bridges each device-flow event should fan out to
   * (primary + trusted secondary runtimes), resolved lazily on every publish.
   * Defaults to the single `bridge` when omitted, preserving prior behavior.
   */
  resolveEventBridges?: () => AcpSessionBridge[];
}): ServeDeviceFlowRuntime;
/**
 * Set up the daemon-global device-flow registry: builds the registry via
 * {@link createDeviceFlowRegistry} and exposes it on `app.locals` for the REST
 * auth routes. Secondary ACP mounts share this single registry (OAuth
 * credentials are process-global); auth-flow events fan out best-effort to every
 * trusted runtime's bridge via `resolveEventBridges`.
 */
export declare function setupDeviceFlowRegistry(
  deps: SetupDeviceFlowRegistryDeps,
): ServeDeviceFlowRuntime;
export {};
