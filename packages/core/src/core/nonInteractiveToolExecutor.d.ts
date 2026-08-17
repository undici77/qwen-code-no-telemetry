/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  ToolCallRequestInfo,
  ToolCallResponseInfo,
  Config,
  RuntimeContentGeneratorView,
} from '../index.js';
import {
  type AllToolCallsCompleteHandler,
  type OutputUpdateHandler,
  type ToolCallsUpdateHandler,
} from './coreToolScheduler.js';
export interface ExecuteToolCallOptions {
  outputUpdateHandler?: OutputUpdateHandler;
  onAllToolCallsComplete?: AllToolCallsCompleteHandler;
  onToolCallsUpdate?: ToolCallsUpdateHandler;
  onToolResultFullTurnModel?: (model: string) => boolean;
  /** Direct calls record by default; aggregate callers can defer recording. */
  recordToolResult?: boolean;
  runtimeView?: RuntimeContentGeneratorView;
}
/**
 * Executes a single tool call non-interactively by leveraging the CoreToolScheduler.
 */
export declare function executeToolCall(
  config: Config,
  toolCallRequest: ToolCallRequestInfo,
  abortSignal: AbortSignal,
  options?: ExecuteToolCallOptions,
): Promise<ToolCallResponseInfo>;
