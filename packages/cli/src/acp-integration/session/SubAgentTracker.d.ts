/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AgentEventEmitter } from '@qwen-code/qwen-code-core';
import type { SessionContext } from './types.js';
import type {
  AgentSideConnection,
  RequestPermissionRequest,
  RequestPermissionResponse,
} from '@agentclientprotocol/sdk';
type PermissionRequester = (
  params: RequestPermissionRequest,
  signal: AbortSignal,
) => Promise<RequestPermissionResponse>;
/**
 * Tracks and emits events for sub-agent tool calls within AgentTool execution.
 *
 * Uses the unified ToolCallEmitter for consistency with normal flow
 * and history replay. Also handles permission requests for tools that
 * require user approval.
 */
export declare class SubAgentTracker {
  private readonly ctx;
  private readonly client;
  private readonly onPermissionCancel?;
  private readonly permissionRequester;
  private readonly toolCallEmitter;
  private readonly messageEmitter;
  private readonly subagentMeta;
  private readonly toolStates;
  constructor(
    ctx: SessionContext,
    client: AgentSideConnection,
    parentToolCallId: string,
    subagentType: string,
    onPermissionCancel?: (() => void) | undefined,
    permissionRequester?: PermissionRequester,
  );
  /**
   * Sets up event listeners for a sub-agent's tool events.
   *
   * @param eventEmitter - The AgentEventEmitter from AgentTool
   * @param abortSignal - Signal to abort tracking if parent is cancelled
   * @returns Array of cleanup functions to remove listeners
   */
  setup(
    eventEmitter: AgentEventEmitter,
    abortSignal: AbortSignal,
  ): Array<() => void>;
  /**
   * Creates a handler for tool call start events.
   */
  private createToolCallHandler;
  /**
   * Creates a handler for tool result events.
   */
  private createToolResultHandler;
  /**
   * Creates a handler for tool approval request events.
   */
  private createApprovalHandler;
  /**
   * Creates a handler for usage metadata events.
   */
  private createUsageMetadataHandler;
  /**
   * Creates a handler for stream text events.
   * Emits agent message or thought chunks for text content from subagent model responses.
   */
  private createStreamTextHandler;
}
export {};
