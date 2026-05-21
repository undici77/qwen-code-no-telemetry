/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { StreamingState } from './types.js';
export declare const STATUS_LINE_PRESET_ITEM_IDS: readonly ["model-with-reasoning", "context-remaining", "current-dir", "context-used", "git-branch", "model", "project-name", "pull-request-number", "branch-changes", "run-state", "qwen-version", "context-window-size", "used-tokens", "total-input-tokens", "total-output-tokens", "session-id"];
export type StatusLinePresetItemId = (typeof STATUS_LINE_PRESET_ITEM_IDS)[number];
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
}
export interface StatusLinePresetData {
    sessionId: string;
    version: string;
    modelDisplayName: string;
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
    models: Record<string, {
        tokens: {
            prompt: number;
            candidates: number;
        };
    }>;
}): {
    totalInputTokens: number;
    totalOutputTokens: number;
};
export declare const STATUS_LINE_PRESET_ITEMS: readonly StatusLinePresetItem[];
export declare const DEFAULT_STATUS_LINE_PRESET_CONFIG: StatusLinePresetConfig;
export declare function normalizeStatusLinePresetConfig(raw: unknown): StatusLinePresetConfig | undefined;
export declare function formatTokenCount(value: number): string;
export declare function getRunStateLabel(state: StreamingState): string;
export declare function inferPullRequestNumber(branch: string | undefined): string | undefined;
export declare function buildStatusLinePresetData(params: {
    sessionId: string;
    version: string | undefined;
    modelDisplayName: string | undefined;
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
export declare function buildStatusLinePresetParts(config: StatusLinePresetConfig, data: StatusLinePresetData): string[];
export declare function buildStatusLinePresetLines(config: StatusLinePresetConfig, data: StatusLinePresetData): string[];
