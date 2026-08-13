/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export interface VoiceStreamConfig {
    /** HTTPS base URL of the configured provider; its host derives the wss URL. */
    baseUrl: string;
    apiKey?: string;
    /** A realtime model id, e.g. paraformer-realtime-v2 / fun-asr-realtime. */
    model: string;
    /** Optional BCP-47-ish language code (paraformer language_hints). */
    language?: string;
    /** Optional contextual bias text for providers that support corpus prompts. */
    keytermsContext?: string;
}
export interface VoiceStreamCallbacks {
    /** The full running transcript (committed sentences + current partial). */
    onInterim?: (text: string) => void;
    /** Terminal stream errors that arrive while recording, before finish(). */
    onError?: (error: Error) => void;
}
export interface VoiceStreamSession {
    pushAudio: (pcm: Uint8Array) => void;
    /** Flush, wait for the final result, and return the full transcript. */
    finish: () => Promise<string>;
    abort: () => void;
}
export interface SocketLike {
    readyState: number;
    OPEN: number;
    bufferedAmount?: number;
    send: (data: string | Uint8Array) => void;
    close: () => void;
    on: (event: string, cb: (...args: unknown[]) => void) => void;
}
export interface VoiceStreamDeps {
    createWebSocket?: (url: string, options: {
        headers: Record<string, string>;
    }) => SocketLike;
    abortSignal?: AbortSignal;
}
export declare function deriveWebSocketBase(baseUrl: string): string;
export declare function deriveStreamUrl(baseUrl: string): string;
export declare function openVoiceStream(config: VoiceStreamConfig, callbacks?: VoiceStreamCallbacks, deps?: VoiceStreamDeps): Promise<VoiceStreamSession>;
