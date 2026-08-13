/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { parseGoalSnapshotV2, parseGoalStateCause, } from '@qwen-code/qwen-code-core';
import { projectAcpToolResultUpdate } from './acp-tool-result-text-projection.js';
import { HistoryReplayer } from './history-replayer.js';
export function createReplayCumulativeUsage() {
    return {
        promptTokens: 0,
        cachedTokens: 0,
        candidateTokens: 0,
        apiTimeMs: 0,
    };
}
export function copyCumulativeUsage(target, source) {
    target.promptTokens = source.promptTokens;
    target.cachedTokens = source.cachedTokens;
    target.candidateTokens = source.candidateTokens;
    target.apiTimeMs = source.apiTimeMs;
}
function isObjectRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isCumulativeUsage(value) {
    if (!isObjectRecord(value))
        return false;
    return (typeof value['promptTokens'] === 'number' &&
        Number.isFinite(value['promptTokens']) &&
        typeof value['cachedTokens'] === 'number' &&
        Number.isFinite(value['cachedTokens']) &&
        typeof value['candidateTokens'] === 'number' &&
        Number.isFinite(value['candidateTokens']) &&
        typeof value['apiTimeMs'] === 'number' &&
        Number.isFinite(value['apiTimeMs']));
}
function isPendingReplayToolCall(value) {
    if (!isObjectRecord(value))
        return false;
    return (typeof value['callId'] === 'string' &&
        typeof value['toolName'] === 'string' &&
        (value['timestamp'] === undefined ||
            typeof value['timestamp'] === 'string') &&
        typeof value['recordId'] === 'string');
}
function isCurrentPendingReplayToolCall(value) {
    if (!isObjectRecord(value))
        return false;
    return (typeof value['callId'] === 'string' &&
        typeof value['toolName'] === 'string' &&
        typeof value['sourceRecordId'] === 'string' &&
        (value['sourceTimestamp'] === undefined ||
            typeof value['sourceTimestamp'] === 'string'));
}
function parseTranscriptReplayState(replay, logger) {
    if (!isObjectRecord(replay)) {
        return {
            pendingToolCalls: [],
            cumulativeUsage: createReplayCumulativeUsage(),
        };
    }
    if ('v' in replay && replay['v'] !== 1) {
        throw new TypeError('Unsupported transcript replay state version.');
    }
    const rawPending = replay['pendingToolCalls'];
    const pendingToolCalls = Array.isArray(rawPending)
        ? rawPending.flatMap((pending) => {
            if (isPendingReplayToolCall(pending))
                return [pending];
            if (isCurrentPendingReplayToolCall(pending)) {
                return [
                    {
                        callId: pending.callId,
                        toolName: pending.toolName,
                        recordId: pending.sourceRecordId,
                        ...(pending.sourceTimestamp
                            ? { timestamp: pending.sourceTimestamp }
                            : {}),
                    },
                ];
            }
            return [];
        })
        : [];
    if (logger &&
        Array.isArray(rawPending) &&
        pendingToolCalls.length !== rawPending.length) {
        const dropped = rawPending.length - pendingToolCalls.length;
        logger.warn(`[transcript] replay state dropped ${dropped} of ${rawPending.length} malformed pending tool calls`);
    }
    const cumulativeUsage = isCumulativeUsage(replay['cumulativeUsage'])
        ? { ...replay['cumulativeUsage'] }
        : createReplayCumulativeUsage();
    const rawGoalState = replay['goalState'];
    const goalState = rawGoalState === undefined ? undefined : parseGoalSnapshotV2(rawGoalState);
    if (logger && rawGoalState !== undefined && !goalState) {
        logger.warn('[transcript] replay state dropped a malformed Goal state');
    }
    const rawGoalCause = replay['goalCause'];
    const goalCause = rawGoalCause === undefined ? undefined : parseGoalStateCause(rawGoalCause);
    if (logger && rawGoalCause !== undefined && !goalCause) {
        logger.warn('[transcript] replay state dropped a malformed Goal cause');
    }
    return {
        pendingToolCalls,
        cumulativeUsage,
        ...(goalState ? { goalState } : {}),
        ...(goalCause ? { goalCause } : {}),
    };
}
function replayContext(sessionId, updates, cumulativeUsage, config) {
    let activeRecordId = null;
    return {
        sessionId,
        sendUpdate: async (update) => {
            const projectedUpdate = projectAcpToolResultUpdate(update);
            if (activeRecordId === null) {
                updates.push(projectedUpdate);
                return;
            }
            const record = projectedUpdate;
            const meta = isObjectRecord(record['_meta']) ? record['_meta'] : {};
            updates.push({
                ...record,
                _meta: { ...meta, 'qwen.session.recordId': activeRecordId },
            });
        },
        setActiveRecordId: (recordId) => {
            activeRecordId = recordId;
        },
        cumulativeUsage,
        ...(config ? { config } : {}),
    };
}
export async function collectHistoryReplayUpdates({ sessionId, config, records, gaps, cumulativeUsage, logger, }) {
    const updates = [];
    try {
        await new HistoryReplayer(replayContext(sessionId, updates, cumulativeUsage, config)).replay(records, gaps);
    }
    catch (error) {
        const replayError = error instanceof Error ? error.message : String(error);
        logger?.warn('[historyReplay] History replay failed for session %s (partial updates: %d):', sessionId, updates.length, error);
        return { updates: liftSessionUpdateTimestamps(updates), replayError };
    }
    return { updates: liftSessionUpdateTimestamps(updates) };
}
export function liftSessionUpdateTimestamps(updates) {
    return updates.map((update) => {
        const record = update;
        const meta = record['_meta'];
        const timestamp = isObjectRecord(meta) ? meta['timestamp'] : undefined;
        return typeof timestamp === 'number' || typeof timestamp === 'string'
            ? { ...record, timestamp }
            : update;
    });
}
export async function replayTranscriptRecordPage({ sessionId, page, config, encodeCursor, logger, finalizeDangling = true, }) {
    const state = parseTranscriptReplayState(page.replay, logger);
    const updates = [];
    const replayer = new HistoryReplayer(replayContext(sessionId, updates, state.cumulativeUsage, config));
    let replayState;
    let replayError;
    try {
        const replayPageState = await replayer.replayPage(page.records, {
            pendingToolCalls: page.direction === 'backward' ? [] : state.pendingToolCalls,
            finalizeDangling: finalizeDangling && (page.direction === 'backward' || !page.hasMore),
            gaps: page.gaps,
            ...(state.goalState ? { goalState: state.goalState } : {}),
            ...(state.goalCause ? { goalCause: state.goalCause } : {}),
        });
        replayState = replayPageState.replay;
    }
    catch (error) {
        logger?.warn('[historyReplay] Paged history replay failed for session %s (partial updates: %d):', sessionId, updates.length, error);
        replayState = replayer.getReplayState();
        replayError = 'Replay conversion failed for this page';
    }
    const nextCursor = page.nextCursorState && replayError === undefined
        ? encodeCursor({
            ...page.nextCursorState,
            ...(page.direction === 'backward' ? {} : { replay: replayState }),
        })
        : undefined;
    return {
        updates: liftSessionUpdateTimestamps(updates),
        ...(nextCursor ? { nextCursor } : {}),
        hasMore: replayError === undefined && page.hasMore,
        startTime: page.startTime,
        lastUpdated: page.lastUpdated,
        ...(replayError ? { partial: true, replayError } : {}),
    };
}
//# sourceMappingURL=history-replay-page.js.map