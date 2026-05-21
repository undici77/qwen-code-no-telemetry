export declare class LogToSpanProcessor {
    constructor();
    onEmit(): void;
    shutdown(): Promise<void>;
    forceFlush(): Promise<void>;
}
export type LogRecordProcessor = unknown;
export type ReadableLogRecord = unknown;
export type SpanExporter = unknown;
export type ReadableSpan = unknown;
export type Resource = unknown;
export declare function resourceFromAttributes(): {};
