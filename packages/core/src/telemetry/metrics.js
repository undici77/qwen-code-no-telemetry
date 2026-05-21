/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
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
export const REGRESSION_PERCENTAGE_CHANGE = 'qwen-code.performance.regression.percentage_change';
export const BASELINE_COMPARISON = 'qwen-code.performance.baseline.comparison';
export var FileOperation;
(function (FileOperation) {
    FileOperation["CREATE"] = "create";
    FileOperation["READ"] = "read";
    FileOperation["UPDATE"] = "update";
    FileOperation["DELETE"] = "delete";
})(FileOperation || (FileOperation = {}));
export var MemoryMetricType;
(function (MemoryMetricType) {
    MemoryMetricType["RSS"] = "rss";
    MemoryMetricType["HEAP_TOTAL"] = "heapTotal";
    MemoryMetricType["HEAP_USED"] = "heapUsed";
    MemoryMetricType["EXTERNAL"] = "external";
})(MemoryMetricType || (MemoryMetricType = {}));
export var ToolExecutionPhase;
(function (ToolExecutionPhase) {
    ToolExecutionPhase["SETUP"] = "setup";
    ToolExecutionPhase["EXECUTION"] = "execution";
    ToolExecutionPhase["TEARDOWN"] = "teardown";
})(ToolExecutionPhase || (ToolExecutionPhase = {}));
export var ApiRequestPhase;
(function (ApiRequestPhase) {
    ApiRequestPhase["REQUEST"] = "request";
    ApiRequestPhase["RESPONSE"] = "response";
})(ApiRequestPhase || (ApiRequestPhase = {}));
export var PerformanceMetricType;
(function (PerformanceMetricType) {
    PerformanceMetricType["STARTUP"] = "startup";
    PerformanceMetricType["MEMORY"] = "memory";
    PerformanceMetricType["CPU"] = "cpu";
    PerformanceMetricType["TOOL_QUEUE"] = "tool_queue";
    PerformanceMetricType["TOOL_EXECUTION"] = "tool_execution";
    PerformanceMetricType["TOKEN_EFFICIENCY"] = "token_efficiency";
    PerformanceMetricType["API_REQUEST"] = "api_request";
    PerformanceMetricType["PERFORMANCE_SCORE"] = "performance_score";
    PerformanceMetricType["REGRESSION_DETECTION"] = "regression_detection";
})(PerformanceMetricType || (PerformanceMetricType = {}));
export function recordToolCallMetrics(_config, _toolName, _success, _latencyMs, _metadata) { }
export function recordApiRequest(_config, _model, _success, _latencyMs, _metadata) { }
export function recordApiResponseMetrics(_config, _model, _latencyMs, _metadata) { }
export function recordApiErrorMetrics(_config, _model, _errorType, _metadata) { }
export function recordTokenUsageMetrics(_config, _model, _inputTokens, _outputTokens, _thoughtTokens, _cacheTokens) { }
export function recordSessionStart(_config) { }
export function recordFileOperationMetric(_config, _operation, _metadata) { }
export function recordInvalidChunk(_config) { }
export function recordContentRetry(_config) { }
export function recordContentRetryFailure(_config) { }
export function recordModelSlashCommandCall(_config, _modelName) { }
export function recordChatCompression(_config, _tokensBefore, _tokensAfter) { }
export function recordArenaSessionStartedMetrics(_config) { }
export function recordArenaAgentCompletedMetrics(_config, _durationMs, _tokens) { }
export function recordArenaSessionEndedMetrics(_config, _durationMs, _status) { }
export function recordMemoryExtractMetrics(_config, _durationMs) { }
export function recordMemoryDreamMetrics(_config, _durationMs) { }
export function recordMemoryRecallMetrics(_config, _durationMs) { }
// Performance Monitoring (no-op)
export function recordStartupPerformance(_config, _phase, _durationMs, _details) { }
export function recordMemoryUsage(_config, _memoryType, _bytes, _component) { }
export function recordCpuUsage(_config, _percentage, _component) { }
export function recordToolQueueDepth(_config, _depth) { }
export function recordToolExecutionBreakdown(_config, _toolName, _phase, _durationMs) { }
export function recordTokenEfficiency(_config, _model, _metric, _value, _context) { }
export function recordApiRequestBreakdown(_config, _model, _phase, _durationMs) { }
export function recordPerformanceScore(_config, _score) { }
export function recordPerformanceRegression(_config, _metric, _severity, _currentValue, _baselineValue) { }
export function recordBaselineComparison(_config, _metric, _value) { }
export function isPerformanceMonitoringActive() {
    return false;
}
export async function flushMetrics() { }
//# sourceMappingURL=metrics.js.map