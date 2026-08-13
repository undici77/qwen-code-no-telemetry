/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Context } from './dummy-otel.js';
import type { LogRecordProcessor, ReadableLogRecord } from './dummy-otel.js';
import type { SpanExporter } from './dummy-otel.js';
/**
 * Sink for processor-internal diagnostic messages (export failures, buffer
 * overflows, timeouts). Messages are passed without a trailing newline — the
 * sink implementation decides how to terminate them.
 *
 * Default sink writes to stderr to keep diagnostics visible when the host
 * environment has no other logging pipeline. Hosts running a TUI should
 * inject a sink that routes to a file-based logger to avoid the message
 * landing in the rendered terminal area.
 */
export type LogToSpanDiagnosticsSink = (message: string) => void;
interface LogToSpanProcessorOptions {
    flushIntervalMs?: number;
    includeSensitiveSpanAttributes?: boolean;
    maxBufferSize?: number;
    diagnosticsSink?: LogToSpanDiagnosticsSink;
}
/**
 * A LogRecordProcessor that converts each OTel log record into a span
 * and exports it directly through the provided SpanExporter.
 *
 * This bridges the gap for backends (e.g., Alibaba Cloud) that support
 * traces and metrics but not logs over OTLP. Instead of going through
 * the global TracerProvider (which can break in bundled environments),
 * this processor directly constructs ReadableSpan objects and feeds
 * them to the exporter.
 *
 * Internal diagnostics (export failures, buffer overflows, timeouts) are
 * routed through {@link LogToSpanDiagnosticsSink} so TUI hosts can keep
 * them off the rendered terminal area; see the `diagnosticsSink` option.
 *
 * When a log record has a `duration_ms` attribute, the resulting span
 * will have a matching duration. Otherwise, the span is instantaneous.
 */
export declare class LogToSpanProcessor implements LogRecordProcessor {
    private readonly spanExporter;
    private buffer;
    private flushTimer;
    private inFlightExport;
    private readonly flushIntervalMs;
    private cachedSessionId;
    private cachedTraceId;
    private readonly includeSensitiveSpanAttributes;
    private readonly maxBufferSize;
    private readonly diagnosticsSink;
    private lastBufferOverflowWarningMs;
    private droppedSpansSinceLastBufferWarning;
    private totalDroppedSpans;
    private isShutdown;
    constructor(spanExporter: SpanExporter);
    constructor(spanExporter: SpanExporter, flushIntervalMs: number, maxBufferSize?: number);
    constructor(spanExporter: SpanExporter, options: LogToSpanProcessorOptions);
    onEmit(logRecord: ReadableLogRecord, emitContext?: Context): void;
    private warnBufferOverflow;
    private emitBufferOverflowWarning;
    /**
     * Route a diagnostic message to the configured sink, swallowing any sink
     * error so a misbehaving sink can never interrupt telemetry ingestion.
     *
     * Tradeoff: when the sink itself is broken (e.g. file-logger failing on
     * EACCES), bridge-specific diagnostics go dark. We accept that — the host
     * surfaces overall logging health via `isDebugLoggingDegraded()`, and
     * falling back to stderr here would re-introduce the TUI-pollution this
     * sink injection was added to prevent.
     */
    private emitDiagnostic;
    private flush;
    shutdown(): Promise<void>;
    forceFlush(): Promise<void>;
}
export {};
