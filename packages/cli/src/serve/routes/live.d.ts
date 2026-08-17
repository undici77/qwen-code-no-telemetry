/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, RequestHandler } from 'express';
import type { LiveHostCoordinator } from '../live/live-host-coordinator.js';
export interface RegisterLiveRoutesDeps {
  coordinator: LiveHostCoordinator;
  mutate: (options?: { strict?: boolean }) => RequestHandler;
  persistShortcut?: (shortcut: string) => Promise<void>;
}
export declare function registerLiveRoutes(
  app: Application,
  deps: RegisterLiveRoutesDeps,
): void;
