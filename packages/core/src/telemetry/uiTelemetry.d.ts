/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import {
  EVENT_API_ERROR,
  EVENT_API_RESPONSE,
  EVENT_TOOL_CALL,
} from './constants.js';
import { ToolCallDecision } from './tool-call-decision.js';
import type {
  ApiErrorEvent,
  ApiResponseEvent,
  ToolCallEvent,
} from './types.js';
export { MAIN_SOURCE } from '../utils/subagentNameContext.js';
export type UiEvent =
  | (ApiResponseEvent & {
      'event.name': typeof EVENT_API_RESPONSE;
    })
  | (ApiErrorEvent & {
      'event.name': typeof EVENT_API_ERROR;
    })
  | (ToolCallEvent & {
      'event.name': typeof EVENT_TOOL_CALL;
    });
export {
  EVENT_API_ERROR,
  EVENT_API_RESPONSE,
  EVENT_TOOL_CALL,
} from './constants.js';
export interface ToolCallStats {
  count: number;
  success: number;
  fail: number;
  durationMs: number;
  decisions: {
    [ToolCallDecision.ACCEPT]: number;
    [ToolCallDecision.REJECT]: number;
    [ToolCallDecision.MODIFY]: number;
    [ToolCallDecision.AUTO_ACCEPT]: number;
  };
}
export interface SkillCallStats {
  count: number;
  success: number;
  fail: number;
}
export interface SkillMetrics {
  totalCalls: number;
  totalSuccess: number;
  totalFail: number;
  byName: Record<string, SkillCallStats>;
}
export interface GenerationTimingSample {
  model: string;
  ttftMs: number;
  generationDurationMs: number;
  outputTokens: number;
}
export interface GenerationMetrics {
  timedRequests: number;
  totalTtftMs: number;
  totalGenerationDurationMs: number;
  totalThroughputOutputTokens: number;
  last?: GenerationTimingSample;
}
/**
 * Per-model counters without the nested source breakdown. Used both as the
 * aggregate `ModelMetrics` shape (via extension) and as the value type of the
 * `bySource` map — keeping the type non-recursive.
 */
export interface ModelMetricsCore {
  api: {
    totalRequests: number;
    totalErrors: number;
    totalLatencyMs: number;
  };
  tokens: {
    prompt: number;
    candidates: number;
    total: number;
    cached: number;
    thoughts: number;
  };
}
export interface ModelMetrics extends ModelMetricsCore {
  /**
   * Per-source breakdown. Keys are subagent names, or `MAIN_SOURCE` ("main")
   * for calls originating from the main conversation. Every API call that
   * increments an aggregate counter also increments the matching per-source
   * record so the two views stay consistent.
   */
  bySource: Record<string, ModelMetricsCore>;
}
export interface SessionMetrics {
  models: Record<string, ModelMetrics>;
  generation?: GenerationMetrics;
  tools: {
    totalCalls: number;
    totalSuccess: number;
    totalFail: number;
    totalDurationMs: number;
    totalDecisions: {
      [ToolCallDecision.ACCEPT]: number;
      [ToolCallDecision.REJECT]: number;
      [ToolCallDecision.MODIFY]: number;
      [ToolCallDecision.AUTO_ACCEPT]: number;
    };
    byName: Record<string, ToolCallStats>;
  };
  files: {
    totalLinesAdded: number;
    totalLinesRemoved: number;
  };
  skills?: SkillMetrics;
}
export declare class UiTelemetryService extends EventEmitter {
  #private;
  addEvent(event: UiEvent, sessionId?: string): void;
  getMetrics(): SessionMetrics;
  getMetricsForSession(sessionId: string): SessionMetrics;
  recordSkillInvocation(
    skillName: string,
    success: boolean,
    sessionId?: string,
  ): void;
  getLastPromptTokenCount(): number;
  setLastPromptTokenCount(lastPromptTokenCount: number): void;
  getSessionStartTime(): Date;
  getLastCachedContentTokenCount(): number;
  setLastCachedContentTokenCount(count: number): void;
  /**
   * Resets metrics to the initial state (used when resuming a session).
   */
  reset(): void;
  resetSession(sessionId: string): void;
  removeSession(sessionId: string): void;
}
export declare const uiTelemetryService: UiTelemetryService;
