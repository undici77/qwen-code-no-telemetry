/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const MAX_CHANNEL_STARTUP_FAILURES = 64;
export const MAX_CHANNEL_STARTUP_FAILURE_CHANNEL_LENGTH = 128;
export const MAX_CHANNEL_STARTUP_FAILURE_CODE_LENGTH = 64;
export const MAX_CHANNEL_STARTUP_FAILURE_MESSAGE_LENGTH = 512;
function isBoundedNonEmptyString(value, maxLength) {
    if (typeof value !== 'string' || value.length === 0)
        return false;
    let length = 0;
    for (const _codePoint of value) {
        length += 1;
        if (length > maxLength)
            return false;
    }
    return true;
}
export function isChannelStartupFailure(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    try {
        const failure = value;
        return (isBoundedNonEmptyString(failure['channel'], MAX_CHANNEL_STARTUP_FAILURE_CHANNEL_LENGTH) &&
            failure['phase'] === 'connect' &&
            (failure['code'] === undefined ||
                isBoundedNonEmptyString(failure['code'], MAX_CHANNEL_STARTUP_FAILURE_CODE_LENGTH)) &&
            isBoundedNonEmptyString(failure['message'], MAX_CHANNEL_STARTUP_FAILURE_MESSAGE_LENGTH));
    }
    catch {
        return false;
    }
}
export function isChannelStartupReportMessage(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    try {
        const message = value;
        if (message['type'] === 'channel_startup_failures_truncated') {
            return true;
        }
        return (message['type'] === 'channel_startup_failure' &&
            isChannelStartupFailure(message['failure']));
    }
    catch {
        return false;
    }
}
export function isChannelStartupReportAckMessage(value) {
    try {
        return (typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            value.type === 'channel_startup_report_ack');
    }
    catch {
        return false;
    }
}
export function isChannelStartupReportType(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    try {
        const type = value.type;
        return (type === 'channel_startup_failure' ||
            type === 'channel_startup_failures_truncated');
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=channel-worker-startup-ipc.js.map