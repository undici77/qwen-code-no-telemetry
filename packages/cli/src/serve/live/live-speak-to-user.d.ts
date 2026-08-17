/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  BaseDeclarativeTool,
  type ToolInvocation,
  type ToolResult,
} from '@qwen-code/qwen-code-core';
export declare const SPEAK_TO_USER_TOOL_NAME: 'speak_to_user';
export declare const MAX_SPEAK_TO_USER_MESSAGE_CHARS = 32000;
export interface SpeakToUserParams {
  message: string;
}
export type SpeakToUserExecutor = (message: string) => Promise<void>;
export declare class SpeakToUserTool extends BaseDeclarativeTool<
  SpeakToUserParams,
  ToolResult
> {
  private readonly speak;
  constructor(speak: SpeakToUserExecutor);
  protected createInvocation(
    params: SpeakToUserParams,
  ): ToolInvocation<SpeakToUserParams, ToolResult>;
}
