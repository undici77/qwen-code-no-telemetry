/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Attributes, type Context, type Span } from './dummy-otel.js';
import { GenAiOutputAccumulator, type GenAiContentAttributes } from './gen-ai-content.js';
export interface GenAiExchangeOptions {
    captureContent: boolean;
    sensitiveAttributeMaxLength: number;
}
export interface GenAiAttemptHandle {
    readonly controller: GenAiExchangeController;
    readonly generation: number;
}
export interface GenAiExchange {
    context: Context;
    controller: GenAiExchangeController;
}
export declare function extractOpenAiRequestAttributes(request: object): Attributes;
export declare function extractAnthropicRequestAttributes(request: object): Attributes;
export declare function extractGeminiRequestAttributes(request: object): Attributes;
export declare class GenAiExchangeController {
    private readonly span;
    private readonly options;
    private readonly enabled;
    private requestConsumed;
    private generation;
    private finalized;
    private output;
    private responseConversionFailed;
    constructor(span: Span, options: GenAiExchangeOptions, enabled: boolean);
    beginRequest(request: object, extractRequest: (request: object) => Attributes, extractContent: (request: object) => GenAiContentAttributes): GenAiAttemptHandle | undefined;
    beginFollowingRequest(handle: GenAiAttemptHandle, request: object, extractRequest: (request: object) => Attributes, extractContent: (request: object) => GenAiContentAttributes): GenAiAttemptHandle | undefined;
    record(handle: GenAiAttemptHandle | undefined, update: (output: GenAiOutputAccumulator) => void): void;
    finalize(success: boolean): string[] | undefined;
    private assignJsonAttribute;
    private newOutput;
}
export declare function createGenAiExchange(parent: Context, span: Span, options: GenAiExchangeOptions): GenAiExchange;
/**
 * @deprecated Use createGenAiExchange so response attempts can be finalized.
 */
export declare function createGenAiRequestObserverContext(parent: Context, span: Span): Context;
export declare function reportOpenAiRequest(request: object, requestContext?: Context): GenAiAttemptHandle | undefined;
export declare function reportAnthropicRequest(request: object, requestContext?: Context): GenAiAttemptHandle | undefined;
export declare function reportAnthropicFollowingRequest(request: object, previousAttempt: GenAiAttemptHandle | undefined): GenAiAttemptHandle | undefined;
export declare function reportGeminiRequest(request: object, requestContext?: Context): GenAiAttemptHandle | undefined;
export declare function reportOpenAiResponse(handle: GenAiAttemptHandle | undefined, response: object): void;
export declare function reportOpenAiChunk(handle: GenAiAttemptHandle | undefined, chunk: object): void;
export declare function reportAnthropicResponse(handle: GenAiAttemptHandle | undefined, response: object): void;
export declare function reportAnthropicEvent(handle: GenAiAttemptHandle | undefined, event: object): void;
export declare function reportGeminiResponse(handle: GenAiAttemptHandle | undefined, response: object): void;
export declare function reportGeminiChunk(handle: GenAiAttemptHandle | undefined, chunk: object): void;
