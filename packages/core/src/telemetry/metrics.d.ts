/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meter, Counter, Histogram } from './dummy-otel.js';
import { ValueType } from './dummy-otel.js';
import { EVENT_CHAT_COMPRESSION } from './constants.js';
import type { Config } from '../config/config.js';
import type { TelemetryRuntimeConfig } from './runtime-config.js';
import type { ModelSlashCommandEvent, MemoryRecallDeliveryPhase, MemoryRecallDeliveryPoint, MemoryRecallDiscardReason } from './types.js';
import type { ToolExecutionStatus } from '../core/turn.js';
declare const TOOL_CALL_COUNT = "qwen-code.tool.call.count";
declare const TOOL_EXECUTION_COUNT = "qwen-code.tool.execution.count";
export declare const REPEATED_TOOL_FAILURE_GUARD_COUNT = "qwen-code.repeated_tool_failure_guard.count";
declare const API_REQUEST_COUNT = "qwen-code.api.request.count";
declare const TOKEN_USAGE = "qwen-code.token.usage";
declare const FILE_OPERATION_COUNT = "qwen-code.file.operation.count";
declare const API_RETRY_COUNT = "qwen-code.api.retry.count";
export declare const SUBAGENT_EXECUTION_COUNT = "qwen-code.subagent.execution.count";
declare const STARTUP_TIME = "qwen-code.startup.duration";
declare const MEMORY_USAGE = "qwen-code.memory.usage";
declare const CPU_USAGE = "qwen-code.cpu.usage";
declare const TOOL_EXECUTION_BREAKDOWN = "qwen-code.tool.execution.breakdown";
declare const TOKEN_EFFICIENCY = "qwen-code.token.efficiency";
declare const API_REQUEST_BREAKDOWN = "qwen-code.api.request.breakdown";
declare const PERFORMANCE_SCORE = "qwen-code.performance.score";
declare const REGRESSION_DETECTION = "qwen-code.performance.regression";
declare const BASELINE_COMPARISON = "qwen-code.performance.baseline.comparison";
declare const COUNTER_DEFINITIONS: {
    readonly "qwen-code.tool.call.count": {
        readonly description: "Counts tool calls, tagged by function name and terminal status.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            function_name: string;
            success: boolean;
            status?: "success" | "error" | "cancelled";
            decision?: "accept" | "reject" | "modify" | "auto_accept";
            tool_type?: "native" | "mcp";
        };
    };
    readonly "qwen-code.tool.execution.count": {
        readonly description: "Counts tool execution outcomes.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            execution_status: ToolExecutionStatus | "unknown";
            tool_type: "native" | "mcp";
        };
    };
    readonly "qwen-code.repeated_tool_failure_guard.count": {
        readonly description: "Counts privacy-safe repeated tool execution failure guard transitions.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            route: "acp_foreground";
            mode: "shadow" | "warn" | "enforce";
            phase_before: "idle" | "tracking" | "warned" | "latched";
            phase_after: "idle" | "tracking" | "warned" | "latched";
            decision: "reset" | "tracked" | "would_warn" | "warned" | "would_stop" | "stopped";
            failure_count_bucket: "0" | "1-2" | "3-4" | "5-7" | "8+";
            batch_count_bucket: "0" | "1" | "2" | "3+";
            reset_reason?: "success" | "cancelled" | "not_started" | "post_execution_failure" | "unknown" | "mixed" | "incomplete" | "external_input" | "queued_prompt" | "unreliable_input" | "contract_violation";
            terminal_status?: "error";
            execution_status?: "error";
            tool_type?: "native" | "mcp";
        };
    };
    readonly "qwen-code.api.request.count": {
        readonly description: "Counts API requests, tagged by model and status.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            model: string;
            status_code?: number | string;
            error_type?: string;
        };
    };
    readonly "qwen-code.token.usage": {
        readonly description: "Counts the total number of tokens used.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            model: string;
            type: "input" | "output" | "thought" | "cache";
        };
    };
    readonly "qwen-code.session.count": {
        readonly description: "Count of CLI sessions started.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: Record<string, never>;
    };
    readonly "qwen-code.file.operation.count": {
        readonly description: "Counts file operations (create, read, update).";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            operation: FileOperation;
            lines?: number;
            mimetype?: string;
            extension?: string;
            programming_language?: string;
        };
    };
    readonly "qwen-code.chat.invalid_chunk.count": {
        readonly description: "Counts invalid chunks received from a stream.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: Record<string, never>;
    };
    readonly "qwen-code.chat.content_retry.count": {
        readonly description: "Counts retries due to content errors (e.g., empty stream).";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: Record<string, never>;
    };
    readonly "qwen-code.chat.content_retry_failure.count": {
        readonly description: "Counts occurrences of all content retries failing.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: Record<string, never>;
    };
    readonly "qwen-code.api.retry.count": {
        readonly description: "Counts HTTP-status retries (429/5xx) at LLM call sites, emitted by retryWithBackoff onRetry callback.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            model: string;
        };
    };
    readonly "qwen-code.slash_command.model.call_count": {
        readonly description: "Counts model slash command calls.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            "slash_command.model.model_name": string;
        };
    };
    readonly "qwen-code.chat_compression": {
        readonly description: "Counts chat compression events.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            tokens_before: number;
            tokens_after: number;
        };
    };
};
declare const HISTOGRAM_DEFINITIONS: {
    readonly "qwen-code.tool.call.latency": {
        readonly description: "Latency of tool calls in milliseconds.";
        readonly unit: "ms";
        readonly valueType: ValueType.INT;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            function_name: string;
        };
    };
    readonly "qwen-code.api.request.latency": {
        readonly description: "Latency of API requests in milliseconds.";
        readonly unit: "ms";
        readonly valueType: ValueType.INT;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            model: string;
        };
    };
};
declare const PERFORMANCE_COUNTER_DEFINITIONS: {
    readonly "qwen-code.performance.regression": {
        readonly description: "Performance regression detection events.";
        readonly valueType: ValueType.INT;
        readonly assign: (c: Counter) => any;
        readonly attributes: {
            metric: string;
            severity: "low" | "medium" | "high";
            current_value: number;
            baseline_value: number;
        };
    };
};
declare const PERFORMANCE_HISTOGRAM_DEFINITIONS: {
    readonly "qwen-code.startup.duration": {
        readonly description: "CLI startup time in milliseconds, broken down by initialization phase.";
        readonly unit: "ms";
        readonly valueType: ValueType.DOUBLE;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            phase: string;
            details?: Record<string, string | number | boolean>;
        };
    };
    readonly "qwen-code.memory.usage": {
        readonly description: "Memory usage in bytes.";
        readonly unit: "bytes";
        readonly valueType: ValueType.INT;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            memory_type: MemoryMetricType;
            component?: string;
        };
    };
    readonly "qwen-code.cpu.usage": {
        readonly description: "CPU usage percentage.";
        readonly unit: "percent";
        readonly valueType: ValueType.DOUBLE;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            component?: string;
        };
    };
    readonly "qwen-code.tool.queue.depth": {
        readonly description: "Number of tools in execution queue.";
        readonly unit: "count";
        readonly valueType: ValueType.INT;
        readonly assign: (h: Histogram) => any;
        readonly attributes: Record<string, never>;
    };
    readonly "qwen-code.tool.execution.breakdown": {
        readonly description: "Tool execution time breakdown by phase in milliseconds.";
        readonly unit: "ms";
        readonly valueType: ValueType.INT;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            function_name: string;
            phase: ToolExecutionPhase;
        };
    };
    readonly "qwen-code.token.efficiency": {
        readonly description: "Token efficiency metrics (tokens per operation, cache hit rate, etc.).";
        readonly unit: "ratio";
        readonly valueType: ValueType.DOUBLE;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            model: string;
            metric: string;
            context?: string;
        };
    };
    readonly "qwen-code.api.request.breakdown": {
        readonly description: "API request time breakdown by phase in milliseconds.";
        readonly unit: "ms";
        readonly valueType: ValueType.INT;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            model: string;
            phase: ApiRequestPhase;
        };
    };
    readonly "qwen-code.performance.score": {
        readonly description: "Composite performance score (0-100).";
        readonly unit: "score";
        readonly valueType: ValueType.DOUBLE;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            category: string;
            baseline?: number;
        };
    };
    readonly "qwen-code.performance.regression.percentage_change": {
        readonly description: "Percentage change compared to baseline for detected regressions.";
        readonly unit: "percent";
        readonly valueType: ValueType.DOUBLE;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            metric: string;
            severity: "low" | "medium" | "high";
            current_value: number;
            baseline_value: number;
        };
    };
    readonly "qwen-code.performance.baseline.comparison": {
        readonly description: "Performance comparison to established baseline (percentage change).";
        readonly unit: "percent";
        readonly valueType: ValueType.DOUBLE;
        readonly assign: (h: Histogram) => any;
        readonly attributes: {
            metric: string;
            category: string;
            current_value: number;
            baseline_value: number;
        };
    };
};
type AllMetricDefs = typeof COUNTER_DEFINITIONS & typeof HISTOGRAM_DEFINITIONS & typeof PERFORMANCE_COUNTER_DEFINITIONS & typeof PERFORMANCE_HISTOGRAM_DEFINITIONS;
export type MetricDefinitions = {
    [K in keyof AllMetricDefs]: {
        attributes: AllMetricDefs[K]['attributes'];
    };
};
export declare enum FileOperation {
    CREATE = "create",
    READ = "read",
    UPDATE = "update"
}
export declare enum PerformanceMetricType {
    STARTUP = "startup",
    MEMORY = "memory",
    CPU = "cpu",
    TOOL_EXECUTION = "tool_execution",
    API_REQUEST = "api_request",
    TOKEN_EFFICIENCY = "token_efficiency"
}
export declare enum MemoryMetricType {
    HEAP_USED = "heap_used",
    HEAP_TOTAL = "heap_total",
    EXTERNAL = "external",
    RSS = "rss"
}
export declare enum ToolExecutionPhase {
    VALIDATION = "validation",
    PREPARATION = "preparation",
    EXECUTION = "execution",
    RESULT_PROCESSING = "result_processing"
}
export declare enum ApiRequestPhase {
    REQUEST_PREPARATION = "request_preparation",
    NETWORK_LATENCY = "network_latency",
    RESPONSE_PROCESSING = "response_processing",
    TOKEN_PROCESSING = "token_processing"
}
export declare function getMeter(): Meter | undefined;
export declare function initializeMetrics(config: TelemetryRuntimeConfig): void;
export declare function recordChatCompressionMetrics(config: Config, attributes: MetricDefinitions[typeof EVENT_CHAT_COMPRESSION]['attributes']): void;
export declare function recordToolCallMetrics(config: Config, durationMs: number, attributes: MetricDefinitions[typeof TOOL_CALL_COUNT]['attributes']): void;
export declare function recordToolExecutionMetrics(config: TelemetryRuntimeConfig, attributes: MetricDefinitions[typeof TOOL_EXECUTION_COUNT]['attributes']): void;
export declare function recordRepeatedToolFailureGuardMetrics(attributes: MetricDefinitions[typeof REPEATED_TOOL_FAILURE_GUARD_COUNT]['attributes']): void;
export declare function recordTokenUsageMetrics(config: Config, tokenCount: number, attributes: MetricDefinitions[typeof TOKEN_USAGE]['attributes']): void;
export declare function recordApiResponseMetrics(config: Config, durationMs: number, attributes: MetricDefinitions[typeof API_REQUEST_COUNT]['attributes']): void;
export declare function recordApiErrorMetrics(config: Config, durationMs: number, attributes: MetricDefinitions[typeof API_REQUEST_COUNT]['attributes']): void;
export declare function recordFileOperationMetric(config: Config, attributes: MetricDefinitions[typeof FILE_OPERATION_COUNT]['attributes']): void;
/**
 * Records a metric for when an invalid chunk is received from a stream.
 */
