/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolCallConfirmationDetails, ToolResult } from './tools.js';
import type { PermissionDecision } from '../permissions/types.js';
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { Config } from '../config/config.js';
export interface ExitPlanModeParams {
  plan: string;
  originalRequest?: string;
  researchSummary?: string;
  /** @deprecated Plan approval no longer uses an LLM review gate. */
  resolutionSummary?: string;
}
/**
 * `llmContent` prefixes that mark a successful plan-mode exit (user or
 * leader approval). The tool scheduler keys its post-execution history
 * sanitization (#6237) off these, so they must stay in lockstep with the
 * success returns in `ExitPlanModeToolInvocation.execute` /
 * `executePlanRequiredTeammate` below.
 */
export declare const PLAN_EXIT_APPROVED_LLM_CONTENT_PREFIXES: readonly [
  'User approved.',
  'Leader approved.',
];
declare class ExitPlanModeToolInvocation extends BaseToolInvocation<
  ExitPlanModeParams,
  ToolResult
> {
  private readonly config;
  private approval?;
  constructor(config: Config, params: ExitPlanModeParams);
  getDescription(): string;
  requiresUserInteraction(): boolean;
  getDefaultPermission(): Promise<PermissionDecision>;
  getConfirmationDetails(
    abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails>;
  execute(signal: AbortSignal): Promise<ToolResult>;
  private executePlanRequiredTeammate;
  private outsidePlanGuidanceMessage;
  private savePlanBestEffort;
  private errorResult;
  private noActionResult;
}
export declare class ExitPlanModeTool extends BaseDeclarativeTool<
  ExitPlanModeParams,
  ToolResult
> {
  private readonly config;
  static readonly Name: string;
  constructor(config: Config);
  validateToolParams(params: ExitPlanModeParams): string | null;
  protected createInvocation(
    params: ExitPlanModeParams,
  ): ExitPlanModeToolInvocation;
}
export {};
