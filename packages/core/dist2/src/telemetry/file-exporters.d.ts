/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
declare class FileExporter {
    constructor(_filePath: string);
    protected serialize(data: unknown): string;
    shutdown(): Promise<void>;
}
export declare class FileSpanExporter extends FileExporter {
    export(_spans: unknown[], resultCallback: (result: {
        code: number;
    }) => void): void;
}
export declare class FileLogExporter extends FileExporter {
    export(_logs: unknown[], resultCallback: (result: {
        code: number;
    }) => void): void;
}
export declare class FileMetricExporter extends FileExporter {
    export(_metrics: unknown, resultCallback: (result: {
        code: number;
    }) => void): void;
    getPreferredAggregationTemporality(): number;
    forceFlush(): Promise<void>;
}
export {};
