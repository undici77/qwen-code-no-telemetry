/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { MAX_CHANNEL_DELIVERY_NAME_LENGTH, MAX_CHANNEL_DELIVERY_TARGET_ID_LENGTH, } from '@qwen-code/qwen-code-core';
import { ChannelDeliveryError, MAX_CHANNEL_DELIVERY_TEXT_LENGTH, } from './channel-delivery-ipc.js';
export { MAX_CHANNEL_DELIVERY_NAME_LENGTH, MAX_CHANNEL_DELIVERY_TARGET_ID_LENGTH, MAX_CHANNEL_DELIVERY_TEXT_LENGTH, };
const TRUNCATED_TEXT_SUFFIX = '\n\n[Channel delivery truncated because the result exceeded the delivery size limit.]';
function isBoundedString(value, maxLength) {
    return (typeof value === 'string' &&
        value.trim().length > 0 &&
        value.length <= maxLength);
}
export function parseChannelDelivery(value) {
    if (typeof value !== 'object' || value === null) {
        throw new ChannelDeliveryError('channel_delivery_invalid', 'Invalid channel delivery.');
    }
    const delivery = value;
    const rawTarget = delivery['target'];
    if (delivery['kind'] !== 'channel' ||
        typeof rawTarget !== 'object' ||
        rawTarget === null ||
        !Object.keys(delivery).every((key) => key === 'kind' || key === 'target')) {
        throw new ChannelDeliveryError('channel_delivery_invalid', 'Invalid channel delivery.');
    }
    const target = rawTarget;
    if (!isBoundedString(target['channelName'], MAX_CHANNEL_DELIVERY_NAME_LENGTH) ||
        (target['type'] !== 'user' && target['type'] !== 'chat') ||
        !isBoundedString(target['id'], MAX_CHANNEL_DELIVERY_TARGET_ID_LENGTH) ||
        !Object.keys(target).every((key) => key === 'channelName' || key === 'type' || key === 'id')) {
        throw new ChannelDeliveryError('channel_delivery_invalid', 'Invalid channel delivery.');
    }
    return {
        kind: 'channel',
        target: {
            channelName: target['channelName'],
            type: target['type'],
            id: target['id'],
        },
    };
}
export function normalizeChannelDeliveryText(text) {
    if (text.length <= MAX_CHANNEL_DELIVERY_TEXT_LENGTH)
        return text;
    const prefixLimit = MAX_CHANNEL_DELIVERY_TEXT_LENGTH - TRUNCATED_TEXT_SUFFIX.length;
    let prefix = text.slice(0, prefixLimit);
    const lastCodeUnit = prefix.charCodeAt(prefix.length - 1);
    if (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) {
        prefix = prefix.slice(0, -1);
    }
    return `${prefix}${TRUNCATED_TEXT_SUFFIX}`;
}
export function normalizeChannelDelivery(deliveryId, delivery, text) {
    if (typeof text !== 'string' || text.trim().length === 0) {
        throw new ChannelDeliveryError('channel_delivery_invalid', 'Channel delivery text is empty.');
    }
    return {
        deliveryId,
        channelName: delivery.target.channelName,
        target: { type: delivery.target.type, id: delivery.target.id },
        text: normalizeChannelDeliveryText(text),
    };
}
//# sourceMappingURL=channel-delivery.js.map