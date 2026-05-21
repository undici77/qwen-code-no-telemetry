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

// Performance Monitoring Metrics (no-op - kept for compatibility)
export const STARTUP_TIME = 'qwen-code.startup.duration';
export const MEMORY_USAGE = 'qwen-code.memory.usage';
export const CPU_USAGE = 'qwen-code.cpu.usage';
export const TOOL_QUEUE_DEPTH = 'qwen-code.tool.queue.depth';
export const TOOL_EXECUTION_BREAKDOWN = 'qwen-code.tool.execution.breakdown';
export const TOKEN_EFFICIENCY = 'qwen-code.token.efficiency';
export const API_REQUEST_BREAKDOWN = 'qwen-code.api.request.breakdown';
export const PERFORMANCE_SCORE = 'qwen-code.performance.score';
export const REGRESSION_DETECTION = 'qwen-code.performance.regression';
export const REGRESSION_PERCENTAGE_CHANGE =
  'qwen-code.performance.regression.percentage_change';
export const BASELINE_COMPARISON = 'qwen-code.performance.baseline.comparison';

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
}

export enum ApiRequestPhase {
  REQUEST = 'request',
  RESPONSE = 'response',
}

export enum PerformanceMetricType {
  STARTUP = 'startup',
  MEMORY = 'memory',
  CPU = 'cpu',
  TOOL_QUEUE = 'tool_queue',
  TOOL_EXECUTION = 'tool_execution',
  TOKEN_EFFICIENCY = 'token_efficiency',
  API_REQUEST = 'api_request',
  PERFORMANCE_SCORE = 'performance_score',
  REGRESSION_DETECTION = 'regression_detection',
}

export function recordToolCallMetrics(
  _config: Config,
  _toolName: string,
  _success: boolean,
  _latencyMs: number,
  _metadata?: {
    decision?: 'accept' | 'reject' | 'modify' | 'auto_accept';
    tool_type?: 'native' | 'mcp';
  },
): void {}

export function recordApiRequest(
  _config: Config,
  _model: string,
  _success: boolean,
  _latencyMs: number,
  _metadata?: {
    status_code?: number | string;
    error_type?: string;
  },
): void {}

export function recordApiResponseMetrics(
  _config: Config,
  _model: string,
  _latencyMs: number,
  _metadata?: {
    status_code?: number | string;
  },
): void {}

export function recordApiErrorMetrics(
  _config: Config,
  _model: string,
  _errorType: string,
  _metadata?: {
    status_code?: number | string;
  },
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
  _metadata?: {
    lines?: number;
    mimetype?: string;
    extension?: string;
    programming_language?: string;
  },
): void {}

export function recordInvalidChunk(_config: Config): void {}

export function recordContentRetry(_config: Config): void {}

export function recordContentRetryFailure(_config: Config): void {}

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
export function recordArenaAgentCompletedMetrics(_config: Config, _durationMs: number, _tokens: number): void {}
export function recordArenaSessionEndedMetrics(_config: Config, _durationMs: number, _status: string): void {}

export function recordMemoryExtractMetrics(_config: Config, _durationMs: number): void {}
export function recordMemoryDreamMetrics(_config: Config, _durationMs: number): void {}
export function recordMemoryRecallMetrics(_config: Config, _durationMs: number): void {}

// Performance Monitoring (no-op)
export function recordStartupPerformance(
  _config: Config,
  _phase: string,
  _durationMs: number,
  _details?: Record<string, string | number | boolean>,
): void {}

export function recordMemoryUsage(
  _config: Config,
  _memoryType: MemoryMetricType,
  _bytes: number,
  _component?: string,
): void {}

export function recordCpuUsage(
  _config: Config,
  _percentage: number,
  _component?: string,
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
  _model: string,
  _phase: string,
  _durationMs: number,
): void {}

export function recordPerformanceScore(_config: Config, _score: number): void {}

export function recordPerformanceRegression(
  _config: Config,
  _metric: string,
  _severity: 'low' | 'medium' | 'high',
  _currentValue: number,
  _baselineValue: number,
): void {}

export function recordBaselineComparison(_config: Config, _metric: string, _value: number): void {}

export function isPerformanceMonitoringActive(): boolean {
  return false;
}

export async function flushMetrics(): Promise<void> {}
