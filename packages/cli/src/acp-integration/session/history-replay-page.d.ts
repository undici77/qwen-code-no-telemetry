/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ChatRecord, type Config, type HistoryGap, type SessionTranscriptCursorState, type SessionTranscriptRecordPage } from '@qwen-code/qwen-code-core';
import type { SessionUpdate } from '@agentclientprotocol/sdk';
import type { CumulativeUsage } from './types.js';
interface ReplayLogger {
    warn(message: string, ...args: unknown[]): void;
}
export declare function createReplayCumulativeUsage(): CumulativeUsage;
export declare function copyCumulativeUsage(target: CumulativeUsage, source: CumulativeUsage): void;
export declare function collectHistoryReplayUpdates({ sessionId, config, records, gaps, cumulativeUsage, logger, }: {
    sessionId: string;
    config?: Config;
    records: ChatRecord[];
    gaps?: HistoryGap[];
    cumulativeUsage: CumulativeUsage;
    logger?: ReplayLogger;
}): Promise<{
    updates: SessionUpdate[];
    replayError?: string;
}>;
export declare function liftSessionUpdateTimestamps(updates: SessionUpdate[]): SessionUpdate[];
export interface ReplayedTranscriptPage {
    updates: SessionUpdate[];
    nextCursor?: string;
    hasMore: boolean;
    startTime: string;
    lastUpdated: string;
    partial?: true;
    replayError?: string;
}
export declare function replayTranscriptRecordPage({ sessionId, page, config, encodeCursor, logger, finalizeDangling, }: {
    sessionId: string;
    page: SessionTranscriptRecordPage;
    config?: Config;
    encodeCursor: (state: SessionTranscriptCursorState) => string;
    logger?: ReplayLogger;
    finalizeDangling?: boolean;
}): Promise<ReplayedTranscriptPage>;
export {};
