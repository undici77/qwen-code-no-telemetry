/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { EVENT_SCHEMA_VERSION, logEventSizingFailed, serializedBridgeEventByteLength, } from './eventBus.js';
import { normalizeCompactedReplayMaxBytes, normalizeMaxJournalBytes, normalizeMaxJournalEvents, } from './replayWindowLimits.js';
export { DEFAULT_COMPACTED_REPLAY_MAX_BYTES, DEFAULT_MAX_JOURNAL_BYTES, DEFAULT_MAX_JOURNAL_EVENTS, MAX_COMPACTED_REPLAY_MAX_BYTES, normalizeCompactedReplayMaxBytes, normalizeMaxJournalBytes, normalizeMaxJournalEvents, } from './replayWindowLimits.js';
const TURN_BOUNDARY_TYPES = new Set(['turn_complete', 'turn_error']);
const TRANSIENT_TYPES = new Set([
    'history_truncated',
    'slow_client_warning',
    'client_evicted',
    'replay_complete',
    'stream_error',
]);
const LATEST_WINS_UPDATES = new Set([
    'available_commands_update',
    'current_mode_update',
]);
const REPLAY_SEGMENT_COMPACT_THRESHOLD = 64;
const LIVE_JOURNAL_TEXT_CHUNKS_PER_EVENT = 256;
function replayRecordId(event) {
    if (event.type !== 'session_update')
        return undefined;
    const data = event.data;
    if (!data || typeof data !== 'object' || Array.isArray(data))
        return undefined;
    const update = data['update'];
    if (!update || typeof update !== 'object' || Array.isArray(update)) {
        return undefined;
    }
    const meta = update['_meta'];
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
        return undefined;
    }
    const recordId = meta['qwen.session.recordId'];
    return typeof recordId === 'string' ? recordId : undefined;
}
function lastRecordIdIn(events) {
    for (let i = events.length - 1; i >= 0; i--) {
        const id = replayRecordId(events[i]);
        if (id !== undefined)
            return id;
    }
    return undefined;
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
export class TurnBoundaryCompactionEngine {
    maxReplayBytes;
    maxJournalEvents;
    maxJournalBytes;
    onReplayWindowEviction;
    replaySegments = [];
    replaySegmentStart = 0;
    replayBytes = 0;
    liveJournal = [];
    /** Serialized source-event size of each `liveJournal` entry, index-parallel. */
    journalEntryBytes = [];
    /** Raw event count represented by each `liveJournal` entry. */
    journalEntryEvents = [];
    journalTotalBytes = 0;
    journalTotalEvents = 0;
    journalTruncatedEvents = 0;
    liveJournalTextSegment;
    lastEventId = 0;
    closed = false;
    truncatedEvents = 0;
    truncatedTurns = 0;
    // Most recent `qwen.session.recordId` observed on an ingested or seeded
    // `session_update`. Surfaced on the `history_truncated` marker emitted by
    // `snapshot()` so clients that lost every turn-boundary event from their
    // retained window (e.g. a live-journal truncation during a single long
    // in-flight turn) still have an anchor for `beforeRecordId` transcript
    // pagination. Undefined until at least one recordId has been observed;
    // omitted from the marker in that case.
    activeRecordId;
    // Pagination anchor for the replay-path `history_truncated` marker,
    // frozen at the first replay-window eviction. Prefers the first
    // retained recordId (the eviction boundary, so `beforeRecordId`
    // fetches exactly the dropped records with no overlap); falls back to
    // the last dropped recordId when the retained window carries no
    // recordId. Deliberately NOT `activeRecordId` — that one is advanced
    // by `ingest()` on every turn boundary and, when a retained segment
    // carries the last seed recordId, would place the anchor inside the
    // retained window and re-fetch records the client already displays.
    replayAnchorRecordId;
    slots = [];
    toolSlotIndex = new Map();
    textSlotIndex = {
        text: new Map(),
        thought: new Map(),
    };
    constructor(opts = {}) {
        this.maxReplayBytes = normalizeCompactedReplayMaxBytes(opts.maxReplayBytes);
        this.maxJournalEvents = normalizeMaxJournalEvents(opts.maxJournalEvents);
        this.maxJournalBytes = normalizeMaxJournalBytes(opts.maxJournalBytes);
        this.onReplayWindowEviction = opts.onReplayWindowEviction;
    }
    ingest(event, byteLength) {
        if (this.closed)
            return;
        if (event.id !== undefined) {
            this.lastEventId = event.id;
        }
        if (TRANSIENT_TYPES.has(event.type))
            return;
        // Track the latest recordId seen on any session_update so a later
        // `snapshot()` can surface it on a `history_truncated` marker as a
        // pagination anchor. Runs for every non-transient event — recordIds
        // are sparse (only stamped on session_updates at turn boundaries),
        // so `replayRecordId` returning undefined is the common case and
        // intentionally leaves `activeRecordId` untouched.
        const seenRecordId = replayRecordId(event);
        if (seenRecordId !== undefined) {
            this.activeRecordId = seenRecordId;
        }
        this.appendLiveJournal(event, byteLength);
        if (TURN_BOUNDARY_TYPES.has(event.type)) {
            this.compactCurrentTurn(event);
            return;
        }
        if (event.type === 'session_update') {
            this.classifySessionUpdate(event);
            return;
        }
        this.slots.push({ kind: 'misc', event });
    }
    snapshot() {
        const compactedTurns = this.flattenReplaySegments();
        if (this.truncatedEvents > 0) {
            compactedTurns.unshift(this.makeHistoryTruncatedEvent(compactedTurns.length));
        }
        const liveJournal = this.liveJournal.map((entry) => isLiveJournalTextSegment(entry)
            ? mergeLiveJournalTextEvent(entry.firstEvent, entry.lastEvent, entry.chunks)
            : entry);
        if (this.journalTruncatedEvents > 0) {
            // Same wire shape as the compacted-window marker: the SDK's
            // normalizer and type guard both REQUIRE
            // `reason === 'replay_window_exceeded'` (anything else degrades the
            // frame to an unknown/debug event), so the journal marker reuses it
            // and carries `scope: 'live_journal'` as the discriminator — extra
            // fields pass both validators untouched.
            liveJournal.unshift({
                v: EVENT_SCHEMA_VERSION,
                type: 'history_truncated',
                data: {
                    reason: 'replay_window_exceeded',
                    scope: 'live_journal',
                    truncatedEvents: this.journalTruncatedEvents,
                    retainedEvents: this.journalTotalEvents,
                    maxBytes: this.maxJournalBytes,
                    maxEvents: this.maxJournalEvents,
                    // Pagination anchor — see makeHistoryTruncatedEvent.
                    ...(this.activeRecordId !== undefined
                        ? { recordId: this.activeRecordId }
                        : {}),
                    fullTranscriptAvailable: true,
                },
            });
        }
        return {
            compactedTurns,
            liveJournal,
            lastEventId: this.lastEventId,
        };
    }
    seed(snapshot) {
        if (this.closed)
            return;
        this.resetReplayWindow();
        this.lastEventId = snapshot.lastEventId;
        // Drop any previously-observed recordId anchor: the seeded compacted
        // turns are a fresh replay basis and the prior anchor refers to a
        // now-stale position. `activeRecordId` will be rebuilt from any
        // `session_update` recordIds encountered on subsequent `ingest()` calls.
        this.activeRecordId = undefined;
        // Pre-scan seeded compactedTurns for the last recordId (mirrors
        // seedReplayEvents) so eviction by addReplaySegment doesn't lose it.
        this.activeRecordId = lastRecordIdIn(snapshot.compactedTurns);
        for (const event of snapshot.compactedTurns) {
            if (TRANSIENT_TYPES.has(event.type))
                continue;
            this.addReplaySegment([event], 0);
        }
        this.resetJournal();
        this.slots = [];
        this.toolSlotIndex.clear();
        this.clearTextSlotIndex();
    }
    seedReplayEvents(events) {
        if (this.closed)
            return;
        this.resetReplayWindow();
        this.activeRecordId = undefined;
        // Pre-scan for the last recordId BEFORE segments are added (and
        // possibly evicted) so a subsequent `snapshot()` can still stamp it
        // on a `history_truncated` marker as a pagination anchor. Without
        // this, a seed whose head is evicted by the replay-byte cap would
        // lose its only recordId-bearing events and the marker would ship
        // with no anchor, breaking transcript pagination on reconnect.
        this.activeRecordId = lastRecordIdIn(events);
        let recordEvents = [];
        let recordId;
        const flushRecord = () => {
            this.addReplaySegment(recordEvents, 0);
            recordEvents = [];
            recordId = undefined;
        };
        for (const event of events) {
            this.recordLastEventId(event);
            if (TRANSIENT_TYPES.has(event.type))
                continue;
            const nextRecordId = replayRecordId(event);
            if (nextRecordId === undefined) {
                flushRecord();
                this.addReplaySegment([event], 0);
                continue;
            }
            if (recordId !== undefined && recordId !== nextRecordId) {
                flushRecord();
            }
            recordId = nextRecordId;
            recordEvents.push(event);
        }
        flushRecord();
        this.resetJournal();
        this.slots = [];
        this.toolSlotIndex.clear();
        this.clearTextSlotIndex();
    }
    close() {
        if (this.closed)
            return;
        this.closed = true;
        this.resetReplayWindow();
        this.resetJournal();
        this.activeRecordId = undefined;
        this.slots = [];
        this.toolSlotIndex.clear();
        this.clearTextSlotIndex();
    }
    appendLiveJournal(event, byteLength) {
        const bytes = byteLength ?? serializedBridgeEventByteLength(event) ?? 0;
        const textChunk = liveJournalTextChunk(event);
        const current = this.liveJournalTextSegment;
        const currentIndex = this.liveJournal.length - 1;
        if (textChunk &&
            current &&
            this.liveJournal[currentIndex] === current &&
            current.chunks.length < LIVE_JOURNAL_TEXT_CHUNKS_PER_EVENT &&
            this.journalEntryBytes[currentIndex] + bytes <= this.maxJournalBytes &&
            current.sessionUpdate === textChunk.sessionUpdate &&
            current.parentToolCallId === textChunk.parentToolCallId &&
            stringArraysEqual(current.sourceRecordIds, textChunk.sourceRecordIds) &&
            current.promptId === event.promptId &&
            current.originatorClientId === event.originatorClientId &&
            current.sessionId === captureSessionId(event) &&
            hasOnlyTimestampEnvelopeMeta(current.lastEvent._meta) &&
            hasOnlyTimestampEnvelopeMeta(event._meta)) {
            current.chunks.push(textChunk.text);
            current.lastEvent = event;
            this.journalEntryBytes[currentIndex] += bytes;
            this.journalEntryEvents[currentIndex] += 1;
            this.journalTotalBytes += bytes;
            this.journalTotalEvents += 1;
        }
        else {
            let entry = event;
            if (textChunk) {
                const segment = {
                    sessionUpdate: textChunk.sessionUpdate,
                    chunks: [textChunk.text],
                    sourceRecordIds: textChunk.sourceRecordIds,
                    parentToolCallId: textChunk.parentToolCallId,
                    promptId: event.promptId,
                    originatorClientId: event.originatorClientId,
                    sessionId: captureSessionId(event),
                    firstEvent: event,
                    lastEvent: event,
                };
                entry = segment;
                this.liveJournalTextSegment = segment;
            }
            else {
                this.liveJournalTextSegment = undefined;
            }
            this.liveJournal.push(entry);
            this.journalEntryBytes.push(bytes);
            this.journalEntryEvents.push(1);
            this.journalTotalBytes += bytes;
            this.journalTotalEvents += 1;
        }
        while (this.liveJournal.length > this.maxJournalEvents ||
            (this.journalTotalBytes > this.maxJournalBytes &&
                this.liveJournal.length > 1)) {
            const dropped = this.liveJournal.shift();
            this.journalTotalBytes -= this.journalEntryBytes.shift() ?? 0;
            const droppedEvents = this.journalEntryEvents.shift() ?? 0;
            this.journalTotalEvents -= droppedEvents;
            this.journalTruncatedEvents += droppedEvents;
            if (dropped === this.liveJournalTextSegment) {
                this.liveJournalTextSegment = undefined;
            }
        }
    }
    classifySessionUpdate(event) {
        const data = event.data;
        const updateType = data?.update?.sessionUpdate;
        if (!updateType) {
            this.slots.push({ kind: 'misc', event });
            return;
        }
        switch (updateType) {
            case 'agent_message_chunk': {
                if (hasDiscreteMessageMeta(data?.update?._meta)) {
                    this.slots.push({ kind: 'misc', event });
                    break;
                }
                this.mergeTextSlot('text', event, data);
                break;
            }
            case 'agent_thought_chunk': {
                if (hasDiscreteMessageMeta(data?.update?._meta)) {
                    this.slots.push({ kind: 'misc', event });
                    break;
                }
                this.mergeTextSlot('thought', event, data);
                break;
            }
            case 'tool_call':
            case 'tool_call_update': {
                const toolCallId = data?.update?.toolCallId;
                if (!toolCallId) {
                    this.slots.push({ kind: 'misc', event });
                    break;
                }
                const existingIdx = this.toolSlotIndex.get(toolCallId);
                if (existingIdx !== undefined) {
                    const slot = this.slots[existingIdx];
                    slot.event = mergeToolCallEvent(slot.event, event);
                }
                else {
                    const normalizedEvent = normalizeToolCallType(event);
                    this.toolSlotIndex.set(toolCallId, this.slots.length);
                    this.slots.push({
                        kind: 'tool',
                        toolCallId,
                        event: normalizedEvent,
                    });
                    // Evict text/thought index entries for this tool's parent so
                    // subsequent chunks from the same subagent create new slots,
                    // preserving text segmentation around tool-call boundaries.
                    const toolParent = extractParentToolCallIdFromMeta(data?.update?._meta);
                    if (toolParent) {
                        this.textSlotIndex.text.delete(toolParent);
                        this.textSlotIndex.thought.delete(toolParent);
                    }
                }
                break;
            }
            default: {
                if (LATEST_WINS_UPDATES.has(updateType)) {
                    const existingIdx = this.slots.findIndex((s) => s.kind === 'latestWins' && s.key === updateType);
                    if (existingIdx !== -1) {
                        this.slots[existingIdx].event = event;
                    }
                    else {
                        this.slots.push({ kind: 'latestWins', key: updateType, event });
                    }
                }
                else {
                    this.slots.push({ kind: 'misc', event });
                }
                break;
            }
        }
    }
    mergeTextSlot(kind, event, data) {
        const text = data?.update?.content?.text ?? '';
        const meta = data?.update?._meta;
        const parentToolCallId = extractParentToolCallIdFromMeta(meta);
        const sourceRecordIds = extractSourceRecordIdsFromMeta(meta);
        if (parentToolCallId != null) {
            // Subagent path: merge by (kind, parentToolCallId) regardless of
            // position. Parallel subagents interleave chunks; the index lets
            // us reassemble each subagent's stream without garbling.
            const entries = this.textSlotIndex[kind].get(parentToolCallId) ?? [];
            const existingIdx = entries.find((entry) => stringArraysEqual(entry.sourceRecordIds, sourceRecordIds))?.index;
            if (existingIdx !== undefined) {
                const slot = this.slots[existingIdx];
                slot.chunks.push(text);
                if (event.id !== undefined)
                    slot.lastEventId = event.id;
                slot.lastMeta = meta ?? slot.lastMeta;
                slot.lastEnvelopeMeta = event._meta ?? slot.lastEnvelopeMeta;
                slot.lastTurn = captureTurnFields(event, slot.lastTurn);
                slot.lastSessionId = captureSessionId(event) ?? slot.lastSessionId;
            }
            else {
                entries.push({ sourceRecordIds, index: this.slots.length });
                this.textSlotIndex[kind].set(parentToolCallId, entries);
                this.slots.push({
                    kind,
                    parentToolCallId,
                    chunks: [text],
                    sourceRecordIds,
                    lastEventId: event.id ?? 0,
                    lastMeta: meta,
                    lastEnvelopeMeta: event._meta,
                    lastTurn: captureTurnFields(event),
                    lastSessionId: captureSessionId(event),
                });
            }
        }
        else {
            // Top-level path: merge only consecutive same-kind chunks that
            // also have no parentToolCallId. Preserves text segmentation
            // around tool calls (text before / text after stay separate).
            const lastSlot = this.slots[this.slots.length - 1];
            if (lastSlot &&
                lastSlot.kind === kind &&
                lastSlot.parentToolCallId == null &&
                stringArraysEqual(lastSlot.sourceRecordIds, sourceRecordIds)) {
                lastSlot.chunks.push(text);
                if (event.id !== undefined)
                    lastSlot.lastEventId = event.id;
                lastSlot.lastMeta = meta ?? lastSlot.lastMeta;
                lastSlot.lastEnvelopeMeta = event._meta ?? lastSlot.lastEnvelopeMeta;
                lastSlot.lastTurn = captureTurnFields(event, lastSlot.lastTurn);
                lastSlot.lastSessionId =
                    captureSessionId(event) ?? lastSlot.lastSessionId;
            }
            else {
                this.slots.push({
                    kind,
                    parentToolCallId: undefined,
                    chunks: [text],
                    sourceRecordIds,
                    lastEventId: event.id ?? 0,
                    lastMeta: meta,
                    lastEnvelopeMeta: event._meta,
                    lastTurn: captureTurnFields(event),
                    lastSessionId: captureSessionId(event),
                });
            }
        }
    }
    compactCurrentTurn(boundaryEvent) {
        const compacted = [];
        for (const slot of this.slots) {
            switch (slot.kind) {
                case 'text':
                case 'thought':
                    compacted.push(makeMergedSessionUpdateEvent(slot.kind === 'text'
                        ? 'agent_message_chunk'
                        : 'agent_thought_chunk', slot.chunks.join(''), slot.lastEventId, slot.lastMeta, slot.lastEnvelopeMeta, slot.lastTurn, slot.lastSessionId));
                    break;
                case 'tool':
                case 'misc':
                case 'latestWins':
                    compacted.push(slot.event);
                    break;
                default:
                    break;
            }
        }
        compacted.push(boundaryEvent);
        this.addReplaySegment(compacted, 1);
        this.resetJournal();
        this.slots = [];
        this.toolSlotIndex.clear();
        this.clearTextSlotIndex();
    }
    recordLastEventId(event) {
        if (event.id !== undefined) {
            this.lastEventId = event.id;
        }
    }
    resetJournal() {
        this.liveJournal = [];
        this.journalEntryBytes = [];
        this.journalEntryEvents = [];
        this.journalTotalBytes = 0;
        this.journalTotalEvents = 0;
        this.journalTruncatedEvents = 0;
        this.liveJournalTextSegment = undefined;
    }
    addReplaySegment(events, turnCount) {
        if (events.length === 0)
            return;
        const bytes = events.reduce(
        // Live events passed the publish-time serializability gate, but the
        // seed paths (persisted transcripts) bypass it — log a diagnostic
        // and count 0 so a single unserializable record can't wedge the
        // replay-window accounting.
        (sum, event) => {
            const size = serializedBridgeEventByteLength(event);
            if (size === undefined) {
                logEventSizingFailed(event.type);
                return sum;
            }
            return sum + size;
        }, 0);
        this.replaySegments.push({ events: events.slice(), bytes, turnCount });
        this.replayBytes += bytes;
        this.enforceReplayWindow();
    }
    enforceReplayWindow() {
        let droppedSegmentCount = 0;
        let droppedBytes = 0;
        let droppedEvents = 0;
        let droppedTurns = 0;
        let lastDroppedRecordId;
        while (this.replayBytes > this.maxReplayBytes &&
            this.activeReplaySegmentCount() > 1) {
            const dropped = this.replaySegments[this.replaySegmentStart];
            this.replaySegmentStart += 1;
            droppedSegmentCount += 1;
            droppedBytes += dropped.bytes;
            droppedEvents += dropped.events.length;
            droppedTurns += dropped.turnCount;
            this.replayBytes -= dropped.bytes;
            this.truncatedEvents += dropped.events.length;
            this.truncatedTurns += dropped.turnCount;
            const droppedRecordId = lastRecordIdIn(dropped.events);
            if (droppedRecordId !== undefined) {
                lastDroppedRecordId = droppedRecordId;
            }
        }
        if (droppedSegmentCount > 0) {
            // Freeze the pagination anchor at the first eviction so later
            // ingests don't move it. Prefer the FIRST retained recordId — the
            // eviction boundary itself — so `beforeRecordId` fetches exactly
            // the dropped records with no overlap against the retained window.
            // Only when the retained window carries no recordId at all (the
            // live-journal-overflow fallback this anchor exists for) fall back
            // to the last dropped recordId, which still reaches the older
            // history without touching the recordId-less retained window.
            // Using the pre-scanned `activeRecordId` (last recordId across ALL
            // seed events) here was wrong: when a retained segment carried it,
            // the anchor sat inside the retained window and `beforeRecordId`
            // re-fetched records the client already displays, duplicating
            // transcript blocks (prepend has no dedup).
            this.replayAnchorRecordId ??=
                this.firstRetainedReplayRecordId() ?? lastDroppedRecordId;
            this.compactReplaySegmentQueueIfNeeded();
            this.notifyReplayWindowEviction({
                droppedBytes,
                droppedEvents,
                droppedSegments: droppedSegmentCount,
                droppedTurns,
                maxBytes: this.maxReplayBytes,
                retainedBytes: this.replayBytes,
                retainedEvents: this.flattenReplaySegments().length,
            });
        }
    }
    firstRetainedReplayRecordId() {
        for (let i = this.replaySegmentStart; i < this.replaySegments.length; i++) {
            const recordId = lastRecordIdIn(this.replaySegments[i].events);
            if (recordId !== undefined)
                return recordId;
        }
        return undefined;
    }
    flattenReplaySegments() {
        return this.replaySegments
            .slice(this.replaySegmentStart)
            .flatMap((segment) => segment.events);
    }
    activeReplaySegmentCount() {
        return this.replaySegments.length - this.replaySegmentStart;
    }
    compactReplaySegmentQueueIfNeeded() {
        if (this.replaySegmentStart < REPLAY_SEGMENT_COMPACT_THRESHOLD)
            return;
        this.replaySegments.splice(0, this.replaySegmentStart);
        this.replaySegmentStart = 0;
    }
    notifyReplayWindowEviction(eviction) {
        try {
            this.onReplayWindowEviction?.(eviction);
        }
        catch {
            // Best-effort diagnostic; eviction accounting must not break replay.
        }
    }
    makeHistoryTruncatedEvent(retainedEvents) {
        return {
            v: EVENT_SCHEMA_VERSION,
            type: 'history_truncated',
            data: {
                reason: 'replay_window_exceeded',
                truncatedEvents: this.truncatedEvents,
                retainedEvents,
                maxBytes: this.maxReplayBytes,
                ...(this.truncatedTurns > 0
                    ? { truncatedTurns: this.truncatedTurns }
                    : {}),
                // Pagination anchor for clients whose retained window lost every
                // turn-boundary event (e.g. live-journal truncation during one
                // long in-flight turn). Uses the eviction-time anchor, not
                // `activeRecordId`, so a post-seed `ingest()` can't push it past
                // records the client already displays. Undefined when no recordId
                // was observed before the first eviction — the field is
                // intentionally omitted in that case so old clients continue to
                // validate the marker shape.
                ...(this.replayAnchorRecordId !== undefined
                    ? { recordId: this.replayAnchorRecordId }
                    : {}),
                fullTranscriptAvailable: true,
            },
        };
    }
    resetReplayWindow() {
        this.replaySegments = [];
        this.replaySegmentStart = 0;
        this.replayBytes = 0;
        this.truncatedEvents = 0;
        this.truncatedTurns = 0;
        this.replayAnchorRecordId = undefined;
    }
    clearTextSlotIndex() {
        this.textSlotIndex.text.clear();
        this.textSlotIndex.thought.clear();
    }
}
function isLiveJournalTextSegment(entry) {
    return 'firstEvent' in entry;
}
function liveJournalTextChunk(event) {
    if (event.type !== 'session_update')
        return undefined;
    const data = event.data;
    const sessionUpdate = data?.update?.sessionUpdate;
    if (sessionUpdate !== 'agent_message_chunk' &&
        sessionUpdate !== 'agent_thought_chunk') {
        return undefined;
    }
    if (!hasOnlyModeledChunkKeys(data)) {
        return undefined;
    }
    if (hasDiscreteMessageMeta(data?.update?._meta) ||
        hasUnmodeledTextMeta(data?.update?._meta)) {
        return undefined;
    }
    const content = data?.update?.content;
    if (content?.type !== 'text' || typeof content.text !== 'string') {
        return undefined;
    }
    return {
        sessionUpdate,
        text: content.text,
        sourceRecordIds: extractSourceRecordIdsFromMeta(data?.update?._meta),
        parentToolCallId: extractParentToolCallIdFromMeta(data?.update?._meta),
    };
}
// `mergeLiveJournalTextEvent` rebuilds a merged entry by spread-merging
// the segment's first and last source events, so only chunks whose data,
// update, and content carry exactly the modeled keys can join a segment —
// extra data/update keys would leak into the merged aggregate, and extra
// content keys (ACP TextContent `annotations` / `_meta`) would be dropped
// by the `{ type, text }` content rebuild, so such chunks stay raw entries.
function hasOnlyModeledChunkKeys(data) {
    if (!data || !data.update)
        return false;
    const content = data.update.content;
    return (Object.keys(data).every((key) => key === 'sessionId' || key === 'update') &&
        Object.keys(data.update).every((key) => key === 'sessionUpdate' || key === 'content' || key === '_meta') &&
        (content === undefined ||
            (typeof content === 'object' &&
                content !== null &&
                Object.keys(content).every((key) => key === 'type' || key === 'text'))));
}
function mergeLiveJournalTextEvent(existing, incoming, chunks) {
    const existingData = existing.data;
    const incomingData = incoming.data;
    return {
        ...existing,
        ...incoming,
        data: {
            ...existingData,
            ...incomingData,
            update: {
                ...existingData.update,
                ...incomingData.update,
                content: { type: 'text', text: chunks.join('') },
            },
        },
    };
}
function makeMergedSessionUpdateEvent(sessionUpdate, text, eventId, meta, envelopeMeta, turn, sessionId) {
    return {
        id: eventId || undefined,
        v: EVENT_SCHEMA_VERSION,
        type: 'session_update',
        // Re-stamp prompt/originator attribution captured from the source
        // chunks — clients rebuilding state from a compacted snapshot need
        // them for prompt correlation and originator filtering. Present only
        // when the source events carried them ("present only if set" style).
        ...(turn?.promptId !== undefined ? { promptId: turn.promptId } : {}),
        ...(turn?.originatorClientId !== undefined
            ? { originatorClientId: turn.originatorClientId }
            : {}),
        ...(envelopeMeta !== undefined ? { _meta: envelopeMeta } : {}),
        data: {
            ...(sessionId !== undefined ? { sessionId } : {}),
            update: {
                sessionUpdate,
                content: { type: 'text', text },
                ...(meta != null ? { _meta: meta } : {}),
            },
        },
    };
}
/**
 * Field-level merge of `promptId`/`originatorClientId` from an incoming
 * event with an earlier capture. Each field falls back independently so a
 * chunk carrying only one field does not silently drop the other from the
 * previous capture (mirrors the tool_call path's per-field `??` merge).
 */
function captureTurnFields(event, previous) {
    const promptId = event.promptId ?? previous?.promptId;
    const originatorClientId = event.originatorClientId ?? previous?.originatorClientId;
    if (promptId === undefined && originatorClientId === undefined) {
        return undefined;
    }
    return {
        ...(promptId !== undefined ? { promptId } : {}),
        ...(originatorClientId !== undefined ? { originatorClientId } : {}),
    };
}
/** `data.sessionId` of an event when present and a string. */
function captureSessionId(event) {
    const sessionId = event.data
        ?.sessionId;
    return typeof sessionId === 'string' ? sessionId : undefined;
}
function normalizeToolCallType(event) {
    const data = event.data;
    if (data?.update?.sessionUpdate === 'tool_call_update') {
        return {
            ...event,
            data: {
                ...data,
                update: { ...data.update, sessionUpdate: 'tool_call' },
            },
        };
    }
    return event;
}
function extractParentToolCallIdFromMeta(meta) {
    if (typeof meta === 'object' && meta !== null) {
        const val = meta['parentToolCallId'];
        return typeof val === 'string' && val.length > 0 ? val : undefined;
    }
    return undefined;
}
function extractSourceRecordIdsFromMeta(meta) {
    if (typeof meta !== 'object' || meta === null)
        return undefined;
    const transcript = meta['qwenTranscript'];
    if (typeof transcript !== 'object' || transcript === null)
        return undefined;
    const ids = transcript['sourceRecordIds'];
    if (!Array.isArray(ids))
        return undefined;
    const normalized = [
        ...new Set(ids.filter((id) => typeof id === 'string')),
    ];
    return normalized.length > 0 ? normalized : undefined;
}
function stringArraysEqual(left, right) {
    if (left === right)
        return true;
    if (!left || !right || left.length !== right.length)
        return false;
    return left.every((value, index) => value === right[index]);
}
function hasDiscreteMessageMeta(meta) {
    return (typeof meta === 'object' &&
        meta !== null &&
        meta['qwenDiscreteMessage'] === true);
}
function hasOnlyTimestampEnvelopeMeta(meta) {
    if (meta === undefined)
        return true;
    if (typeof meta !== 'object' || meta === null)
        return false;
    return Object.keys(meta).every((key) => key === 'timestamp' || key === 'serverTimestamp');
}
function hasUnmodeledTextMeta(meta) {
    if (meta === undefined)
        return false;
    if (typeof meta !== 'object' || meta === null)
        return true;
    const record = meta;
    for (const [key, value] of Object.entries(record)) {
        if (key === 'timestamp' || key === 'serverTimestamp') {
            continue;
        }
        if (key === 'parentToolCallId') {
            // Empty strings model "no parent": extractParentToolCallIdFromMeta
            // ignores them, so both replay surfaces agree the chunk is top-level.
            if (typeof value !== 'string')
                return true;
            continue;
        }
        if (key === 'subagentType') {
            // Display label SubAgentTracker pairs with parentToolCallId. The
            // completed-turn path merges by parentToolCallId alone and lets the
            // latest meta carry the label, so the live view must match instead
            // of splitting on it.
            if (typeof value !== 'string')
                return true;
            continue;
        }
        if (key === 'qwenTranscript') {
            if (typeof value !== 'object' || value === null)
                return true;
            const transcript = value;
            for (const [field, fieldValue] of Object.entries(transcript)) {
                if (field === 'sourceRecordIds') {
                    if (!Array.isArray(fieldValue) ||
                        fieldValue.some((id) => typeof id !== 'string')) {
                        return true;
                    }
                    continue;
                }
                if (field === 'planToolCallId') {
                    if (typeof fieldValue !== 'string')
                        return true;
                    continue;
                }
                return true;
            }
            continue;
        }
        return true;
    }
    return false;
}
function mergeToolCallEvent(existing, incoming) {
    const existingData = existing.data;
    const incomingData = incoming.data;
    const existingUpdate = existingData?.update ?? {};
    const incomingUpdate = incomingData?.update ?? {};
    const merged = { ...existingUpdate };
    for (const [key, value] of Object.entries(incomingUpdate)) {
        if (value !== undefined && value !== null) {
            merged[key] = value;
        }
    }
    const updateMeta = mergeTranscriptUpdateMeta(existingUpdate['_meta'], incomingUpdate['_meta']);
    if (updateMeta !== undefined)
        merged['_meta'] = updateMeta;
    // Always use 'tool_call' as the compacted type
    merged['sessionUpdate'] = 'tool_call';
    const mergedMeta = existing._meta || incoming._meta
        ? { ...(existing._meta ?? {}), ...(incoming._meta ?? {}) }
        : undefined;
    // Latest-wins attribution, mirroring `id`: the folded tool_call keeps
    // the most recent prompt/originator stamp so resync consumers can still
    // correlate it to its turn ("present only if set" style).
    const promptId = incoming.promptId ?? existing.promptId;
    const originatorClientId = incoming.originatorClientId ?? existing.originatorClientId;
    return {
        id: incoming.id ?? existing.id,
        v: EVENT_SCHEMA_VERSION,
        type: 'session_update',
        ...(promptId !== undefined ? { promptId } : {}),
        ...(originatorClientId !== undefined ? { originatorClientId } : {}),
        ...(mergedMeta ? { _meta: mergedMeta } : {}),
        data: {
            ...existingData,
            ...incomingData,
            update: merged,
        },
    };
}
function mergeTranscriptUpdateMeta(existing, incoming) {
    const existingRecord = typeof existing === 'object' && existing !== null
        ? existing
        : undefined;
    const incomingRecord = typeof incoming === 'object' && incoming !== null
        ? incoming
        : undefined;
    if (!existingRecord && !incomingRecord)
        return undefined;
    const sourceRecordIds = [
        ...new Set([
            ...(extractSourceRecordIdsFromMeta(existingRecord) ?? []),
            ...(extractSourceRecordIdsFromMeta(incomingRecord) ?? []),
        ]),
    ];
    return {
        ...(existingRecord ?? {}),
        ...(incomingRecord ?? {}),
        ...(sourceRecordIds.length > 0
            ? { qwenTranscript: { sourceRecordIds } }
            : {}),
    };
}
//# sourceMappingURL=compactionEngine.js.map