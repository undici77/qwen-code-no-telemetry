/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type WorkflowDispatchState = 'running' | 'pausing' | 'paused';
export interface WorkflowDispatchSnapshot {
    state: WorkflowDispatchState;
    queued: number;
    inFlight: number;
}
export declare class WorkflowDispatchScheduler {
    private readonly limit;
    private readonly signal?;
    private state;
    private inFlight;
    private readonly queue;
    private readonly gateWaiters;
    private readonly stateListeners;
    constructor(limit: number, signal?: AbortSignal | undefined, onStateChange?: (snapshot: WorkflowDispatchSnapshot) => void);
    /**
     * Subscribe to state transitions. Returns an unsubscribe function.
     * The constructor callback (when given) is registered as the first
     * listener; this method lets additional observers — e.g. the sandbox's
     * pause-aware wall-clock watchdog — hook the same transitions.
     */
    onStateChange(listener: (snapshot: WorkflowDispatchSnapshot) => void): () => void;
    run<T>(thunk: () => Promise<T>): Promise<T>;
    pause(): boolean;
    resume(): boolean;
    waitUntilRunning(): Promise<void>;
    snapshot(): WorkflowDispatchSnapshot;
    private pump;
    private setState;
    private abortPending;
}
