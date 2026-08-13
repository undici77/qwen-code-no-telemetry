/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface EventLoopLagSnapshot {
    meanMs: number;
    p50Ms: number;
    p99Ms: number;
    maxMs: number;
}
export interface EventLoopLagMonitor {
    snapshot(): EventLoopLagSnapshot;
    dispose(): void;
}
export interface EventLoopLagMonitorOptions {
    resolutionMs?: number;
    stallThresholdMs?: number;
    /**
     * Consider a long scheduling gap to be host suspension only when process CPU
     * time stayed below this fraction of the gap. Default: 1%.
     */
    suspendCpuRatio?: number;
    /** Minimum event-loop gap eligible for host-suspension filtering. */
    suspendThresholdMs?: number;
    onNewMaxStall?: (maxMs: number) => void;
}
/**
 * Default minimum gap treated as host suspension. Kept at or below the ACP
 * bridge stall-kill threshold (`ACP_EVENT_LOOP_STALL_RESTART_MS`) so a low-CPU
 * sleep gap is always filtered before it can be reported as a kill-eligible
 * stall.
 */
export declare const DEFAULT_EVENT_LOOP_SUSPEND_THRESHOLD_MS: number;
export declare function startEventLoopLagMonitor(options?: EventLoopLagMonitorOptions): EventLoopLagMonitor;
