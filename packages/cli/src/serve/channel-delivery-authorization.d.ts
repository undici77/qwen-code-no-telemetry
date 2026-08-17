/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ChannelDeliveryAuthorizationTarget {
  channelName: string;
  type: 'user' | 'chat';
  id: string;
}
interface PromptAuthorization {
  sessionId: string;
  deliveryId: string;
  target: ChannelDeliveryAuthorizationTarget;
}
interface ScheduledTaskAuthorization {
  sessionId: string;
  taskId: string;
  target: ChannelDeliveryAuthorizationTarget;
  recurring: boolean;
  lastConsumedAt: number;
}
interface DeliveryAuthorizationRequest {
  sessionId: string;
  deliveryId: string;
  source: 'prompt' | 'scheduled';
  target: ChannelDeliveryAuthorizationTarget;
  promptId?: string;
  taskId?: string;
  firedAt?: number;
}
export declare class ChannelDeliveryAuthorizationStore {
  #private;
  authorizePrompt(
    workspaceCwd: string,
    authorization: PromptAuthorization,
  ): void;
  revokePrompt(
    workspaceCwd: string,
    sessionId: string,
    deliveryId: string,
  ): void;
  registerScheduledTask(
    workspaceCwd: string,
    authorization: Omit<ScheduledTaskAuthorization, 'lastConsumedAt'> & {
      lastFiredAt?: number;
    },
  ): void;
  revokeScheduledTask(
    workspaceCwd: string,
    sessionId: string,
    taskId: string,
  ): void;
  consume(workspaceCwd: string, request: DeliveryAuthorizationRequest): boolean;
}
export {};
