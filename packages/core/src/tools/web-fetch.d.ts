/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
export declare function sideQueryTimeoutMs(): number;
export declare function clearWebFetchCache(): void;
/**
 * GitHub blob pages are HTML wrappers; the raw host serves the file itself.
 * This rewrite is applied at invocation-BUILD time (not fetch time) so that
 * permission rules, the confirmation dialog, preapproval, and the network
 * request all see the same destination host — an ask/deny rule for
 * raw.githubusercontent.com must match the request that actually goes there.
 * Matching is on the parsed hostname (github.com, or its www form) and an
 * /owner/repo/blob/... path shape: a lookalike host merely containing
 * "github.com" as a substring, or "github.com"/"/blob/" appearing in the
 * path or query of an unrelated URL, must never trigger the rewrite.
 */
export declare function rewriteGitHubBlobUrl(url: string): string;
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
     * - markdown: Prefer markdown format
     * - html: Prefer HTML format (still converted to text)
     * - text: Prefer plain text format
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
