/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { DaemonLogger } from '../daemon-logger.js';
import { type RateLimiterInstance } from '../rate-limit.js';
import type { ServeOptions } from '../types.js';
export declare function installRateLimiter(
  app: Application,
  opts: ServeOptions,
  daemonLog: DaemonLogger | undefined,
  options?: {
    mount?: boolean;
    workspaceQualifiedAcpEnabled?: boolean;
  },
): RateLimiterInstance | undefined;
