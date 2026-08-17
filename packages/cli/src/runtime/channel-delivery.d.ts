/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  MAX_CHANNEL_DELIVERY_NAME_LENGTH,
  MAX_CHANNEL_DELIVERY_TARGET_ID_LENGTH,
} from '@qwen-code/qwen-code-core';
import {
  MAX_CHANNEL_DELIVERY_TEXT_LENGTH,
  type ChannelDeliveryRequest,
} from './channel-delivery-ipc.js';
export {
  MAX_CHANNEL_DELIVERY_NAME_LENGTH,
  MAX_CHANNEL_DELIVERY_TARGET_ID_LENGTH,
  MAX_CHANNEL_DELIVERY_TEXT_LENGTH,
};
export interface PublicChannelDelivery {
  kind: 'channel';
  target: {
    channelName: string;
    type: 'user' | 'chat';
    id: string;
  };
}
export declare function parseChannelDelivery(
  value: unknown,
): PublicChannelDelivery;
export declare function normalizeChannelDeliveryText(text: string): string;
export declare function normalizeChannelDelivery(
  deliveryId: string,
  delivery: PublicChannelDelivery,
  text: string,
): ChannelDeliveryRequest;
