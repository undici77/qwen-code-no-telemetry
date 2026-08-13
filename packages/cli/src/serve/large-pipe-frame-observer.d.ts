/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonLogger } from './daemon-logger.js';
export declare const LARGE_PIPE_FRAME_THRESHOLD_BYTES: number;
export declare const LARGE_PIPE_FRAME_LOG_LIMIT = 50;
export declare const LARGE_PIPE_FRAME_LOG_WINDOW_MS = 60000;
export declare const LARGE_PIPE_FRAME_EVENT_NAME = "qwen-code.daemon.pipe.large_frame";
type PipeDirection = 'inbound' | 'outbound';
type LogValue = string | number | boolean;
export type LargePipeFrameContext = Record<string, LogValue>;
export interface LargePipeFrameObservation {
    direction: PipeDirection;
    bytes: number;
    message: unknown;
}
export interface LargePipeFrameObserverOptions {
    daemonLog: Pick<DaemonLogger, 'warn'>;
    emitTelemetryLog?: (body: string, attributes: Record<string, LogValue>, options?: {
        eventName?: string;
    }) => void;
    logLimit?: number;
    now?: () => number;
    thresholdBytes?: number;
    windowMs?: number;
}
export declare function createLargePipeFrameObserver(options: LargePipeFrameObserverOptions): (observation: LargePipeFrameObservation) => void;
export declare function classifyLargePipeFrame(observation: LargePipeFrameObservation, thresholdBytes?: number): LargePipeFrameContext | undefined;
export {};
