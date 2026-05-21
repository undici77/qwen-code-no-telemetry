/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PartListUnion } from '@google/genai';
import type { Config } from '@qwen-code/qwen-code-core';
import type { HistoryItemWithoutId, IndividualToolCallDisplay } from '../types.js';
interface HandleAtCommandParams {
    query: string;
    config: Config;
    onDebugMessage: (message: string) => void;
    messageId: number;
    signal: AbortSignal;
    addItem?: (item: HistoryItemWithoutId, baseTimestamp: number) => number;
}
interface HandleAtCommandResult {
    processedQuery: PartListUnion | null;
    shouldProceed: boolean;
    toolDisplays?: IndividualToolCallDisplay[];
    filesRead?: string[];
}
/**
 * Processes user input potentially containing one or more '@<path>' commands.
 * If found, it attempts to read the specified files/directories using the
 * 'read_many_files' tool. The user query is modified to include resolved paths,
 * and the content of the files is appended in a structured block.
 *
 * @returns An object indicating whether the main hook should proceed with an
 *          LLM call and the processed query parts (including file content).
 */
export declare function handleAtCommand({ query, config, onDebugMessage, messageId: userMessageTimestamp, signal, addItem, }: HandleAtCommandParams): Promise<HandleAtCommandResult>;
export {};
