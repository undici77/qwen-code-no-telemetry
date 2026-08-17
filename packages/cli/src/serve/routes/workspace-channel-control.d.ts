/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type {
  ChannelWorkerControlState,
  ChannelWorkerSetResult,
  ChannelWorkerStopResult,
} from '../channel-worker-manager.js';
import type { ChannelWorkerSnapshot } from '../channel-worker-supervisor.js';
import type { SendBridgeError } from '../server/error-response.js';
import type { ServeChannelSelection } from '../types.js';
interface RegisterWorkspaceChannelControlRoutesDeps {
  getChannelWorkerControl: () => ChannelWorkerControlState;
  isDaemonDraining?: () => boolean;
  isManagerInitializing?: () => boolean;
  setChannelWorkerSelection?: (
    selection: ServeChannelSelection,
  ) => Promise<ChannelWorkerSetResult>;
  stopChannelWorker?: () => Promise<ChannelWorkerStopResult>;
  reloadChannelWorker?: () => Promise<ChannelWorkerSnapshot>;
  mutate: (opts?: { strict?: boolean }) => RequestHandler;
  safeBody: (req: Request) => Record<string, unknown>;
  sendBridgeError: SendBridgeError;
  parseAndValidateClientId: (
    req: Request,
    res: Response,
  ) => string | undefined | null;
}
export declare function registerWorkspaceChannelControlRoutes(
  app: Application,
  deps: RegisterWorkspaceChannelControlRoutesDeps,
): void;
export {};
