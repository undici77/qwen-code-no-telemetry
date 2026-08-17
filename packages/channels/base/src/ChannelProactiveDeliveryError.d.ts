/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type ChannelProactiveDeliveryDisposition = 'permanent' | 'transient';
export declare const CHANNEL_PROACTIVE_DELIVERY_ERROR_CODE: 'channel_proactive_delivery_error';
export declare class ChannelProactiveDeliveryError extends Error {
  readonly disposition: ChannelProactiveDeliveryDisposition;
  readonly code: 'channel_proactive_delivery_error';
  constructor(
    disposition: ChannelProactiveDeliveryDisposition,
    message: string,
    options?: ErrorOptions,
  );
}
export declare function isChannelProactiveDeliveryError(
  error: unknown,
): error is ChannelProactiveDeliveryError;
