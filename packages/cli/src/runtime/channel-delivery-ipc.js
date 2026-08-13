/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomUUID } from 'node:crypto';
import { CHANNEL_DELIVERY_ERROR_CODES, } from '@qwen-code/acp-bridge/bridgeOptions';
export { CHANNEL_DELIVERY_ERROR_CODES };
export class ChannelDeliveryError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ChannelDeliveryError';
    }
}
export function isChannelDeliveryErrorCode(value) {
    return typeof value === 'string' && CHANNEL_DELIVERY_ERROR_CODES.has(value);
}
export function isChannelDeliveryError(value) {
    return (value instanceof ChannelDeliveryError ||
        (typeof value === 'object' &&
            value !== null &&
            isChannelDeliveryErrorCode(value.code) &&
            typeof value.message === 'string'));
}
export const CHANNEL_DELIVERY_IPC_TIMEOUT_MS = 30_000;
export const MAX_CHANNEL_DELIVERIES_IN_FLIGHT = 16;
export const MAX_CHANNEL_DELIVERY_TEXT_LENGTH = 100_000;
export function createChannelDeliveryMessage(request) {
    return {
        type: 'channel_delivery',
        id: randomUUID(),
        expiresAt: Date.now() + CHANNEL_DELIVERY_IPC_TIMEOUT_MS,
        request,
    };
}
function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
function isChannelDeliveryTarget(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const target = value;
    return ((target['type'] === 'user' || target['type'] === 'chat') &&
        isNonEmptyString(target['id']) &&
        Object.keys(target).every((key) => key === 'type' || key === 'id'));
}
function isChannelDeliveryRequest(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const request = value;
    return (isNonEmptyString(request['deliveryId']) &&
        isNonEmptyString(request['channelName']) &&
        isChannelDeliveryTarget(request['target']) &&
        isNonEmptyString(request['text']) &&
        request['text'].length <= MAX_CHANNEL_DELIVERY_TEXT_LENGTH);
}
export function isChannelDeliveryMessage(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const message = value;
    return (message['type'] === 'channel_delivery' &&
        isNonEmptyString(message['id']) &&
        typeof message['expiresAt'] === 'number' &&
        Number.isFinite(message['expiresAt']) &&
        isChannelDeliveryRequest(message['request']));
}
export function isChannelDeliveryResultMessage(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const message = value;
    if (message['type'] !== 'channel_delivery_result' ||
        !isNonEmptyString(message['id']) ||
        typeof message['ok'] !== 'boolean') {
        return false;
    }
    if (message['ok'])
        return true;
    return (isChannelDeliveryErrorCode(message['code']) &&
        typeof message['error'] === 'string');
}
//# sourceMappingURL=channel-delivery-ipc.js.map