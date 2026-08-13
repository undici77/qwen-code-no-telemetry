/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function initializeDaemonMetrics(): void;
export interface DaemonGaugeCallbacks {
    sessionCount: () => number;
    sseCount: () => number;
    heapUsed: () => number;
}
export declare function registerDaemonGaugeCallbacks(callbacks: DaemonGaugeCallbacks): void;
export declare function recordDaemonHttpRequest(durationMs: number, route: string, statusCode: number, deferredRuntimePath?: 'started_on_request' | 'joined'): void;
export declare function recordDaemonSessionLifecycle(action: 'spawn' | 'close' | 'die'): void;
export declare function recordDaemonChannelLifecycle(action: 'spawn' | 'exit', expected?: boolean): void;
export declare function recordDaemonPromptQueueWait(durationMs: number): void;
export declare function recordDaemonPromptDuration(durationMs: number): void;
export declare function recordDaemonBridgeError(err: unknown): void;
export declare function recordDaemonCancel(): void;
export type DaemonPipeDirection = 'inbound' | 'outbound';
export declare function recordDaemonPipeMessage(direction: DaemonPipeDirection, bytes: number): void;
