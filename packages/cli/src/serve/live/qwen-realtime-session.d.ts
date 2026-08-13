/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SocketLike } from '../../ui/voice/voice-stream-session.js';
export type RealtimeCallEpoch = string | number;
export declare const QWEN_REALTIME_INPUT_SAMPLE_RATE = 16000;
export declare const QWEN_REALTIME_OUTPUT_SAMPLE_RATE = 24000;
export declare const QWEN_REALTIME_LIMITS: {
    readonly maxInputAudioFrameBytes: number;
    readonly maxOutputAudioFrameBytes: number;
    readonly maxBufferedSocketBytes: number;
    readonly maxIncomingMessageBytes: number;
    readonly maxTranscriptChars: number;
    readonly maxTextDeltaChars: number;
    readonly maxFunctionArgumentsChars: number;
    readonly maxFunctionOutputChars: number;
    readonly maxPendingFunctionCalls: 8;
    readonly maxIdentifierChars: 256;
};
export declare function buildQwenRealtimeInstructions(startupContext?: string): string;
export interface QwenRealtimeConfig {
    endpoint: string;
    apiKey?: string;
    model: string;
    callEpoch: RealtimeCallEpoch;
    voice?: string;
    instructions?: string;
}
export interface QwenRealtimeDeps {
    createWebSocket?: (url: string, options: {
        headers: Record<string, string>;
        maxPayload: number;
        perMessageDeflate: false;
        handshakeTimeout: number;
    }) => SocketLike;
    abortSignal?: AbortSignal;
    connectTimeoutMs?: number;
}
export interface RealtimeEventContext {
    callEpoch: RealtimeCallEpoch;
    eventId?: string;
}
export interface RealtimeSpeechEvent extends RealtimeEventContext {
    itemId?: string;
    audioStartMs?: number;
    audioEndMs?: number;
}
export interface RealtimeInputTranscriptEvent extends RealtimeEventContext {
    itemId?: string;
    text: string;
    stash?: string;
    language?: string;
    emotion?: string;
}
export interface RealtimeResponseEvent extends RealtimeEventContext {
    responseId: string;
    inputItemId?: string;
    status?: string;
}
export type RealtimeResponseAuthority = 'direct' | 'backend_speech';
export interface RealtimeResponseCreatedEvent extends RealtimeResponseEvent {
    authority: RealtimeResponseAuthority;
}
export interface RealtimeOutputTextEvent extends RealtimeResponseEvent {
    itemId?: string;
    text: string;
    source: 'text' | 'audio_transcript';
}
export interface RealtimeOutputAudioEvent extends RealtimeResponseEvent {
    itemId?: string;
    audio: Uint8Array;
}
export interface RealtimeFunctionArgumentsEvent extends RealtimeResponseEvent {
    itemId?: string;
    callId: string;
    delta: string;
}
export interface RealtimeTranscriptEntry {
    role: 'user' | 'assistant';
    text: string;
}
export interface RealtimeDirectTranscriptEvent extends RealtimeEventContext {
    entries: readonly RealtimeTranscriptEntry[];
}
export interface RealtimeDelegateCall extends RealtimeResponseEvent {
    itemId?: string;
    callId: string;
    request: string;
    activeTranscript: readonly RealtimeTranscriptEntry[];
}
export interface RealtimeIgnoredEvent extends RealtimeEventContext {
    type: string;
    reason: 'duplicate_event' | 'stale_response' | 'stale_input' | 'stale_call' | 'cancelled_response';
}
export interface RealtimeCloseInfo {
    reason: 'client' | 'remote' | 'error';
    error?: QwenRealtimeError;
}
export interface QwenRealtimeCallbacks {
    onReady?: (event: RealtimeEventContext & {
        sessionId?: string;
    }) => void;
    onSpeechStarted?: (event: RealtimeSpeechEvent) => void;
    onSpeechStopped?: (event: RealtimeSpeechEvent) => void;
    onInputCommitted?: (event: RealtimeSpeechEvent) => void;
    onInputTranscriptDelta?: (event: RealtimeInputTranscriptEvent) => void;
    onInputTranscriptDone?: (event: RealtimeInputTranscriptEvent) => void;
    onOutputTextDelta?: (event: RealtimeOutputTextEvent) => void;
    onOutputTextDone?: (event: RealtimeOutputTextEvent) => void;
    onOutputAudioDelta?: (event: RealtimeOutputAudioEvent) => void;
    onOutputAudioDone?: (event: RealtimeResponseEvent & {
        itemId?: string;
    }) => void;
    onFunctionArgumentsDelta?: (event: RealtimeFunctionArgumentsEvent) => void;
    onDelegateCall?: (event: RealtimeDelegateCall) => void;
    onResponseCreated?: (event: RealtimeResponseCreatedEvent) => void;
    onResponseDone?: (event: RealtimeResponseEvent) => void;
    onDirectTranscript?: (event: RealtimeDirectTranscriptEvent) => void;
    onBargeIn?: (event: RealtimeResponseEvent) => void;
    onIgnoredEvent?: (event: RealtimeIgnoredEvent) => void;
    onAudioDropped?: (event: RealtimeEventContext) => void;
    onError?: (error: QwenRealtimeError) => void;
    onClose?: (info: RealtimeCloseInfo) => void;
}
export interface RealtimeHandoffReference {
    callEpoch: RealtimeCallEpoch;
    callId: string;
}
export interface RealtimeHandoffUpdate extends RealtimeHandoffReference {
    output: string;
}
export interface RealtimeCloseOptions {
    discardPendingInput?: boolean;
}
export interface QwenRealtimeSession {
    readonly callEpoch: RealtimeCallEpoch;
    readonly closed: Promise<RealtimeCloseInfo>;
    pushAudio: (pcm16: Uint8Array) => boolean;
    commitInputAudio: () => boolean;
    clearInputAudio: () => boolean;
    cancelResponse: () => boolean;
    sendHandoffUpdate: (update: RealtimeHandoffUpdate) => boolean;
    completeHandoff: (handoff: RealtimeHandoffReference) => boolean;
    sendBackendContext: (text: string) => boolean;
    speakToUser: (message: string) => boolean;
    takeTranscriptTail: () => readonly RealtimeTranscriptEntry[];
    close: (options?: RealtimeCloseOptions) => void;
}
export type QwenRealtimeErrorKind = 'configuration' | 'transient' | 'protocol';
export interface QwenRealtimeErrorOptions {
    kind?: QwenRealtimeErrorKind;
    status?: number;
    providerType?: string;
    param?: string;
    closeCode?: number;
}
export declare class QwenRealtimeError extends Error {
    readonly code?: string;
    readonly fatal: boolean;
    readonly kind: QwenRealtimeErrorKind;
    readonly status?: number;
    readonly providerType?: string;
    readonly param?: string;
    readonly closeCode?: number;
    constructor(message: string, code?: string, fatal?: boolean, options?: QwenRealtimeErrorOptions);
}
export declare function deriveQwenOmniRealtimeUrl(endpoint: string, model: string): string;
export declare function openQwenRealtimeSession(config: QwenRealtimeConfig, callbacks?: QwenRealtimeCallbacks, deps?: QwenRealtimeDeps): Promise<QwenRealtimeSession>;
