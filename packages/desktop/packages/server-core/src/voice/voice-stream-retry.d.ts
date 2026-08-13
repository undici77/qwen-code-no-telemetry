import type { VoiceStreamSession } from './voice-stream-session';
export declare function isRetryableVoiceStreamError(error: unknown): boolean;
export declare function openVoiceStreamWithRetry(open: () => Promise<VoiceStreamSession>): Promise<VoiceStreamSession>;
