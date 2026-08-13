/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const DEFAULT_LIVE_VOICE_MODEL = 'qwen3.5-omni-plus-realtime';
export const DEFAULT_LIVE_ENDPOINT = 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime';
export const DEFAULT_LIVE_VOICE = 'Tina';
export const DEFAULT_LIVE_SHORTCUT = 'Command+E';
export class LiveProviderConfigError extends Error {
    code = 'live_provider_config';
    constructor(message) {
        super(message);
        this.name = 'LiveProviderConfigError';
    }
}
function readNonEmpty(value, fallback) {
    return typeof value === 'string' && value.trim().length > 0
        ? value.trim()
        : fallback;
}
function readShortcut(value) {
    if (typeof value !== 'string')
        return DEFAULT_LIVE_SHORTCUT;
    const shortcut = value.trim();
    return shortcut.length <= 128 ? shortcut : DEFAULT_LIVE_SHORTCUT;
}
export function readLiveVoiceConfiguration(settings) {
    const raw = settings.experimental?.liveVoice;
    return {
        enabled: raw?.enabled === true,
        model: readNonEmpty(raw?.model, DEFAULT_LIVE_VOICE_MODEL),
        endpoint: readNonEmpty(raw?.endpoint, DEFAULT_LIVE_ENDPOINT),
        voice: readNonEmpty(raw?.voice, DEFAULT_LIVE_VOICE),
        shortcut: readShortcut(raw?.shortcut),
    };
}
function isDashScopeHost(hostname) {
    const host = hostname.toLowerCase();
    return (host === 'dashscope.aliyuncs.com' ||
        host === 'dashscope-intl.aliyuncs.com' ||
        host === 'dashscope-us.aliyuncs.com' ||
        host.endsWith('.dashscope.aliyuncs.com') ||
        host.endsWith('.dashscope-intl.aliyuncs.com') ||
        host.endsWith('.dashscope-us.aliyuncs.com') ||
        host === 'maas.aliyuncs.com' ||
        host.endsWith('.maas.aliyuncs.com'));
}
function hasCredentialQuery(url) {
    for (const name of url.searchParams.keys()) {
        if (/api.?key|authorization|token/i.test(name))
            return true;
    }
    return false;
}
function validateRealtimeEndpoint(value) {
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        throw new LiveProviderConfigError('experimental.liveVoice.endpoint is invalid.');
    }
    if (parsed.protocol !== 'wss:' ||
        parsed.username.length > 0 ||
        parsed.password.length > 0 ||
        hasCredentialQuery(parsed) ||
        !isDashScopeHost(parsed.hostname)) {
        throw new LiveProviderConfigError('experimental.liveVoice.endpoint must be a supported secure DashScope WebSocket endpoint.');
    }
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
}
/**
 * Resolve the dedicated Realtime credential without consulting chat-model
 * providers. The returned API key is deliberately non-enumerable.
 */
export function resolveLiveProviderCredential(settings, options = {}) {
    const live = readLiveVoiceConfiguration(settings);
    if (!live.enabled && options.allowDisabled !== true) {
        throw new LiveProviderConfigError('Live Voice is disabled.');
    }
    const configuredKey = settings.experimental?.liveVoice?.apiKey;
    const apiKey = options.apiKey?.trim() ||
        (typeof configuredKey === 'string' ? configuredKey.trim() : '');
    if (!apiKey) {
        throw new LiveProviderConfigError('The DashScope Realtime API key is not configured.');
    }
    const credential = {
        endpoint: validateRealtimeEndpoint(live.endpoint),
        realtimeModel: live.model,
        voice: live.voice,
    };
    Object.defineProperty(credential, 'apiKey', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: apiKey,
    });
    return credential;
}
//# sourceMappingURL=provider-credentials.js.map