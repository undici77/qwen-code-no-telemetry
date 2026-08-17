/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Permission Controller
 *
 * Handles permission-related control requests:
 * - can_use_tool: Check if tool usage is allowed
 * - set_permission_mode: Change permission mode at runtime
 *
 * Abstracts all permission logic from the session manager to keep it clean.
 */
import type {
  TeammateApprovalRequestEvent,
  WorkflowApproval,
} from '@qwen-code/qwen-code-core';
import type {
  ControlRequestPayload,
  PermissionSuggestion,
} from '../../types.js';
import { BaseController } from './baseController.js';
export declare class PermissionController extends BaseController {
  private pendingOutgoingRequests;
  /**
   * Handle permission control requests
   */
  protected handleRequestPayload(
    payload: ControlRequestPayload,
    signal: AbortSignal,
  ): Promise<Record<string, unknown>>;
  /**
   * Handle can_use_tool request
   *
   * Comprehensive permission evaluation based on:
   * - Permission mode (approval level)
   * - Tool registry validation
   * - Error handling with safe defaults
   */
  private handleCanUseTool;
  /**
   * Check permission mode for tool execution
   */
  private checkPermissionMode;
  /**
   * Check if tool exists in registry
   */
  private checkToolRegistry;
  /**
   * Handle set_permission_mode request
   *
   * Updates the permission mode in the context
   */
  private handleSetPermissionMode;
  /**
   * Build permission suggestions for tool confirmation UI
   *
   * This method creates UI suggestions based on tool confirmation details,
   * helping the host application present appropriate permission options.
   */
  buildPermissionSuggestions(
    confirmationDetails: unknown,
  ): PermissionSuggestion[] | null;
  /**
   * Get callback for monitoring tool calls and handling outgoing permission requests
   * This is passed to executeToolCall to hook into CoreToolScheduler updates
   */
  getToolCallUpdateCallback(): (toolCalls: unknown[]) => void;
  /**
   * Build the confirmation payload for an approved (`allow`) tool call.
   *
   * `updatedInput` carries the (possibly sanitised) tool args the host
   * wants executed. For `ask_user_question` the host also delivers the
   * user's answers on this channel as `updatedInput.answers`; those
   * answers must reach the tool via `payload.answers` (the tool reads
   * them from there, not from its args). Answers are promoted only for
   * `ask_user_question`, so a same-named `answers` field on any other
   * tool's input can never leak into the confirmation payload.
   *
   * Returns `undefined` when the host sent no usable `updatedInput`, so
   * callers fall back to a plain single-argument confirmation.
   */
  private buildAllowConfirmationPayload;
  /**
   * Handle a teammate tool approval request routed via the
   * TEAMMATE_APPROVAL_REQUEST team event. Stream-json only —
   * non-stream-json sessions handle teammate approvals directly
   * in `nonInteractiveCli.ts` (mode-aware fallback that warns on
   * stderr and cancels). The caller in nonInteractiveCli only
   * forwards events here when `options.controlService` is set,
   * which is itself stream-json-only. Defensive guard remains
   * in case that contract is ever broken.
   */
  handleTeammateApproval(event: TeammateApprovalRequestEvent): Promise<void>;
  handleWorkflowApproval(
    runId: string,
    approval: WorkflowApproval,
    rawArgs: Record<string, unknown>,
    approvalSignal: AbortSignal,
  ): Promise<void>;
  /**
   * Handle outgoing permission request
   *
   * Behavior depends on input format:
   * - stream-json mode: Send can_use_tool to SDK and await response
   * - Other modes: Check local approval mode and decide immediately
   */
  private handleOutgoingPermissionRequest;
}
