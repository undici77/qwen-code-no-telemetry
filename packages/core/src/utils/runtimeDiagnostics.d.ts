/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentParameters } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
export interface RuntimeDiagnosticsSnapshot {
    enabled: boolean;
    startedAt: string;
    requests: GenerateContentRequestDiagnostics[];
    openaiWireRequests: OpenAIWireRequestDiagnostics[];
    anthropicWireRequests: AnthropicWireRequestDiagnostics[];
    tools: RuntimeToolDiagnostics;
}
export interface GenerateContentRequestDiagnostics {
    index: number;
    timestamp: string;
    source: 'generateContent' | 'generateContentStream';
    model: string;
    stream: boolean;
    serializedBytes: number;
    contents: RuntimeContentDiagnostics;
    systemInstructionBytes: number;
    generationConfigBytes: number;
    tools: RuntimeToolSchemaDiagnostics;
}
export interface RuntimeContentDiagnostics {
    count: number;
    roleCounts: Record<string, number>;
    partCount: number;
    textBytes: number;
    functionCallCount: number;
    functionCallArgBytes: number;
    functionResponseCount: number;
    functionResponseBytes: number;
    inlineDataCount: number;
    inlineDataBytes: number;
    fileDataCount: number;
}
export interface RuntimeToolSchemaDiagnostics {
    count: number;
    functionDeclarationCount: number;
    schemaBytes: number;
}
export interface OpenAIWireRequestDiagnostics {
    index?: number;
    timestamp?: string;
    model: string;
    stream: boolean;
    bodyBytes: number;
    messageCount: number;
    messageBytesByRole: Record<string, number>;
    toolsCount: number;
    toolSchemaBytes: number;
    topLevelKeys: string[];
}
export interface AnthropicWireRequestDiagnostics {
    index?: number;
    timestamp?: string;
    model: string;
    stream: boolean;
    bodyBytes: number;
    messageCount: number;
    messageBytesByRole: Record<string, number>;
    systemBytes: number;
    toolsCount: number;
    toolSchemaBytes: number;
    topLevelKeys: string[];
}
export interface RuntimeToolDiagnostics {
    toolUseCount: number;
    toolResultCount: number;
    toolResultErrorCount: number;
    totalToolUseArgBytes: number;
    maxToolUseArgBytes: number;
    totalToolResultBytes: number;
    maxToolResultBytes: number;
    byName: Record<string, RuntimeToolNameDiagnostics>;
}
export interface RuntimeToolNameDiagnostics {
    uses: number;
    argBytes: number;
    maxArgBytes: number;
    results: number;
    errors: number;
    resultBytes: number;
    maxResultBytes: number;
}
export interface RuntimeToolResultRecord {
    name: string;
    callId: string;
    resultBytes: number;
    isError: boolean;
}
export interface RuntimeDiagnosticsCollectorOptions {
    enabled?: boolean;
    now?: () => string;
}
export declare function isRuntimeDiagnosticsEnabled(env?: NodeJS.ProcessEnv): boolean;
export declare class RuntimeDiagnosticsCollector {
    private enabled;
    private readonly now;
    private startedAt;
    private requestIndex;
    private openAIWireRequestIndex;
    private anthropicWireRequestIndex;
    private requests;
    private openaiWireRequests;
    private anthropicWireRequests;
    private tools;
    constructor(options?: RuntimeDiagnosticsCollectorOptions);
    reset(options?: {
        enabled?: boolean;
    }): void;
    isEnabled(): boolean;
    recordGenerateContentRequest(request: GenerateContentParameters, options: {
        stream: boolean;
        source: 'generateContent' | 'generateContentStream';
    }): void;
    recordOpenAIWireRequest(request: OpenAI.Chat.ChatCompletionCreateParams): void;
    recordAnthropicWireRequest(request: Anthropic.MessageCreateParamsNonStreaming | Anthropic.MessageCreateParamsStreaming): void;
    recordToolUse(name: string, args: unknown): void;
    recordToolResult(record: RuntimeToolResultRecord): void;
    snapshot(): RuntimeDiagnosticsSnapshot;
    private getToolNameDiagnostics;
}
export declare const runtimeDiagnostics: RuntimeDiagnosticsCollector;
export declare function summarizeOpenAIWireRequest(request: OpenAI.Chat.ChatCompletionCreateParams): OpenAIWireRequestDiagnostics;
export declare function summarizeAnthropicWireRequest(request: Anthropic.MessageCreateParamsNonStreaming | Anthropic.MessageCreateParamsStreaming): AnthropicWireRequestDiagnostics;
