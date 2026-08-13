/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type BridgeEvent, type CompactionEngine, type SessionReplaySnapshot } from './eventBus.js';
export type { CompactionEngine, SessionReplaySnapshot };
export { DEFAULT_COMPACTED_REPLAY_MAX_BYTES, DEFAULT_MAX_JOURNAL_BYTES, DEFAULT_MAX_JOURNAL_EVENTS, MAX_COMPACTED_REPLAY_MAX_BYTES, normalizeCompactedReplayMaxBytes, normalizeMaxJournalBytes, normalizeMaxJournalEvents, } from './replayWindowLimits.js';
export interface ReplayWindowEviction {
    droppedBytes: number;
    droppedEvents: number;
    droppedSegments: number;
    droppedTurns: number;
    maxBytes: number;
    retainedBytes: number;
    retainedEvents: number;
}
export interface TurnBoundaryCompactionEngineOptions {
    maxReplayBytes?: number;
    onReplayWindowEviction?: (eviction: ReplayWindowEviction) => void;
    /**
     * Caps on the in-flight live journal (DAEMON-009). Compatible consecutive
     * text/thought chunks are grouped into bounded replay events; other events
     * retain their original boundaries. When either cap is hit the oldest
     * journal entries are dropped whole (merged segments included), so the
     * retained tail can be much smaller than the byte cap, and `snapshot()`
     * prepends a `history_truncated` marker
     * (`reason: 'replay_window_exceeded'`, `scope: 'live_journal'`). Turn
     * compaction is unaffected: it folds from the `slots` working set, not
     * the journal.
     */
    maxJournalEvents?: number;
    maxJournalBytes?: number;
}
/**
 * Compaction engine that merges events at turn boundaries.
 *
 * On each `turn_complete` / `turn_error`, all accumulated events for that
 * turn are folded: consecutive text/thought chunks merge into single events,
 * tool call sequences fold to final state, transient signals are dropped.
 * The relative ordering of different event types is preserved.
 *
 * The result is a replay log whose size is O(conversation_turns), not
 * O(streaming_tokens). Typical compression: 25-30x for chatty sessions.
 */
export declare class TurnBoundaryCompactionEngine implements CompactionEngine {
    private readonly maxReplayBytes;
    private readonly maxJournalEvents;
    private readonly maxJournalBytes;
    private readonly onReplayWindowEviction;
    private replaySegments;
    private replaySegmentStart;
    private replayBytes;
    private liveJournal;
    /** Serialized source-event size of each `liveJournal` entry, index-parallel. */
    private journalEntryBytes;
    /** Raw event count represented by each `liveJournal` entry. */
    private journalEntryEvents;
    private journalTotalBytes;
    private journalTotalEvents;
    private journalTruncatedEvents;
    private liveJournalTextSegment;
    private lastEventId;
    private closed;
    private truncatedEvents;
    private truncatedTurns;
    private activeRecordId;
    private replayAnchorRecordId;
    private slots;
    private toolSlotIndex;
    private textSlotIndex;
    constructor(opts?: TurnBoundaryCompactionEngineOptions);
    ingest(event: BridgeEvent, byteLength?: number): void;
    snapshot(): SessionReplaySnapshot;
    seed(snapshot: {
        compactedTurns: BridgeEvent[];
        lastEventId: number;
    }): void;
    seedReplayEvents(events: BridgeEvent[]): void;
    close(): void;
    private appendLiveJournal;
    private classifySessionUpdate;
    private mergeTextSlot;
    private compactCurrentTurn;
    private recordLastEventId;
    private resetJournal;
    private addReplaySegment;
    private enforceReplayWindow;
    private firstRetainedReplayRecordId;
    private flattenReplaySegments;
    private activeReplaySegmentCount;
    private compactReplaySegmentQueueIfNeeded;
    private notifyReplayWindowEviction;
    private makeHistoryTruncatedEvent;
    private resetReplayWindow;
    private clearTextSlotIndex;
}
