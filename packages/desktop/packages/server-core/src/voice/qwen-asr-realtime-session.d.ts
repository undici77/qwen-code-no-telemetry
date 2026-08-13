import type { SocketLike, VoiceStreamCallbacks, VoiceStreamConfig, VoiceStreamSession } from './voice-stream-session';
import { type Logger } from '../runtime/platform';
export interface QwenRealtimeDeps {
    createWebSocket?: (url: string, options: {
        headers: Record<string, string>;
    }) => SocketLike;
    /** Override the scoped logger (used by tests to capture diagnostics). */
    logger?: Logger;
}
export declare function deriveQwenRealtimeUrl(baseUrl: string, model: string): string;
export declare function openQwenAsrRealtimeStream(config: VoiceStreamConfig, callbacks?: VoiceStreamCallbacks, deps?: QwenRealtimeDeps): Promise<VoiceStreamSession>;
