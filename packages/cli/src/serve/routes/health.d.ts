/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { RateLimiterInstance } from '../rate-limit.js';
import type { ServeOptions } from '../types.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
interface CreateHealthRoutesDeps {
  opts: Pick<ServeOptions, 'hostname' | 'requireAuth'>;
  workspaceRegistry: WorkspaceRegistry;
  getActiveSseCount: () => number;
  getRateLimiter: () => RateLimiterInstance | undefined;
}
interface HealthRoutes {
  exposeHealthPreAuth: boolean;
  register(app: Application): void;
}
export declare function createHealthRoutes(
  deps: CreateHealthRoutesDeps,
): HealthRoutes;
export {};
