/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AnyMessage, Stream } from '@agentclientprotocol/sdk';
export interface NdJsonMessageObservation {
    direction: 'sent' | 'received';
    bytes: number;
    message: AnyMessage;
}
export interface NdJsonStreamHooks {
    onMessageReceived?: (bytes: number) => void;
    onMessageSent?: (bytes: number) => void;
    onMessageObserved?: (observation: NdJsonMessageObservation) => void;
    onTransportError?: (error: unknown) => void;
}
export interface NdJsonStreamLimits {
    maxFrameBytes: number;
    maxQueuedMessages: number;
    maxQueuedBytes: number;
}
export type NdJsonInboundMessageValidator = (message: AnyMessage) => boolean;
export declare class NdJsonFrameTooLargeError extends Error {
    readonly direction: 'sent' | 'received';
    readonly limitBytes: number;
    readonly observedBytes: number;
    readonly code = "ndjson_frame_too_large";
    constructor(direction: 'sent' | 'received', limitBytes: number, observedBytes: number);
}
export declare class NdJsonQueueLimitError extends Error {
    readonly maxQueuedMessages: number;
    readonly maxQueuedBytes: number;
    readonly requiredBytes: number;
    readonly availableBytes: number;
    readonly code = "ndjson_queue_limit_exceeded";
    constructor(maxQueuedMessages: number, maxQueuedBytes: number, requiredBytes: number, availableBytes: number);
}
export declare class NdJsonIncompleteFrameError extends Error {
    readonly observedBytes: number;
    readonly code = "ndjson_incomplete_frame";
    constructor(observedBytes: number);
}
export declare class NdJsonUnexpectedEofError extends Error {
    readonly code = "ndjson_unexpected_eof";
    constructor();
}
export declare class NdJsonInvalidMessageError extends Error {
    readonly code: 'ndjson_parse_error' | 'ndjson_invalid_message';
    readonly observedBytes: number;
    constructor(code: 'ndjson_parse_error' | 'ndjson_invalid_message', observedBytes: number);
}
export declare function ndJsonStream(output: WritableStream<Uint8Array>, input: ReadableStream<Uint8Array>, hooks?: NdJsonStreamHooks, limits?: NdJsonStreamLimits, validateInboundMessage?: NdJsonInboundMessageValidator, fatalCleanEof?: boolean): Stream;
export declare function validateNdJsonStreamLimits(limits: NdJsonStreamLimits): void;
