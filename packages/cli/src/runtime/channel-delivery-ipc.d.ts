/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  CHANNEL_DELIVERY_ERROR_CODES,
  type ChannelDeliveryErrorCode,
} from '@qwen-code/acp-bridge/bridgeOptions';
export { CHANNEL_DELIVERY_ERROR_CODES, type ChannelDeliveryErrorCode };
export declare class ChannelDeliveryError extends Error {
  readonly code: ChannelDeliveryErrorCode;
  constructor(code: ChannelDeliveryErrorCode, message: string);
}
export declare function isChannelDeliveryErrorCode(
  value: unknown,
): value is ChannelDeliveryErrorCode;
export declare function isChannelDeliveryError(
  value: unknown,
): value is ChannelDeliveryError;
export interface ChannelDeliveryRequest {
  deliveryId: string;
  channelName: string;
  target:
    | {
        type: 'user';
        id: string;
      }
    | {
        type: 'chat';
        id: string;
      };
  text: string;
}
export interface ChannelDeliveryRequestMessage {
  type: 'channel_delivery';
  id: string;
  expiresAt: number;
  request: ChannelDeliveryRequest;
}
export type ChannelDeliveryResultMessage =
  | {
      type: 'channel_delivery_result';
      id: string;
      ok: true;
    }
  | {
      type: 'channel_delivery_result';
      id: string;
      ok: false;
      code: ChannelDeliveryErrorCode;
      error: string;
    };
export interface ChannelDeliveryAccepted {
  delivered: true;
}
export declare const CHANNEL_DELIVERY_IPC_TIMEOUT_MS = 30000;
export declare const MAX_CHANNEL_DELIVERIES_IN_FLIGHT = 16;
export declare const MAX_CHANNEL_DELIVERY_TEXT_LENGTH = 100000;
export declare function createChannelDeliveryMessage(
  request: ChannelDeliveryRequest,
): ChannelDeliveryRequestMessage;
export declare function isChannelDeliveryMessage(
  value: unknown,
): value is ChannelDeliveryRequestMessage;
export declare function isChannelDeliveryResultMessage(
  value: unknown,
): value is ChannelDeliveryResultMessage;
