/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
/**
 * Parameters for the WebFetch tool
 */
export interface WebFetchToolParams {
    /**
     * The URL to fetch content from
     */
    url: string;
    /**
     * The prompt to run on the fetched content
     */
    prompt: string;
    /**
     * Preferred content format (controls only the Accept header)
     * All content is normalized to plain text for LLM processing
     * - auto: Prefers markdown via content negotiation (default)
     * - markdown: Request markdown format only
     * - html: Request HTML format only (still converted to text)
     * - text: Request plain text format
     */
    format?: 'auto' | 'markdown' | 'html' | 'text';
}
/**
 * Implementation of the WebFetch tool logic
 */
export declare class WebFetchTool extends BaseDeclarativeTool<WebFetchToolParams, ToolResult> {
    private readonly config;
    static readonly Name: string;
    constructor(config: Config);
    protected validateToolParamValues(params: WebFetchToolParams): string | null;
    protected createInvocation(params: WebFetchToolParams): ToolInvocation<WebFetchToolParams, ToolResult>;
    toAutoClassifierInput(params: WebFetchToolParams): Record<string, unknown>;
}
