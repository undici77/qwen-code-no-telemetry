/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { LOAD_REPLAY_META_KEY } from '@qwen-code/acp-bridge/bridgeTypes';
export const LARGE_PIPE_FRAME_THRESHOLD_BYTES = 256 * 1024;
export const LARGE_PIPE_FRAME_LOG_LIMIT = 50;
export const LARGE_PIPE_FRAME_LOG_WINDOW_MS = 60_000;
export const LARGE_PIPE_FRAME_EVENT_NAME = 'qwen-code.daemon.pipe.large_frame';
const MAX_ATTR_STRING_LENGTH = 128;
const MAX_CONTENT_DEPTH = 32;
const MAX_JSON_APPROX_DEPTH = 32;
const MAX_RAW_OUTPUT_APPROX_BYTES = LARGE_PIPE_FRAME_THRESHOLD_BYTES;
const MAX_SUMMARIZED_UPDATES = 500;
const SUMMARIZED_UPDATE_PREFIX_COUNT = Math.ceil(MAX_SUMMARIZED_UPDATES / 2);
const SUMMARIZED_UPDATE_SUFFIX_COUNT = MAX_SUMMARIZED_UPDATES - SUMMARIZED_UPDATE_PREFIX_COUNT;
export function createLargePipeFrameObserver(options) {
    const thresholdBytes = options.thresholdBytes ?? LARGE_PIPE_FRAME_THRESHOLD_BYTES;
    const windowMs = options.windowMs ?? LARGE_PIPE_FRAME_LOG_WINDOW_MS;
    const logLimit = options.logLimit ?? LARGE_PIPE_FRAME_LOG_LIMIT;
    const now = options.now ?? Date.now;
    let windowStartedAt = now();
    let emittedInWindow = 0;
    let suppressedCount = 0;
    let suppressedWindowStartMs;
    return (observation) => {
        try {
            if (observation.bytes < thresholdBytes)
                return;
            const currentTime = now();
            if (currentTime - windowStartedAt >= windowMs) {
                windowStartedAt = currentTime;
                emittedInWindow = 0;
            }
            if (emittedInWindow >= logLimit) {
                suppressedCount += 1;
                suppressedWindowStartMs ??= windowStartedAt;
                return;
            }
            const context = classifyLargePipeFrame(observation, thresholdBytes);
            if (!context)
                return;
            if (suppressedCount > 0) {
                context['suppressedCount'] = suppressedCount;
                if (suppressedWindowStartMs !== undefined) {
                    context['suppressedWindowStartMs'] = suppressedWindowStartMs;
                }
                suppressedCount = 0;
                suppressedWindowStartMs = undefined;
            }
            emittedInWindow += 1;
            try {
                options.daemonLog.warn('large ACP pipe frame observed', context);
            }
            catch {
                // Observability must not affect transport behavior.
            }
            try {
                options.emitTelemetryLog?.('Large ACP pipe frame observed.', context, {
                    eventName: LARGE_PIPE_FRAME_EVENT_NAME,
                });
            }
            catch {
                // Observability must not affect transport behavior.
            }
        }
        catch {
            // Observability must not affect transport behavior.
        }
    };
}
export function classifyLargePipeFrame(observation, thresholdBytes = LARGE_PIPE_FRAME_THRESHOLD_BYTES) {
    if (observation.bytes < thresholdBytes)
        return undefined;
    const message = asRecord(observation.message);
    const messageKind = message ? getMessageKind(message) : 'unknown';
    const method = message ? stringValue(message['method']) : undefined;
    const classification = classifySource(message, messageKind, method);
    const context = {
        direction: observation.direction,
        bytes: observation.bytes,
        thresholdBytes,
        messageKind,
        sourceClass: classification.sourceClass,
    };
    addString(context, 'method', method);
    if (classification.sourceClass === 'session_update_notification') {
        addUpdateSummary(context, summarizeUpdate(classification.update));
    }
    else if (classification.sourceClass === 'load_session_bulk_replay_response') {
        addUpdatesSummary(context, classification.replay?.['updates']);
    }
    else if (classification.sourceClass === 'load_updates_response') {
        addUpdatesSummary(context, classification.result?.['updates']);
    }
    return context;
}
function classifySource(message, messageKind, method) {
    if (!message)
        return { sourceClass: 'unknown' };
    const params = asRecord(message['params']);
    const update = asRecord(params?.['update']);
    if (messageKind === 'notification' && method === 'session/update' && update) {
        return { sourceClass: 'session_update_notification', update };
    }
    if (messageKind === 'response') {
        const replay = getBulkReplay(message);
        if (replay) {
            return { sourceClass: 'load_session_bulk_replay_response', replay };
        }
        const result = asRecord(message['result']);
        if (isLoadUpdatesResult(result)) {
            return { sourceClass: 'load_updates_response', result };
        }
        return { sourceClass: 'jsonrpc_response' };
    }
    if (method)
        return { sourceClass: 'jsonrpc_request' };
    return { sourceClass: 'unknown' };
}
function getMessageKind(message) {
    const method = stringValue(message['method']);
    const hasId = Object.hasOwn(message, 'id');
    if (method)
        return hasId ? 'request' : 'notification';
    if (hasId &&
        (Object.hasOwn(message, 'result') || Object.hasOwn(message, 'error'))) {
        return 'response';
    }
    return 'unknown';
}
function getBulkReplay(message) {
    const result = asRecord(message?.['result']);
    const meta = asRecord(result?.['_meta']);
    return asRecord(meta?.[LOAD_REPLAY_META_KEY]);
}
function isLoadUpdatesResult(result) {
    if (!Array.isArray(result?.['updates']))
        return false;
    return (typeof result['startTime'] === 'string' ||
        typeof result['lastUpdated'] === 'string' ||
        typeof result['replayError'] === 'string' ||
        typeof result['partial'] === 'boolean');
}
function addUpdatesSummary(context, updates) {
    if (!Array.isArray(updates))
        return;
    context['updateCount'] = updates.length;
    const sampledIndexes = sampleUpdateIndexes(updates.length);
    if (sampledIndexes.length < updates.length) {
        context['summarizedUpdateCount'] = sampledIndexes.length;
        context['summarizedUpdateStrategy'] = 'prefix_and_suffix';
    }
    const summary = {};
    for (const index of sampledIndexes) {
        mergeUpdateSummary(summary, summarizeUpdate(asRecord(updates[index])));
    }
    addUpdateSummary(context, summary);
}
function sampleUpdateIndexes(updateCount) {
    if (updateCount <= MAX_SUMMARIZED_UPDATES) {
        return Array.from({ length: updateCount }, (_, index) => index);
    }
    const indexes = [];
    for (let i = 0; i < SUMMARIZED_UPDATE_PREFIX_COUNT; i += 1) {
        indexes.push(i);
    }
    for (let i = updateCount - SUMMARIZED_UPDATE_SUFFIX_COUNT; i < updateCount; i += 1) {
        indexes.push(i);
    }
    return indexes;
}
function summarizeUpdate(update) {
    if (!update)
        return {};
    const meta = asRecord(update['_meta']);
    const summary = {};
    summary.sessionUpdate = stringValue(update['sessionUpdate']);
    summary.toolName = stringValue(meta?.['toolName']);
    summary.toolProvenance = stringValue(meta?.['provenance']);
    const contentBytes = contentTextBytes(update['content']);
    if (contentBytes > 0) {
        summary.maxContentTextBytes = contentBytes;
    }
    summary.maxObservedUpdateBytes = contentBytes;
    if (Object.hasOwn(update, 'rawOutput')) {
        const rawOutput = update['rawOutput'];
        summary.rawOutputKind = rawOutputKind(rawOutput);
        if (typeof rawOutput === 'string') {
            const rawOutputTextBytes = Buffer.byteLength(rawOutput, 'utf8');
            summary.maxRawOutputTextBytes = rawOutputTextBytes;
            summary.maxRawOutputObservedBytes = rawOutputTextBytes;
            summary.maxObservedUpdateBytes = Math.max(summary.maxObservedUpdateBytes, rawOutputTextBytes);
        }
        else {
            const rawOutputApprox = approximateJsonByteLength(rawOutput);
            if (rawOutputApprox !== undefined) {
                summary.maxRawOutputApproxBytes = rawOutputApprox.bytes;
                if (rawOutputApprox.capped) {
                    summary.maxRawOutputApproxBytesCapped = true;
                }
                summary.maxRawOutputObservedBytes = rawOutputApprox.bytes;
                summary.maxObservedUpdateBytes = Math.max(summary.maxObservedUpdateBytes, rawOutputApprox.bytes);
            }
        }
    }
    return summary;
}
function mergeUpdateSummary(target, next) {
    if (next.sessionUpdate &&
        target.sessionUpdate &&
        next.sessionUpdate !== target.sessionUpdate) {
        target.mixedSessionUpdate = true;
    }
    if (next.mixedSessionUpdate) {
        target.mixedSessionUpdate = true;
    }
    if (next.maxObservedUpdateBytes !== undefined &&
        (target.maxObservedUpdateBytes === undefined ||
            next.maxObservedUpdateBytes > target.maxObservedUpdateBytes)) {
        target.maxObservedUpdateBytes = next.maxObservedUpdateBytes;
        target.sessionUpdate = next.sessionUpdate ?? target.sessionUpdate;
        target.toolName = next.toolName ?? target.toolName;
        target.toolProvenance = next.toolProvenance ?? target.toolProvenance;
    }
    if (next.maxContentTextBytes !== undefined &&
        (target.maxContentTextBytes === undefined ||
            next.maxContentTextBytes > target.maxContentTextBytes)) {
        target.maxContentTextBytes = next.maxContentTextBytes;
    }
    if (next.maxRawOutputTextBytes !== undefined &&
        (target.maxRawOutputTextBytes === undefined ||
            next.maxRawOutputTextBytes > target.maxRawOutputTextBytes)) {
        target.maxRawOutputTextBytes = next.maxRawOutputTextBytes;
    }
    if (next.maxRawOutputApproxBytes !== undefined &&
        (target.maxRawOutputApproxBytes === undefined ||
            next.maxRawOutputApproxBytes > target.maxRawOutputApproxBytes)) {
        target.maxRawOutputApproxBytes = next.maxRawOutputApproxBytes;
    }
    if (next.maxRawOutputApproxBytesCapped) {
        target.maxRawOutputApproxBytesCapped = true;
    }
    if (next.maxRawOutputObservedBytes !== undefined &&
        (target.maxRawOutputObservedBytes === undefined ||
            next.maxRawOutputObservedBytes > target.maxRawOutputObservedBytes)) {
        target.maxRawOutputObservedBytes = next.maxRawOutputObservedBytes;
        target.rawOutputKind = next.rawOutputKind;
    }
}
function addUpdateSummary(context, summary) {
    addString(context, 'sessionUpdate', summary.sessionUpdate);
    addString(context, 'toolName', summary.toolName);
    addString(context, 'toolProvenance', summary.toolProvenance);
    if (summary.mixedSessionUpdate)
        context['mixedSessionUpdate'] = true;
    addNumber(context, 'maxContentTextBytes', summary.maxContentTextBytes);
    addNumber(context, 'maxRawOutputTextBytes', summary.maxRawOutputTextBytes);
    addNumber(context, 'maxRawOutputApproxBytes', summary.maxRawOutputApproxBytes);
    if (summary.maxRawOutputApproxBytesCapped) {
        context['maxRawOutputApproxBytesCapped'] = true;
    }
    addString(context, 'rawOutputKind', summary.rawOutputKind);
}
function contentTextBytes(value, depth = 0) {
    if (depth > MAX_CONTENT_DEPTH)
        return 0;
    if (typeof value === 'string')
        return Buffer.byteLength(value, 'utf8');
    if (Array.isArray(value)) {
        return value.reduce((sum, item) => sum + contentTextBytes(item, depth + 1), 0);
    }
    const record = asRecord(value);
    if (!record)
        return 0;
    let total = 0;
    const text = stringValue(record['text']);
    if (text)
        total += Buffer.byteLength(text, 'utf8');
    if (Object.hasOwn(record, 'content')) {
        total += contentTextBytes(record['content'], depth + 1);
    }
    return total;
}
function approximateJsonByteLength(value) {
    const state = {
        budget: MAX_RAW_OUTPUT_APPROX_BYTES,
        bytes: 0,
        capped: false,
        seen: new WeakSet(),
    };
    if (!addJsonValueBytes(value, state, 0))
        return undefined;
    return { bytes: state.bytes, capped: state.capped };
}
function addJsonValueBytes(value, state, depth) {
    if (state.capped)
        return true;
    switch (typeof value) {
        case 'string':
            addJsonStringBytes(value, state);
            return true;
        case 'number':
            addJsonBytes(state, Number.isFinite(value) ? String(value).length : 4);
            return true;
        case 'boolean':
            addJsonBytes(state, value ? 4 : 5);
            return true;
        case 'object':
            if (value === null) {
                addJsonBytes(state, 4);
                return true;
            }
            if (depth >= MAX_JSON_APPROX_DEPTH) {
                capJsonBytes(state);
                return true;
            }
            if (Array.isArray(value)) {
                addJsonArrayBytes(value, state, depth);
            }
            else {
                addJsonObjectBytes(value, state, depth);
            }
            return true;
        default:
            return false;
    }
}
function addJsonArrayBytes(value, state, depth) {
    if (state.seen.has(value)) {
        capJsonBytes(state);
        return;
    }
    state.seen.add(value);
    addJsonBytes(state, 1);
    for (let i = 0; i < value.length && !state.capped; i += 1) {
        if (i > 0)
            addJsonBytes(state, 1);
        if (!addJsonValueBytes(value[i], state, depth + 1)) {
            addJsonBytes(state, 4);
        }
    }
    addJsonBytes(state, 1);
    state.seen.delete(value);
}
function addJsonObjectBytes(value, state, depth) {
    if (state.seen.has(value)) {
        capJsonBytes(state);
        return;
    }
    state.seen.add(value);
    addJsonBytes(state, 1);
    const record = value;
    let propertyCount = 0;
    for (const key in record) {
        if (state.capped)
            break;
        if (!Object.hasOwn(record, key))
            continue;
        const item = record[key];
        if (isOmittedJsonObjectValue(item))
            continue;
        if (propertyCount > 0)
            addJsonBytes(state, 1);
        addJsonStringBytes(key, state);
        addJsonBytes(state, 1);
        if (!addJsonValueBytes(item, state, depth + 1)) {
            addJsonBytes(state, 4);
        }
        propertyCount += 1;
    }
    addJsonBytes(state, 1);
    state.seen.delete(value);
}
function addJsonStringBytes(value, state) {
    addJsonBytes(state, 1);
    if (state.capped)
        return;
    const remainingForContent = Math.max(0, state.budget - state.bytes - 1);
    const sampleLength = Math.min(value.length, remainingForContent);
    const sample = sampleLength < value.length ? value.slice(0, sampleLength) : value;
    addJsonBytes(state, Buffer.byteLength(sample, 'utf8'));
    if (sampleLength < value.length) {
        capJsonBytes(state);
        return;
    }
    addJsonBytes(state, 1);
}
function addJsonBytes(state, bytes) {
    if (state.capped || bytes <= 0)
        return;
    const nextBytes = state.bytes + bytes;
    if (nextBytes >= state.budget) {
        capJsonBytes(state);
        return;
    }
    state.bytes = nextBytes;
}
function capJsonBytes(state) {
    state.bytes = state.budget;
    state.capped = true;
}
function isOmittedJsonObjectValue(value) {
    return (typeof value === 'undefined' ||
        typeof value === 'function' ||
        typeof value === 'symbol');
}
function rawOutputKind(value) {
    if (Array.isArray(value))
        return 'array';
    if (value === null)
        return 'null';
    return typeof value;
}
function addString(context, key, value) {
    if (value === undefined)
        return;
    context[key] =
        value.length > MAX_ATTR_STRING_LENGTH
            ? value.slice(0, MAX_ATTR_STRING_LENGTH)
            : value;
}
function addNumber(context, key, value) {
    if (value !== undefined)
        context[key] = value;
}
function stringValue(value) {
    return typeof value === 'string' ? value : undefined;
}
function asRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? value
        : undefined;
}
//# sourceMappingURL=large-pipe-frame-observer.js.map