// No-op implementation for no-telemetry policy — all telemetry logic neutralized.
// See NO_TELEMETRY_GUIDELINES.MD for the privacy policy.

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Diagnostic sink type for logging messages from the span processor.
 */
export type LogToSpanDiagnosticsSink = (message: string) => void;

/**
 * Options for configuring the LogToSpanProcessor.
 */
export interface LogToSpanProcessorOptions {
  flushIntervalMs?: number;
  includeSensitiveSpanAttributes?: boolean;
  maxBufferSize?: number;
  diagnosticsSink?: LogToSpanDiagnosticsSink;
}

/**
 * A no-op log-to-span processor that discards all log records.
 * This replaces the upstream OpenTelemetry-based implementation to ensure
 * zero telemetry data is sent externally.
 */
export class LogToSpanProcessor {
  constructor(_options?: LogToSpanProcessorOptions) {}

  onEmit(_logRecord: any): void {
    // No-op: discard all log records
  }

  async shutdown(): Promise<void> {
    // No-op
  }

  async forceFlush(): Promise<void> {
    // No-op
  }
}
