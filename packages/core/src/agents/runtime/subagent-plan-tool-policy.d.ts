/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolResult } from '../../tools/tools.js';
import type { Config } from '../../config/config.js';
export declare const SUBAGENT_PLAN_LIFECYCLE_TOOLS: ReadonlySet<string>;
export declare const READ_ONLY_INSPECTION_TOOLS: readonly string[];
export declare function isSubagentLikeExecutionContext(): boolean;
export declare function isPlanRequiredTeammateContext(): boolean;
export declare function isPlanRequiredTeammateAwaitingApproval(
  config: Config,
): boolean;
export declare function isPlanLifecycleToolUnavailableInSubagent(
  toolName: string,
): boolean;
export declare function shouldUsePlanOnlyReminderInSubagentContext(): boolean;
export declare function isLeaderOnlyToolUnavailableInSubagent(
  toolName: string,
): boolean;
export declare function getLeaderOnlyToolUnavailableMessage(
  toolName: string,
): string;
export declare function getPlanRequiredTeammatePreApprovalMessage(
  toolName: string,
): string;
export declare function isPlanRequiredTeammatePreApprovalAllowedTool(
  toolName: string,
  params: unknown,
): boolean;
export declare function getSubagentPlanToolUnavailableMessage(
  toolName: string,
): string;
export declare function buildSubagentPlanToolBlockedResult(
  toolName: string,
  logTag: string,
  logger: {
    warn(message: string): void;
  },
): ToolResult;
