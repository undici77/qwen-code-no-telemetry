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

// Performance Monitoring Metrics (no-op)
const STARTUP_TIME = 'qwen-code.startup.duration';
const MEMORY_USAGE = 'qwen-code.memory.usage';
const CPU_USAGE = 'qwen-code.cpu.usage';
const TOOL_QUEUE_DEPTH = 'qwen-code.tool.queue.depth';
const TOOL_EXECUTION_BREAKDOWN = 'qwen-code.tool.execution.breakdown';
const TOKEN_EFFICIENCY = 'qwen-code.token.efficiency';
const API_REQUEST_BREAKDOWN = 'qwen-code.api.request.breakdown';
const PERFORMANCE_SCORE = 'qwen-code.performance.score';
const REGRESSION_DETECTION = 'qwen-code.performance.regression';
const REGRESSION_PERCENTAGE_CHANGE =
  'qwen-code.performance.regression.percentage_change';
const BASELINE_COMPARISON = 'qwen-code.performance.baseline.comparison';

export enum FileOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  RENAME = 'rename',
}

export enum PerformanceMetricType {
  LATENCY = 'latency',
  THROUGHPUT = 'throughput',
  ERROR_RATE = 'error_rate',
}

export enum MemoryMetricType {
  HEAP_USED = 'heap_used',
  HEAP_TOTAL = 'heap_total',
  RSS = 'rss',
}

export enum ToolExecutionPhase {
  PREPARATION = 'preparation',
  EXECUTION = 'execution',
  POST_PROCESSING = 'post_processing',
}

export enum ApiRequestPhase {
  REQUEST_START = 'request_start',
  RESPONSE_RECEIVED = 'response_received',
}

export function getMeter(): any {
  return undefined;
}

export function initializeMetrics(_config: Config): void {}

export function recordChatCompressionMetrics(
  _config: Config,
  _event: any,
): void {}

export function recordToolCallMetrics(_config: Config, _event: any): void {}

export function recordTokenUsageMetrics(_config: Config, _event: any): void {}

export function recordApiResponseMetrics(_config: Config, _event: any): void {}

export function recordApiErrorMetrics(_config: Config, _event: any): void {}

export function recordFileOperationMetric(_config: Config, _event: any): void {}

export function recordInvalidChunk(_config: Config): void {}

export function recordContentRetry(_config: Config): void {}

export function recordContentRetryFailure(_config: Config): void {}

export function recordModelSlashCommand(_config: Config, _event: any): void {}

export function initializePerformanceMonitoring(_config: Config): void {}

export function recordStartupPerformance(
  _config: Config,
  _duration: number,
): void {}

export function recordMemoryUsage(_config: Config, _usage: any): void {}

export function recordCpuUsage(_config: Config, _usage: any): void {}

export function recordToolQueueDepth(
  _config: Config,
  _queueDepth: number,
): void {}

export function recordToolExecutionBreakdown(
  _config: Config,
  _event: any,
): void {}

export function recordTokenEfficiency(
  _config: Config,
  _efficiency: number,
): void {}

export function recordApiRequestBreakdown(_config: Config, _event: any): void {}

export function recordPerformanceScore(_config: Config, _score: number): void {}

export function recordPerformanceRegression(
  _config: Config,
  _event: any,
): void {}

export function recordBaselineComparison(_config: Config, _event: any): void {}

export function isPerformanceMonitoringActive(): boolean {
  return false;
}

export function recordSubagentExecutionMetrics(
  _config: Config,
  _event: any,
): void {}

// Arena Metric Recording Functions (no-op for no-telemetry policy)
export function recordArenaSessionStartedMetrics(_config: Config): void {}
export function recordArenaAgentCompletedMetrics(
  _config: Config,
  _modelId: string,
  _status: string,
  _durationMs: number,
  _inputTokens: number,
  _outputTokens: number,
): void {}
export function recordArenaSessionEndedMetrics(
  _config: Config,
  _status: string,
  _displayBackend?: string,
  _durationMs?: number,
  _winnerModelId?: string,
): void {}
