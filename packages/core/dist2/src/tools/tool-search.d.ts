/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * ToolSearch — discovery tool for on-demand loading of deferred tool schemas.
 *
 * Only a curated set of core tools are included in the initial
 * function-declaration list sent to the model; tools marked `shouldDefer=true`
 * (MCP tools, low-frequency built-ins) are hidden to keep the system prompt
 * small. The model uses this tool to look up those hidden tools by keyword or
 * exact name, which loads their full schemas into the next API request.
 *
 * Two query modes:
 *   - `select:Name1,Name2` — exact lookup by tool name
 *   - free-text keywords — fuzzy match with scoring across name, description,
 *     and optional `searchHint`. MCP tools get a slight score boost since
 *     they are always deferred and thus always benefit from surfacing.
 */
import type { AnyDeclarativeTool, ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
import type { Config } from '../config/config.js';
export interface ToolSearchParams {
    query: string;
    max_results?: number;
}
export declare class ToolSearchTool extends BaseDeclarativeTool<ToolSearchParams, ToolResult> {
    private readonly config;
    static readonly Name: "tool_search";
    constructor(config: Config);
    protected createInvocation(params: ToolSearchParams): ToolInvocation<ToolSearchParams, ToolResult>;
}
export declare function tokenize(query: string): string[];
/**
 * Score a tool against the search terms. Returns 0 if no signal matched; the
 * caller filters by `> 0`.
 */
export declare function scoreTool(tool: AnyDeclarativeTool, terms: string[]): number;