export declare function recordInvalidChunk(config: Config): void;
/**
 * Records a metric for when a retry is triggered due to a content error.
 */
export declare function recordContentRetry(config: Config): void;
/**
 * Records a metric for when all content error retries have failed for a request.
 */
export declare function recordContentRetryFailure(config: Config): void;
/**
 * Phase 4b — Records a metric for an HTTP-status retry at an LLM call site.
 * Tagged by `model` so operators can graph per-model retry rate. Called from
 * `logApiRetry` in loggers.ts which is wired to `retryWithBackoff`'s `onRetry`
 * callback at the 4 LLM call sites.
 */
export declare function recordApiRetry(config: Config, attributes: MetricDefinitions[typeof API_RETRY_COUNT]['attributes']): void;
export declare function recordModelSlashCommand(config: Config, event: ModelSlashCommandEvent): void;
export declare function initializePerformanceMonitoring(config: TelemetryRuntimeConfig): void;
export declare function recordStartupPerformance(config: Config, durationMs: number, attributes: MetricDefinitions[typeof STARTUP_TIME]['attributes']): void;
export declare function recordMemoryUsage(config: Config, bytes: number, attributes: MetricDefinitions[typeof MEMORY_USAGE]['attributes']): void;
export declare function recordCpuUsage(config: Config, percentage: number, attributes: MetricDefinitions[typeof CPU_USAGE]['attributes']): void;
export declare function recordToolQueueDepth(config: Config, queueDepth: number): void;
export declare function recordToolExecutionBreakdown(config: Config, durationMs: number, attributes: MetricDefinitions[typeof TOOL_EXECUTION_BREAKDOWN]['attributes']): void;
export declare function recordTokenEfficiency(config: Config, value: number, attributes: MetricDefinitions[typeof TOKEN_EFFICIENCY]['attributes']): void;
export declare function recordApiRequestBreakdown(config: Config, durationMs: number, attributes: MetricDefinitions[typeof API_REQUEST_BREAKDOWN]['attributes']): void;
export declare function recordPerformanceScore(config: Config, score: number, attributes: MetricDefinitions[typeof PERFORMANCE_SCORE]['attributes']): void;
export declare function recordPerformanceRegression(config: Config, attributes: MetricDefinitions[typeof REGRESSION_DETECTION]['attributes']): void;
export declare function recordBaselineComparison(config: Config, attributes: MetricDefinitions[typeof BASELINE_COMPARISON]['attributes']): void;
export declare function isPerformanceMonitoringActive(): boolean;
/**
 * Records a metric for subagent execution events.
 */
