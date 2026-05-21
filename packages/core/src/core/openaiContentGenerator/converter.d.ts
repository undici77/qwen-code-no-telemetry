/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentParameters, ToolListUnion } from '@google/genai';
import { GenerateContentResponse } from '@google/genai';
import type OpenAI from 'openai';
import type { RequestContext } from './types.js';
import { type SchemaComplianceMode } from '../../utils/schemaConverter.js';
export interface ExtendedChatCompletionAssistantMessageParam extends OpenAI.Chat.ChatCompletionAssistantMessageParam {
    reasoning_content?: string | null;
}
export interface ExtendedCompletionMessage extends OpenAI.Chat.ChatCompletionMessage {
    reasoning_content?: string | null;
    reasoning?: string | null;
}
export interface ExtendedCompletionChunkDelta extends OpenAI.Chat.ChatCompletionChunk.Choice.Delta {
    reasoning_content?: string | null;
    reasoning?: string | null;
}
/**
 * Tool call accumulator for streaming responses
 */
export interface ToolCallAccumulator {
    id?: string;
    name?: string;
    arguments: string;
}
/**
 * Convert Gemini tool parameters to OpenAI JSON Schema format.
 */
export declare function convertGeminiToolParametersToOpenAI(parameters: Record<string, unknown>): Record<string, unknown> | undefined;
/**
 * Convert Gemini tools to OpenAI format for API compatibility.
 * Handles both Gemini tools (using 'parameters' field) and MCP tools
 * (using 'parametersJsonSchema' field).
 */
export declare function convertGeminiToolsToOpenAI(geminiTools: ToolListUnion, schemaCompliance?: SchemaComplianceMode): Promise<OpenAI.Chat.ChatCompletionTool[]>;
/**
 * Convert Gemini request to OpenAI message format.
 */
export declare function convertGeminiRequestToOpenAI(request: GenerateContentParameters, requestContext: RequestContext, options?: {
    cleanOrphanToolCalls: boolean;
}): OpenAI.Chat.ChatCompletionMessageParam[];
/**
 * Convert Gemini response to OpenAI completion format (for logging).
 */
export declare function convertGeminiResponseToOpenAI(response: GenerateContentResponse, requestContext: RequestContext): OpenAI.Chat.ChatCompletion;
/**
 * Convert OpenAI response to Gemini format.
 */
export declare function convertOpenAIResponseToGemini(openaiResponse: OpenAI.Chat.ChatCompletion, requestContext: RequestContext): GenerateContentResponse;
/**
 * Convert OpenAI stream chunk to Gemini format.
 *
 * `requestContext.toolCallParser` carries the tool-call parser for this
 * stream. Callers MUST attach a fresh parser at stream start and pass the
 * same instance for every chunk of that stream. Concurrent streams MUST use
 * distinct parsers or their tool-call buffers will interleave (issue #3516).
 */
export declare function convertOpenAIChunkToGemini(chunk: OpenAI.Chat.ChatCompletionChunk, requestContext: RequestContext): GenerateContentResponse;
export declare const OpenAIContentConverter: {
    convertGeminiToolParametersToOpenAI: typeof convertGeminiToolParametersToOpenAI;
    convertGeminiToolsToOpenAI: typeof convertGeminiToolsToOpenAI;
    convertGeminiRequestToOpenAI: typeof convertGeminiRequestToOpenAI;
    convertGeminiResponseToOpenAI: typeof convertGeminiResponseToOpenAI;
    convertOpenAIResponseToGemini: typeof convertOpenAIResponseToGemini;
    convertOpenAIChunkToGemini: typeof convertOpenAIChunkToGemini;
};
