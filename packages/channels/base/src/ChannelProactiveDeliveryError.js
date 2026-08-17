/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const CHANNEL_PROACTIVE_DELIVERY_ERROR_CODE =
  'channel_proactive_delivery_error';
export class ChannelProactiveDeliveryError extends Error {
  disposition;
  code = CHANNEL_PROACTIVE_DELIVERY_ERROR_CODE;
  constructor(disposition, message, options) {
    super(message, options);
    this.disposition = disposition;
    this.name = 'ChannelProactiveDeliveryError';
  }
}
export function isChannelProactiveDeliveryError(error) {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error;
  return (
    candidate.code === CHANNEL_PROACTIVE_DELIVERY_ERROR_CODE &&
    (candidate.disposition === 'permanent' ||
      candidate.disposition === 'transient') &&
    typeof candidate.message === 'string'
  );
}
//# sourceMappingURL=ChannelProactiveDeliveryError.js.map
