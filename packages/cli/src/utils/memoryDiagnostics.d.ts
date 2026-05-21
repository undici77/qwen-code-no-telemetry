/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const HIGH_HEAP_PRESSURE_THRESHOLD = 0.85;
export interface MemoryDiagnostics {
    generatedAt: string;
    process: {
        pid: number;
        nodeVersion: string;
        platform: NodeJS.Platform;
        arch: string;
        uptimeSeconds: number;
    };
    memory: NodeJS.MemoryUsage;
    v8: {
        heapStatistics?: Record<string, number>;
        heapSpaces: Array<Record<string, number | string>>;
        unavailable?: boolean;
    };
    activeHandles: {
        count: number;
        unavailable: boolean;
    };
    activeRequests: {
        count: number;
        unavailable: boolean;
    };
}
export declare function getMemoryDiagnostics(): MemoryDiagnostics;
export interface WriteMemoryHeapSnapshotOptions {
    outputDir?: string;
    now?: Date;
    writeSnapshot?: (filePath: string) => string;
    estimateSnapshotBytes?: () => number;
    getAvailableBytes?: (dir: string) => number;
    minFreeBytesAfterSnapshot?: number;
    maxSnapshots?: number;
    rateLimitMs?: number;
}
export interface MemoryPressureSample {
    index: number;
    timestamp: string;
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
}
export interface CollectMemoryPressureSamplesOptions {
    sampleCount?: number;
    intervalMs?: number;
    signal?: AbortSignal;
    now?: () => Date;
    memoryUsage?: () => NodeJS.MemoryUsage;
    wait?: (ms: number) => Promise<void>;
}
export declare function clearHeapSnapshotRateLimit(): void;
export declare function writeMemoryHeapSnapshot({ outputDir, now, writeSnapshot, estimateSnapshotBytes: estimateSnapshotBytesOption, getAvailableBytes: getAvailableBytesOption, minFreeBytesAfterSnapshot, maxSnapshots, rateLimitMs, }?: WriteMemoryHeapSnapshotOptions): string;
export declare function collectMemoryPressureSamples({ sampleCount, intervalMs, signal, now, memoryUsage, wait, }?: CollectMemoryPressureSamplesOptions): Promise<MemoryPressureSample[]>;
export declare function getHeapPressure(diagnostics: MemoryDiagnostics): number | undefined;
export declare function isHighHeapPressure(diagnostics: MemoryDiagnostics): boolean;
export declare function formatMemoryPressureSamples(samples: MemoryPressureSample[]): string;
export declare function formatMemoryDiagnostics(diagnostics: MemoryDiagnostics): string;
