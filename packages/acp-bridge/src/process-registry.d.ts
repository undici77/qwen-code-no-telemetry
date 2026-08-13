/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ChildProcess } from 'node:child_process';
import type { AcpChannelExitInfo } from './channel.js';
export interface TrackedChildProcess {
    readonly exited: Promise<AcpChannelExitInfo | undefined>;
    terminate(): Promise<void>;
    killSync(): void;
}
export interface ProcessReservation {
    attach(child: ChildProcess): TrackedChildProcess;
    cancel(): void;
}
export declare class ProcessRegistry {
    private readonly reservations;
    private readonly children;
    private draining;
    private shutdownPromise;
    reserve(): ProcessReservation;
    shutdown(): Promise<void>;
    killAllSync(): void;
    get activeProcessCount(): number;
    /**
     * Children this registry has committed to: attached ones plus reservations
     * that have not attached yet. Larger than {@link activeProcessCount}, and
     * the right figure for admission — `reserve()` inserts its token
     * synchronously before `spawn()`, so two racing spawns each see the other
     * here, while neither is visible in `activeProcessCount` until its child is
     * attached.
     *
     * A child leaves this count when it *exits*, not when `terminate()` starts,
     * so a channel swap is counted twice while the old process is still winding
     * down. That is deliberate: its memory is still resident.
     */
    get committedProcessCount(): number;
}
