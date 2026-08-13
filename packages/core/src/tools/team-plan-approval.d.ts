/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { BaseDeclarativeTool, type ToolInvocation, type ToolResult } from './tools.js';
export interface TeamPlanApprovalParams {
    request_id: string;
    action: 'approve' | 'reject';
    message?: string;
}
export declare class TeamPlanApprovalTool extends BaseDeclarativeTool<TeamPlanApprovalParams, ToolResult> {
    private readonly config;
    static readonly Name: "team_plan_approval";
    constructor(config: Config);
    validateToolParams(params: TeamPlanApprovalParams): string | null;
    protected createInvocation(params: TeamPlanApprovalParams): ToolInvocation<TeamPlanApprovalParams, ToolResult>;
}
