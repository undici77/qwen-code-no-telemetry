/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolResult } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { Config } from '../config/config.js';
export interface EnterWorktreeParams {
    /**
     * Optional name (slug) for the worktree. Allowed characters:
     * letters, digits, dot, underscore, hyphen. Maximum 64 characters.
     * If omitted, an auto-generated `{adj}-{noun}-{4hex}` slug is used.
     */
    name?: string;
}
declare class EnterWorktreeInvocation extends BaseToolInvocation<EnterWorktreeParams, ToolResult> {
    private readonly config;
    constructor(config: Config, params: EnterWorktreeParams);
    getDescription(): string;
    execute(_signal: AbortSignal): Promise<ToolResult>;
}
export declare class EnterWorktreeTool extends BaseDeclarativeTool<EnterWorktreeParams, ToolResult> {
    private readonly config;
    static readonly Name: string;
    constructor(config: Config);
    validateToolParams(params: EnterWorktreeParams): string | null;
    protected createInvocation(params: EnterWorktreeParams): EnterWorktreeInvocation;
}
export {};
