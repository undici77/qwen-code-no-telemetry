/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type IncomingHttpHeaders } from 'node:http';
type JsonObject = Record<string, unknown>;
export type FakeOpenAIToolCall = {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
};
export type FakeOpenAIResponse = {
    model?: string;
    content?: string;
    contentChunks?: string[];
    disconnectAfterContentChunks?: number;
    toolCalls?: FakeOpenAIToolCall[];
    finishReason?: 'stop' | 'tool_calls' | 'length';
    choices?: FakeOpenAIChoice[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        prompt_tokens_details?: {
            cached_tokens?: number;
        };
    };
};
export type FakeOpenAIChoice = {
    index: number;
    content?: string;
    contentChunks?: string[];
    toolCalls?: FakeOpenAIToolCall[];
    finishReason?: 'stop' | 'tool_calls' | 'length';
};
export type FakeOpenAIRequest = {
    body: JsonObject;
    headers: IncomingHttpHeaders;
};
export type FakeOpenAIServer = {
    baseUrl: string;
    requests: FakeOpenAIRequest[];
    close: () => Promise<void>;
};
export type FakeOpenAIServerOptions = ({
    listenHost?: undefined;
    baseUrlHost?: undefined;
} | {
    listenHost: string;
    baseUrlHost: string;
}) & {
    keepAlive?: boolean;
};
export type FakeOpenAIHandler = (ctx: {
    body: JsonObject;
    requestIndex: number;
}) => FakeOpenAIResponse | Promise<FakeOpenAIResponse>;
export declare function fakeToolCall(name: string, args: JsonObject, id?: string): FakeOpenAIToolCall;
export declare function startFakeOpenAIServer(handler: FakeOpenAIHandler, options?: FakeOpenAIServerOptions): Promise<FakeOpenAIServer>;
export {};
