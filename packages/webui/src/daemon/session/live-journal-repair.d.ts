/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type DaemonEvent } from '@qwen-code/sdk/daemon';
export interface LiveJournalRepairTarget {
    marker: DaemonEvent;
    promptId: string;
    signature: string;
}
export interface LiveJournalRepairSuffix {
    events: DaemonEvent[];
    terminal: DaemonEvent;
}
export declare function findLiveJournalRepairTarget(sessionId: string, liveJournal: readonly DaemonEvent[], lastEventId: number | undefined, replayDegraded: boolean): LiveJournalRepairTarget | undefined;
export declare function findLiveJournalRepairSuffix(replayEvents: readonly DaemonEvent[], promptId: string): LiveJournalRepairSuffix | undefined;
export declare function eventPromptId(event: DaemonEvent): string | undefined;
export declare function isLiveJournalMarker(event: DaemonEvent): boolean;
