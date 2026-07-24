/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';

// No-op implementations for no-telemetry policy
// All metric recording functions are replaced with empty stubs

export const SUBAGENT_EXECUTION_COUNT = 'qwen.subagent.execution.count';

// Arena Metrics (no-op for no-telemetry)
export const ARENA_SESSION_COUNT = 'qwen-code.arena.session.count';
export const ARENA_SESSION_DURATION = 'qwen-code.arena.session.duration';
export const ARENA_AGENT_COUNT = 'qwen-code.arena.agent.count';
export const ARENA_AGENT_DURATION = 'qwen-code.arena.agent.duration';
export const ARENA_AGENT_TOKENS = 'qwen-code.arena.agent.tokens';
export const ARENA_RESULT_SELECTED = 'qwen-code.arena.result.selected';


export type MetricDefinitions = {
  [key: string]: {
    attributes: Record<string, unknown>;
  };
};

export enum FileOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum MemoryMetricType {
  RSS = 'rss',
  HEAP_TOTAL = 'heapTotal',
  HEAP_USED = 'heapUsed',
  EXTERNAL = 'external',
}

export enum ToolExecutionPhase {
  SETUP = 'setup',
  EXECUTION = 'execution',
  TEARDOWN = 'teardown',
  VALIDATION = 'validation',
  PREPARATION = 'preparation',
  RESULT_PROCESSING = 'result_processing',
}

export enum ApiRequestPhase {
  REQUEST = 'request',
  RESPONSE = 'response',
  REQUEST_PREPARATION = 'request_preparation',
  NETWORK_LATENCY = 'network_latency',
  RESPONSE_PROCESSING = 'response_processing',
  TOKEN_PROCESSING = 'token_processing',
}

}

export function initializeMetrics(_config: Config): void {}

export function initializePerformanceMonitoring(_config: Config): void {}

}

export function recordChatCompressionMetrics(
  _config: Config,
  _attributes: unknown,
): void {}

export function recordToolCallMetrics(
  _config: Config,
  _toolName: string,
  _success: boolean,
  _latencyMs: number,
  _metadata?: unknown,
): void {}

export function recordApiRequest(
  _config: Config,
  _model: string,
  _success: boolean,
  _latencyMs: number,
  _metadata?: unknown,
): void {}

export function recordApiResponseMetrics(
  _config: Config,
  _model: string,
  _latencyMs: number,
  _metadata?: unknown,
): void {}

export function recordApiErrorMetrics(
  _config: Config,
  _model: string,
  _errorType: string,
  _metadata?: unknown,
): void {}

export function recordTokenUsageMetrics(
  _config: Config,
  _model: string,
  _inputTokens: number,
  _outputTokens: number,
  _thoughtTokens?: number,
  _cacheTokens?: number,
): void {}

export function recordSessionStart(_config: Config): void {}

export function recordFileOperationMetric(
  _config: Config,
  _operation: FileOperation,
  _metadata?: unknown,
): void {}

export function recordInvalidChunk(_config: Config): void {}

export function recordContentRetry(_config: Config): void {}

export function recordContentRetryFailure(_config: Config): void {}

export function recordApiRetry(_config: Config): void {}

export function recordModelSlashCommandCall(
  _config: Config,
  _modelName: string,
): void {}

export function recordChatCompression(
  _config: Config,
  _tokensBefore: number,
  _tokensAfter: number,
): void {}

export function recordArenaSessionStartedMetrics(_config: Config): void {}
export function recordArenaAgentCompletedMetrics(
  _config: Config,
  _durationMs: number,
  _tokens: number,
): void {}
export function recordArenaSessionEndedMetrics(
  _config: Config,
  _durationMs: number,
  _status: string,
): void {}

export function recordMemoryExtractMetrics(
  _config: Config,
  _durationMs: number,
): void {}
export function recordMemoryDreamMetrics(
  _config: Config,
  _durationMs: number,
): void {}
export function recordMemoryRecallMetrics(
  _config: Config,
  _durationMs: number,
): void {}

export function recordStartupPerformance(
  _config: Config,
  _phase: string,
  _durationMs: number,
  _details?: Record<string, string | number | boolean>,
): void {}

export function recordMemoryUsage(
  _config: Config,
  _bytes: number,
  _attributes: { memory_type: MemoryMetricType; component?: string },
): void {}

export function recordCpuUsage(
  _config: Config,
  _percentage: number,
  _attributes: { component?: string },
): void {}

export function recordToolQueueDepth(_config: Config, _depth: number): void {}

export function recordToolExecutionBreakdown(
  _config: Config,
  _toolName: string,
  _phase: ToolExecutionPhase,
  _durationMs: number,
): void {}

export function recordTokenEfficiency(
  _config: Config,
  _model: string,
  _metric: string,
  _value: number,
  _context?: string,
): void {}

export function recordApiRequestBreakdown(
  _config: Config,
  _durationMs: number,
  _attributes: Record<string, string>,
): void {}

export function recordPerformanceScore(_config: Config, _score: number): void {}

export function recordPerformanceRegression(
  _config: Config,
  _metric: string,
  _severity: 'low' | 'medium' | 'high',
  _currentValue: number,
  _baselineValue: number,
): void {}

export function recordBaselineComparison(
  _config: Config,
  _metric: string,
  _value: number,
): void {}

export function isPerformanceMonitoringActive(): boolean {
  return false;
}

