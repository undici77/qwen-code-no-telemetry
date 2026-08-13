/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { BaseDeclarativeTool, type ToolInvocation, type ToolResult } from './tools.js';
export type ListAgentsParams = Record<string, never>;
export declare class ListAgentsTool extends BaseDeclarativeTool<ListAgentsParams, ToolResult> {
    private readonly config;
    static readonly Name: "list_agents";
    constructor(config: Config);
    protected createInvocation(params: ListAgentsParams): ToolInvocation<ListAgentsParams, ToolResult>;
}
