/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const PLAN_MODE_ENTRY_SIBLING_SKIP_MESSAGE =
  'Tool call skipped because enter_plan_mode is an execution boundary. Retry it in the next model turn after observing the resulting approval mode.';
export declare function getPlanModeLifecyclePrefix(
  toolName: string | undefined,
  output: string,
): string | undefined;
export declare function findPlanModeEntryBatchBoundaryIndex(
  toolNames: ReadonlyArray<string | undefined>,
): number | undefined;