export declare function recordSubagentExecutionMetrics(config: Config, subagentName: string, status: 'started' | 'completed' | 'failed' | 'cancelled', terminateReason?: string): void;
export declare function recordArenaSessionStartedMetrics(config: Config): void;
export declare function recordArenaAgentCompletedMetrics(config: Config, modelId: string, status: string, durationMs: number, inputTokens: number, outputTokens: number): void;
export declare function recordArenaSessionEndedMetrics(config: Config, status: string, displayBackend?: string, durationMs?: number, winnerModelId?: string): void;
export declare function recordMemoryExtractMetrics(config: Config, durationMs: number, attrs: {
    trigger: 'auto' | 'manual';
    status: 'completed' | 'skipped' | 'failed';
    patches_count: number;
}): void;
export declare function recordMemoryDreamMetrics(config: Config, durationMs: number, attrs: {
    trigger: 'auto' | 'manual';
    status: 'updated' | 'noop' | 'failed' | 'cancelled';
    deduped_entries: number;
}): void;
export declare function recordMemoryRecallMetrics(config: Config, durationMs: number, attrs: {
    strategy: 'none' | 'heuristic' | 'model';
    docs_selected: number;
}): void;
export declare function recordChannelMemoryRecallMetrics(observation: {
    durationMs: number;
    cache: 'hit' | 'miss' | 'bypass';
    result: 'selected' | 'empty' | 'stale' | 'read_error' | 'revision_unstable';
    selectedCount: number;
}): void;
export declare function recordMemoryRecallDeliveryMetrics(config: Config, latencyMs: number, attrs: {
    phase: MemoryRecallDeliveryPhase;
    delivery_point: MemoryRecallDeliveryPoint;
    discard_reason?: MemoryRecallDiscardReason;
    strategy: 'none' | 'heuristic' | 'model';
}): void;
export {};
