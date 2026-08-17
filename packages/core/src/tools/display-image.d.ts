/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import {
  BaseDeclarativeTool,
  type ToolInvocation,
  type ToolResult,
} from './tools.js';
export interface DisplayImageToolParams {
  file_path: string;
}
export declare class DisplayImageTool extends BaseDeclarativeTool<
  DisplayImageToolParams,
  ToolResult
> {
  private readonly config;
  static readonly Name: 'display_image';
  constructor(config: Config);
  protected validateToolParamValues(
    params: DisplayImageToolParams,
  ): string | null;
  protected createInvocation(
    params: DisplayImageToolParams,
  ): ToolInvocation<DisplayImageToolParams, ToolResult>;
}
