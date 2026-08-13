/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
export interface ZoomImageParams {
    file_path: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
export declare class ZoomImageTool extends BaseDeclarativeTool<ZoomImageParams, ToolResult> {
    private readonly config;
    static readonly Name: "zoom_image";
    constructor(config: Config);
    protected validateToolParamValues(params: ZoomImageParams): string | null;
    protected createInvocation(params: ZoomImageParams): ToolInvocation<ZoomImageParams, ToolResult>;
}
