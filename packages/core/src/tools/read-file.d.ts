/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
import type { Config } from '../config/config.js';
/**
 * Parameters for the ReadFile tool
 */
export interface ReadFileToolParams {
    /**
     * The absolute path to the file to read
     */
    file_path: string;
    /**
     * The line number to start reading from (optional)
     */
    offset?: number;
    /**
     * The number of lines to read (optional)
     */
    limit?: number;
    /**
     * For PDF files, the page range to extract as text (e.g. "1-5", "3", "10-20").
     * Pages are 1-indexed. Open-ended ranges like "3-" are not supported.
     */
    pages?: string;
}
/**
 * Implementation of the ReadFile tool logic
 */
export declare class ReadFileTool extends BaseDeclarativeTool<ReadFileToolParams, ToolResult> {
    private config;
    static readonly Name: string;
    get maxOutputChars(): number;
    constructor(config: Config);
    protected validateToolParamValues(params: ReadFileToolParams): string | null;
    protected createInvocation(params: ReadFileToolParams): ToolInvocation<ReadFileToolParams, ToolResult>;
}
