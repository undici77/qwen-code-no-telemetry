/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const BEGIN_SYNCHRONIZED_UPDATE = "\u001B[?2026h";
export declare const END_SYNCHRONIZED_UPDATE = "\u001B[?2026l";
export interface SynchronizedOutputStatsSnapshot {
    synchronizedOutputFrameCount: number;
    synchronizedOutputBeginCount: number;
    synchronizedOutputEndCount: number;
}
export declare function getSynchronizedOutputStatsSnapshot(): SynchronizedOutputStatsSnapshot;
export declare function resetSynchronizedOutputStats(): void;
export declare function terminalSupportsSynchronizedOutput(env?: NodeJS.ProcessEnv): boolean;
export declare function installSynchronizedOutput(stdout?: NodeJS.WriteStream, env?: NodeJS.ProcessEnv): () => void;
