/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';

export const SUBAGENT_EXECUTION_COUNT = 'qwen.subagent.execution.count';

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

export function recordChatCompressionMetrics(_config: Config, _event: any): void {}

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

export function recordStartupPerformance(_config: Config, _duration: number): void {}

export function recordMemoryUsage(_config: Config, _usage: any): void {}

export function recordCpuUsage(_config: Config, _usage: any): void {}

export function recordToolQueueDepth(_config: Config, _queueDepth: number): void {}

export function recordToolExecutionBreakdown(_config: Config, _event: any): void {}

export function recordTokenEfficiency(_config: Config, _efficiency: number): void {}

export function recordApiRequestBreakdown(_config: Config, _event: any): void {}

export function recordPerformanceScore(_config: Config, _score: number): void {}

export function recordPerformanceRegression(_config: Config, _event: any): void {}

export function recordBaselineComparison(_config: Config, _event: any): void {}

export function isPerformanceMonitoringActive(): boolean {
  return false;
}

export function recordSubagentExecutionMetrics(_config: Config, _event: any): void {}
