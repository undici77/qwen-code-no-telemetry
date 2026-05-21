/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { SessionMetrics, ModelMetrics, ModelMetricsCore } from '@qwen-code/qwen-code-core';
export declare enum ToolCallDecision {
    ACCEPT = "accept",
    REJECT = "reject",
    MODIFY = "modify",
    AUTO_ACCEPT = "auto_accept"
}
export type { SessionMetrics, ModelMetrics, ModelMetricsCore };
export interface SessionStatsState {
    sessionId: string;
    sessionStartTime: Date;
    metrics: SessionMetrics;
    lastPromptTokenCount: number;
    promptCount: number;
}
export interface ComputedSessionStats {
    totalApiTime: number;
    totalToolTime: number;
    agentActiveTime: number;
    apiTimePercent: number;
    toolTimePercent: number;
    cacheEfficiency: number;
    totalDecisions: number;
    successRate: number;
    agreementRate: number;
    totalCachedTokens: number;
    totalPromptTokens: number;
    totalLinesAdded: number;
    totalLinesRemoved: number;
}
interface SessionStatsContextValue {
    stats: SessionStatsState;
    startNewSession: (sessionId: string) => void;
    startNewPrompt: () => void;
    getPromptCount: () => number;
}
export declare const SessionStatsProvider: React.FC<{
    sessionId?: string;
    children: React.ReactNode;
}>;
export declare const useSessionStats: () => SessionStatsContextValue;
