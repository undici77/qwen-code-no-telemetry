/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler } from 'express';
import {
  type ChannelDeliveryAccepted,
  type ChannelDeliveryRequest,
} from '../../runtime/channel-delivery-ipc.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
interface RegisterChannelNotifyRoutesDeps {
  boundWorkspace: string;
  workspaceRegistry: WorkspaceRegistry;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  safeBody: (req: Request) => Record<string, unknown>;
  deliverChannelMessage?: (
    workspaceCwd: string,
    request: ChannelDeliveryRequest,
  ) => Promise<ChannelDeliveryAccepted>;
}
export declare function registerChannelNotifyRoutes(
  app: Application,
  deps: RegisterChannelNotifyRoutesDeps,
): void;
export {};
