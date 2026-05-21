/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
export declare const SUBAGENT_EXECUTION_COUNT = "qwen.subagent.execution.count";
export declare const ARENA_SESSION_COUNT = "qwen-code.arena.session.count";
export declare const ARENA_SESSION_DURATION = "qwen-code.arena.session.duration";
export declare const ARENA_AGENT_COUNT = "qwen-code.arena.agent.count";
export declare const ARENA_AGENT_DURATION = "qwen-code.arena.agent.duration";
export declare const ARENA_AGENT_TOKENS = "qwen-code.arena.agent.tokens";
export declare const ARENA_RESULT_SELECTED = "qwen-code.arena.result.selected";
export declare const STARTUP_TIME = "qwen-code.startup.duration";
export declare const MEMORY_USAGE = "qwen-code.memory.usage";
export declare const CPU_USAGE = "qwen-code.cpu.usage";
export declare const TOOL_QUEUE_DEPTH = "qwen-code.tool.queue.depth";
export declare const TOOL_EXECUTION_BREAKDOWN = "qwen-code.tool.execution.breakdown";
export declare const TOKEN_EFFICIENCY = "qwen-code.token.efficiency";
export declare const API_REQUEST_BREAKDOWN = "qwen-code.api.request.breakdown";
export declare const PERFORMANCE_SCORE = "qwen-code.performance.score";
export declare const REGRESSION_DETECTION = "qwen-code.performance.regression";
export declare const REGRESSION_PERCENTAGE_CHANGE = "qwen-code.performance.regression.percentage_change";
export declare const BASELINE_COMPARISON = "qwen-code.performance.baseline.comparison";
export declare enum FileOperation {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete"
}
export declare enum MemoryMetricType {
    RSS = "rss",
    HEAP_TOTAL = "heapTotal",
    HEAP_USED = "heapUsed",
    EXTERNAL = "external"
}
export declare enum ToolExecutionPhase {
    SETUP = "setup",
    EXECUTION = "execution",
    TEARDOWN = "teardown"
}
export declare enum ApiRequestPhase {
    REQUEST = "request",
    RESPONSE = "response"
}
export declare enum PerformanceMetricType {
    STARTUP = "startup",
    MEMORY = "memory",
    CPU = "cpu",
    TOOL_QUEUE = "tool_queue",
    TOOL_EXECUTION = "tool_execution",
    TOKEN_EFFICIENCY = "token_efficiency",
    API_REQUEST = "api_request",
    PERFORMANCE_SCORE = "performance_score",
    REGRESSION_DETECTION = "regression_detection"
}
export declare function recordToolCallMetrics(_config: Config, _toolName: string, _success: boolean, _latencyMs: number, _metadata?: {
    decision?: 'accept' | 'reject' | 'modify' | 'auto_accept';
    tool_type?: 'native' | 'mcp';
}): void;
export declare function recordApiRequest(_config: Config, _model: string, _success: boolean, _latencyMs: number, _metadata?: {
    status_code?: number | string;
    error_type?: string;
}): void;
export declare function recordApiResponseMetrics(_config: Config, _model: string, _latencyMs: number, _metadata?: {
    status_code?: number | string;
}): void;
export declare function recordApiErrorMetrics(_config: Config, _model: string, _errorType: string, _metadata?: {
    status_code?: number | string;
}): void;
export declare function recordTokenUsageMetrics(_config: Config, _model: string, _inputTokens: number, _outputTokens: number, _thoughtTokens?: number, _cacheTokens?: number): void;
export declare function recordSessionStart(_config: Config): void;
export declare function recordFileOperationMetric(_config: Config, _operation: FileOperation, _metadata?: {
    lines?: number;
    mimetype?: string;
    extension?: string;
    programming_language?: string;
}): void;
export declare function recordInvalidChunk(_config: Config): void;
export declare function recordContentRetry(_config: Config): void;
export declare function recordContentRetryFailure(_config: Config): void;
export declare function recordModelSlashCommandCall(_config: Config, _modelName: string): void;
export declare function recordChatCompression(_config: Config, _tokensBefore: number, _tokensAfter: number): void;
export declare function recordArenaSessionStartedMetrics(_config: Config): void;
export declare function recordArenaAgentCompletedMetrics(_config: Config, _durationMs: number, _tokens: number): void;
export declare function recordArenaSessionEndedMetrics(_config: Config, _durationMs: number, _status: string): void;
export declare function recordMemoryExtractMetrics(_config: Config, _durationMs: number): void;
export declare function recordMemoryDreamMetrics(_config: Config, _durationMs: number): void;
export declare function recordMemoryRecallMetrics(_config: Config, _durationMs: number): void;
export declare function recordStartupPerformance(_config: Config, _phase: string, _durationMs: number, _details?: Record<string, string | number | boolean>): void;
export declare function recordMemoryUsage(_config: Config, _memoryType: MemoryMetricType, _bytes: number, _component?: string): void;
export declare function recordCpuUsage(_config: Config, _percentage: number, _component?: string): void;
export declare function recordToolQueueDepth(_config: Config, _depth: number): void;
export declare function recordToolExecutionBreakdown(_config: Config, _toolName: string, _phase: ToolExecutionPhase, _durationMs: number): void;
export declare function recordTokenEfficiency(_config: Config, _model: string, _metric: string, _value: number, _context?: string): void;
export declare function recordApiRequestBreakdown(_config: Config, _model: string, _phase: string, _durationMs: number): void;
export declare function recordPerformanceScore(_config: Config, _score: number): void;
export declare function recordPerformanceRegression(_config: Config, _metric: string, _severity: 'low' | 'medium' | 'high', _currentValue: number, _baselineValue: number): void;
export declare function recordBaselineComparison(_config: Config, _metric: string, _value: number): void;
export declare function isPerformanceMonitoringActive(): boolean;
export declare function flushMetrics(): Promise<void>;
