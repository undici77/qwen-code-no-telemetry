/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request } from 'express';
import type {
  ChannelWebhookConfig,
  ChannelWebhookTask,
} from '@qwen-code/channel-base';
import type { ChannelWebhookAccepted } from '../channel-webhook-ipc.js';
import type { DaemonLogger } from '../daemon-logger.js';
import type { RateLimiterInstance } from '../rate-limit.js';
export interface ChannelWebhookRouteDeps {
  getChannelsConfig: () => Record<
    string,
    {
      webhooks?: ChannelWebhookConfig;
    }
  >;
  safeBody: (req: Request) => Record<string, unknown>;
  enqueueWebhookTask: (
    task: ChannelWebhookTask,
  ) => Promise<ChannelWebhookAccepted>;
  rateLimiter?: Pick<RateLimiterInstance, 'checkRate'>;
  daemonLog?: Pick<DaemonLogger, 'info' | 'warn'>;
}
export declare function registerChannelWebhookRoutes(
  app: Application,
  deps: ChannelWebhookRouteDeps,
): void;
