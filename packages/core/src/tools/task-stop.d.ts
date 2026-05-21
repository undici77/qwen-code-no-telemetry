/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview TaskStop tool — lets the model stop a background task.
 */
import type { Config } from '../config/config.js';
import { BaseDeclarativeTool, type ToolInvocation, type ToolResult } from './tools.js';
export interface TaskStopParams {
    /** The ID of the background task to stop. */
    task_id: string;
}
export declare class TaskStopTool extends BaseDeclarativeTool<TaskStopParams, ToolResult> {
    private readonly config;
    static readonly Name: "task_stop";
    constructor(config: Config);
    protected createInvocation(params: TaskStopParams): ToolInvocation<TaskStopParams, ToolResult>;
}
