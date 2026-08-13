/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PartListUnion } from '@google/genai';
import type { Config } from '@qwen-code/qwen-code-core';
import type { HistoryItemWithoutId, IndividualToolCallDisplay } from '../types.js';
export interface ResolveAtCommandParams {
    query: string;
    config: Config;
    onDebugMessage: (message: string) => void;
    messageId: number;
    signal: AbortSignal;
}
interface HandleAtCommandParams extends ResolveAtCommandParams {
    addItem?: (item: HistoryItemWithoutId, baseTimestamp: number) => number;
}
export interface HandleAtCommandResult {
    processedQuery: PartListUnion | null;
    shouldProceed: boolean;
    toolDisplays?: IndividualToolCallDisplay[];
    filesRead?: string[];
}
export interface AtCommandRecording {
    filesRead: string[];
    status: 'success' | 'error';
    message?: string;
}
export interface ResolveAtCommandResult extends HandleAtCommandResult {
    recording?: AtCommandRecording;
}
export declare function extractAtPathCommands(query: string): string[];
/**
 * Processes user input potentially containing one or more '@<path>' commands.
 * If found, it attempts to read the specified files/directories using the
 * 'read_many_files' tool, and any `@server:uri` MCP resource references via
 * the MCP server. The user query is modified to include resolved paths, and
 * the content of the files/resources is appended in a structured block.
 *
 * @returns An object indicating whether the main hook should proceed with an
 *          LLM call and the processed query parts (including file content).
 */
export declare function resolveAtCommandQuery({ query, config, onDebugMessage, messageId: userMessageTimestamp, signal, }: ResolveAtCommandParams): Promise<ResolveAtCommandResult>;
export declare function handleAtCommand(params: HandleAtCommandParams): Promise<HandleAtCommandResult>;
export {};
