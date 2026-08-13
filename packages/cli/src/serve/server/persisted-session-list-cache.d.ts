/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionArchiveState } from '@qwen-code/qwen-code-core';
import type { BridgeSessionSummary } from '../acp-session-bridge.js';
export interface PersistedSessionListScope {
    runtimeBaseDir: string;
    workspaceCwd: string;
    archiveState: SessionArchiveState;
}
export interface PersistedSessionListSnapshot {
    sessions: ReadonlyArray<Readonly<BridgeSessionSummary>>;
    truncated: boolean;
    scanPages: number;
    scanDurationMs: number;
}
export type PersistedSessionListCacheStatus = 'scan' | 'cache_hit' | 'single_flight';
export interface PersistedSessionListLookup {
    status: PersistedSessionListCacheStatus;
    promise: Promise<PersistedSessionListSnapshot>;
    cacheAgeMs?: number;
}
export declare class PersistedSessionListCache {
    private readonly ttlMs;
    private readonly maxRetainedSummaries;
    private readonly slots;
    private retainedSummaries;
    constructor(ttlMs: number, maxRetainedSummaries: number);
    lookup(scope: PersistedSessionListScope, loader: (signal: AbortSignal) => Promise<PersistedSessionListSnapshot>, options?: {
        signal?: AbortSignal;
    }): PersistedSessionListLookup;
    invalidate(scope: PersistedSessionListScope): void;
    clear(): void;
    private installValue;
    private evictFor;
    private removeValue;
    private attachWaiter;
    private key;
}
