/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Shared permission flow (L3→L4) for tool execution.
 *
 * Used by both `CoreToolScheduler` (CLI mode) and `Session` (ACP mode)
 * to ensure consistent permission evaluation.
 *
 * L3: Tool's intrinsic default permission
 * L4: PermissionManager rule override
 *
 * L5 overrides (ApprovalMode: YOLO, AUTO_EDIT, PLAN) are handled by
 * the callers because some (plan mode, AUTO_EDIT) need
 * `confirmationDetails.type` which is only available after calling
 * `invocation.getConfirmationDetails()`.
 */
import type { AnyToolInvocation, Config } from '../index.js';
import { ApprovalMode } from '../index.js';
import { buildPermissionCheckContext } from './permission-helpers.js';
import type { ToolCallConfirmationDetails } from '../tools/tools.js';
export type PermissionFlowPermission = 'allow' | 'deny' | 'ask' | 'default';
export interface PermissionFlowResult {
    /** The final permission after L3→L4 (allow | deny | ask | default) */
    finalPermission: PermissionFlowPermission;
    /** Whether PM forced 'ask' (hides "Always Allow" buttons) */
    pmForcedAsk: boolean;
    /** Deny message (only set when finalPermission === 'deny') */
    denyMessage?: string;
    /** Permission check context (needed for injectPermissionRulesIfMissing) */
    pmCtx: ReturnType<typeof buildPermissionCheckContext>;
}
/**
 * Execute the L3→L4 permission flow.
 *
 * @param config - The CLI config
 * @param invocation - The tool invocation
 * @param toolName - Name of the tool being called
 * @param toolParams - Parameters passed to the tool
 * @returns The permission decision and related metadata.
 *   `finalPermission` can be 'allow', 'deny', 'ask', or 'default'.
 *   The 'default' state is produced when the tool's default permission
 *   returns something other than the standard values (e.g. an edge case
 *   in the tool's getDefaultPermission implementation).
 */
export declare function evaluatePermissionFlow(config: Config, invocation: AnyToolInvocation, toolName: string, toolParams: Record<string, unknown>): Promise<PermissionFlowResult>;
/**
 * Check if the tool needs user confirmation based on the permission flow
 * result and the current ApprovalMode.
 *
 * This handles the YOLO mode override (L5) which doesn't require
 * confirmationDetails.
 *
 * Note: Plan mode and AUTO_EDIT mode are L5 overrides that need
 * confirmationDetails.type - callers must handle those separately.
 */
export declare function needsConfirmation(finalPermission: PermissionFlowPermission, approvalMode: ApprovalMode, toolName: string): boolean;
/**
 * Check if plan mode blocks the tool execution.
 *
 * This must be called AFTER getting confirmationDetails because it needs
 * `confirmationDetails.type`.
 */
export declare function isPlanModeBlocked(isPlanMode: boolean, isExitPlanModeTool: boolean, isAskUserQuestionTool: boolean, confirmationDetails?: ToolCallConfirmationDetails): boolean;
/**
 * Check if AUTO_EDIT mode auto-approves the tool.
 *
 * This must be called AFTER getting confirmationDetails because it needs
 * `confirmationDetails.type`.
 */
export declare function isAutoEditApproved(approvalMode: ApprovalMode, confirmationDetails?: ToolCallConfirmationDetails): boolean;
