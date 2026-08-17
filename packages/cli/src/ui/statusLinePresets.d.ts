/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ReasoningEffort } from '@qwen-code/qwen-code-core';
import { StreamingState } from './types.js';
export declare const STATUS_LINE_PRESET_ITEM_IDS: readonly [
  'project-name',
  'git-branch',
  'model-with-reasoning',
  'model',
  'context-remaining',
  'total-input-tokens',
  'total-output-tokens',
  'current-dir',
  'pull-request-number',
  'branch-changes',
  'context-used',
  'run-state',
  'qwen-version',
  'context-window-size',
  'used-tokens',
  'session-id',
];
export type StatusLinePresetItemId =
  (typeof STATUS_LINE_PRESET_ITEM_IDS)[number];
export interface StatusLinePresetItem {
  id: StatusLinePresetItemId;
  label: string;
  description: string;
  defaultSelected?: boolean;
}
export interface StatusLinePresetConfig {
  type: 'preset';
  items: StatusLinePresetItemId[];
  useThemeColors?: boolean;
  hideContextIndicator?: boolean;
}
export type StatusLinePresetReasoning =
  | false
  | {
      effort?: ReasoningEffort;
    }
  | undefined;
export interface StatusLinePresetData {
  sessionId: string;
  version: string;
  modelDisplayName: string;
  reasoning: StatusLinePresetReasoning;
  currentDir: string;
  projectName: string | undefined;
  branch: string | undefined;
  pullRequestNumber: string | undefined;
  contextWindowSize: number;
  usedPercentage: number;
  remainingPercentage: number;
  currentUsage: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  streamingState: StreamingState;
}
export declare function aggregateModelTokens(metrics: {
  models: Record<
    string,
    {
      tokens: {
        prompt: number;
        candidates: number;
      };
    }
  >;
}): {
  totalInputTokens: number;
  totalOutputTokens: number;
};
export declare const STATUS_LINE_PRESET_ITEMS: readonly StatusLinePresetItem[];
export declare function orderStatusLinePresetItems(
  items: readonly unknown[],
): StatusLinePresetItemId[];
export declare const DEFAULT_STATUS_LINE_PRESET_CONFIG: StatusLinePresetConfig;
export declare function normalizeStatusLinePresetConfig(
  raw: unknown,
): StatusLinePresetConfig | undefined;
export declare function formatTokenCount(value: number): string;
export declare function getRunStateLabel(state: StreamingState): string;
export declare function formatModelWithReasoning(
  modelDisplayName: string,
  reasoning: StatusLinePresetReasoning,
): string;
export declare function inferPullRequestNumber(
  branch: string | undefined,
): string | undefined;
export declare function buildStatusLinePresetData(params: {
  sessionId: string;
  version: string | undefined;
  modelDisplayName: string | undefined;
  reasoning?: StatusLinePresetReasoning;
  currentDir: string;
  branch: string | undefined;
  pullRequestNumber?: string | undefined;
  contextWindowSize: number;
  currentUsage: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  streamingState: StreamingState;
}): StatusLinePresetData;
export declare function buildStatusLinePresetParts(
  config: StatusLinePresetConfig,
  data: StatusLinePresetData,
): string[];
export declare function buildStatusLinePresetLines(
  config: StatusLinePresetConfig,
  data: StatusLinePresetData,
): string[];
