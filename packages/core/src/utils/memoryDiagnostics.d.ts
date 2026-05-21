/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import v8 from 'node:v8';
export interface MemoryDiagnostics {
    timestamp: string;
    sessionId?: string;
    qwenVersion?: string;
    uptimeSeconds: number;
    memoryUsage: NodeJS.MemoryUsage;
    v8HeapStats: V8HeapStats;
    v8HeapSpaces: V8HeapSpaceStats[] | null;
    resourceUsage: MemoryResourceUsage;
    processTree: ProcessTreeMemoryUsage | null;
    activeHandles: number;
    activeRequests: number;
    openFileDescriptors: number | null;
    smapsRollup: string | null;
    platform: NodeJS.Platform;
    nodeVersion: string;
    analysis: MemoryDiagnosticsAnalysis;
}
export interface V8HeapStats {
    heapSizeLimit: number;
    totalHeapSize: number;
    usedHeapSize: number;
    mallocedMemory: number;
    peakMallocedMemory: number;
    detachedContexts: number;
    nativeContexts: number;
}
export interface V8HeapSpaceStats {
    name: string;
    size: number;
    used: number;
    available: number;
}
export interface MemoryResourceUsage {
    /** Normalized bytes. Node/resourceUsage reports maxRSS in KiB. */
    maxRSS: number;
    maxRSSRaw: number;
    maxRSSUnit: 'KiB';
    userCPUTime: number;
    systemCPUTime: number;
}
export interface ProcessTreeMemoryUsage {
    rootPid: number;
    processCount: number;
    rootRSS: number;
    treeRSS: number;
}
export interface MemoryDiagnosticsAnalysis {
    risks: MemoryRisk[];
    recommendation: string;
}
export interface MemoryRisk {
    type: 'heap-pressure' | 'detached-contexts' | 'active-handles' | 'active-requests' | 'fd-leak' | 'native-memory-pressure' | 'rss-heap-gap';
    message: string;
}
export interface MemoryDiagnosticsOptions {
    now?: () => Date;
    sessionId?: string;
    qwenVersion?: string;
    memoryUsage?: () => NodeJS.MemoryUsage;
    heapStatistics?: () => v8.HeapInfo;
    heapSpaceStatistics?: () => v8.HeapSpaceInfo[];
    resourceUsage?: () => NodeJS.ResourceUsage;
    uptimeSeconds?: () => number;
    activeHandles?: () => number;
    activeRequests?: () => number;
    openFileDescriptors?: () => Promise<number>;
    smapsRollup?: () => Promise<string>;
    processTree?: () => Promise<ProcessTreeMemoryUsage>;
    platform?: NodeJS.Platform;
    nodeVersion?: string;
}
export declare function collectMemoryDiagnostics(options?: MemoryDiagnosticsOptions): Promise<MemoryDiagnostics>;
