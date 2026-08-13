/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const PLATFORM_MARKS = {
    dingtalk: 'D',
    wecom: 'W',
    feishu: 'F',
    github: 'GH',
    gitlab: 'GL',
};
const SUPPORTED_CHANNEL_TYPES = new Set([
    'dingtalk',
    'wecom',
    'feishu',
    'github',
    'gitlab',
]);
export function isSupportedChannelType(type) {
    return typeof type === 'string' && SUPPORTED_CHANNEL_TYPES.has(type);
}
export function isChannelPlatformAvailable(descriptor) {
    return descriptor.manageable && isSupportedChannelType(descriptor.type);
}
//# sourceMappingURL=channel-platform.js.map