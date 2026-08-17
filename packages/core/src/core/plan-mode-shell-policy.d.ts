/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { PermissionCheckContext } from '../permissions/types.js';
import type {
  ToolCallConfirmationDetails,
  ToolConfirmationPayload,
} from '../tools/tools.js';
import { ToolConfirmationOutcome } from '../tools/tools.js';
import { type ShellCommandSafety } from '../utils/shellAstParser.js';
declare const WRITE_BLOCK_MESSAGE =
  'Plan mode blocked this shell command because it was classified as state-modifying. Do not retry it through wrappers or obfuscation; continue read-only investigation and include the action in the plan.';
declare const NO_APPROVAL_MESSAGE =
  'Plan mode could not determine whether this shell command is read-only, and no approval surface is available. The command was not run; Plan mode remains active.';
interface PlanModeShellContextSnapshot {
  requestArgs: Record<string, unknown>;
  invocationParams: Record<string, unknown>;
  approvalModeRevision: number;
  permissionContext: PermissionCheckContext;
  ambientWorkingDirectory?: string;
}
type ApplicablePlanModeShellDecision = {
  classification: ShellCommandSafety;
  rawCommand: string;
  snapshot: PlanModeShellContextSnapshot;
  writeBlockMessage: typeof WRITE_BLOCK_MESSAGE;
  noApprovalMessage: typeof NO_APPROVAL_MESSAGE;
};
/** @internal */
export type PlanModeShellDecision =
  | {
      classification: 'not-applicable';
    }
  | ApplicablePlanModeShellDecision;
/** @internal */
export declare function evaluatePlanModeShellPolicy(input: {
  config: Config;
  toolName: string;
  requestArgs: Record<string, unknown>;
  invocationParams: Record<string, unknown>;
  permissionContext: PermissionCheckContext;
  ambientWorkingDirectory?: string;
  signal: AbortSignal;
}): Promise<PlanModeShellDecision>;
/** @internal */
export declare function validatePlanModeShellContext(input: {
  config: Config;
  decision: PlanModeShellDecision;
  requestArgs: Record<string, unknown>;
  invocationParams: Record<string, unknown>;
  signal: AbortSignal;
}): Promise<string | undefined>;
/** @internal */
export declare function decoratePlanModeShellConfirmation(
  decision: PlanModeShellDecision,
  confirmation: ToolCallConfirmationDetails,
): ToolCallConfirmationDetails;
/** @internal */
export declare function validatePlanModeShellApproval(input: {
  config: Config;
  decision: PlanModeShellDecision;
  requestArgs: Record<string, unknown>;
  invocationParams: Record<string, unknown>;
  signal: AbortSignal;
  outcome: ToolConfirmationOutcome;
  payload?: ToolConfirmationPayload;
}): Promise<{
  outcome: ToolConfirmationOutcome;
  payload?: ToolConfirmationPayload;
}>;
export {};
