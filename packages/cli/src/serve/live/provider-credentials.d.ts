/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Settings } from '../../config/settings.js';
export declare const DEFAULT_LIVE_VOICE_MODEL = "qwen3.5-omni-plus-realtime";
export declare const DEFAULT_LIVE_ENDPOINT = "wss://dashscope.aliyuncs.com/api-ws/v1/realtime";
export declare const DEFAULT_LIVE_VOICE = "Tina";
export declare const DEFAULT_LIVE_SHORTCUT = "Command+E";
export interface LiveVoiceConfiguration {
    enabled: boolean;
    model: string;
    endpoint: string;
    voice: string;
    shortcut: string;
}
export interface LiveProviderCredential {
    endpoint: string;
    realtimeModel: string;
    voice: string;
    /** Non-enumerable so routine JSON/log serialization cannot expose it. */
    apiKey: string;
}
export declare class LiveProviderConfigError extends Error {
    readonly code: "live_provider_config";
    constructor(message: string);
}
export declare function readLiveVoiceConfiguration(settings: Settings): LiveVoiceConfiguration;
/**
 * Resolve the dedicated Realtime credential without consulting chat-model
 * providers. The returned API key is deliberately non-enumerable.
 */
export declare function resolveLiveProviderCredential(settings: Settings, options?: {
    apiKey?: string;
    allowDisabled?: boolean;
}): LiveProviderCredential;
