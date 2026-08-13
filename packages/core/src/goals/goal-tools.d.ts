/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolInvocation, ToolResult } from '../tools/tools.js';
import { BaseDeclarativeTool } from '../tools/tools.js';
import { type GoalRuntime } from './goal-runtime.js';
export interface GoalToolConfig {
    getGoalRuntime(): GoalRuntime;
}
export type GetGoalToolParams = Record<string, never>;
export interface UpdateGoalToolParams {
    status: 'complete' | 'blocked';
    reason: string;
    evidenceRefs: string[];
    blockerKind?: 'authority' | 'external' | 'repeated';
}
export type GoalToolResult = ToolResult;
export declare class GetGoalTool extends BaseDeclarativeTool<GetGoalToolParams, GoalToolResult> {
    private readonly config;
    static readonly Name: "get_goal";
    constructor(config: GoalToolConfig);
    protected createInvocation(params: GetGoalToolParams): ToolInvocation<GetGoalToolParams, GoalToolResult>;
}
export declare class UpdateGoalTool extends BaseDeclarativeTool<UpdateGoalToolParams, GoalToolResult> {
    private readonly config;
    static readonly Name: "update_goal";
    constructor(config: GoalToolConfig);
    protected validateToolParamValues(params: UpdateGoalToolParams): string | null;
    protected createInvocation(params: UpdateGoalToolParams): ToolInvocation<UpdateGoalToolParams, GoalToolResult>;
}
