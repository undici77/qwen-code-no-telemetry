/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { ToolCallStatus, } from '../types.js';
export function createDaemonTuiReducerState() {
    return { toolCallsById: new Map(), toolCallOrder: [] };
}
function clearDaemonTuiReducerState(state) {
    state.toolCallsById.clear();
    state.toolCallOrder.length = 0;
}
const MAX_TOOL_CALLS = 128;
const MAX_PLAN_ENTRIES = 200;
const MAX_DISPLAY_TEXT_LENGTH = 20_000;
const MAX_UNKNOWN_EVENT_TYPES = 100;
const MAX_UNSUPPORTED_PROTOCOL_VERSIONS = 20;
const STOP_TIMEOUT_MS = 5_000;
const ESC = String.fromCharCode(27);
const OSC_RE = new RegExp(`${ESC}\\][\\s\\S]*?(?:\\x07|${ESC}\\\\)`, 'g');
const DCS_RE = new RegExp(`${ESC}[PX^_][\\s\\S]*?${ESC}\\\\`, 'g');
const CSI_RE = new RegExp(`${ESC}\\[[0-?]*[ -/]*[@-~]`, 'g');
const C1_RE = new RegExp(`${ESC}[@-Z\\\\-_]`, 'g');
const C1_CSI_RE = /\x9b[0-?]*[ -/]*[@-~]/g;
const C1_STRING_RE = /[\x90\x98\x9e\x9f][\s\S]*?\x9c/g;
const BIDI_CONTROL_RE = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
const UNKNOWN_EVENT_TYPES = new Set();
const UNSUPPORTED_PROTOCOL_VERSIONS = new Set();
const debugLogger = createDebugLogger('DAEMON_TUI_ADAPTER');
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function getString(value) {
    return typeof value === 'string' ? value : undefined;
}
function getTextContent(content) {
    if (!isRecord(content)) {
        return undefined;
    }
    return getString(content['text']);
}
function getSessionUpdate(data) {
    if (!isRecord(data) || !isRecord(data['update'])) {
        return undefined;
    }
    return data['update'];
}
function formatPlan(entries) {
    if (!Array.isArray(entries)) {
        return undefined;
    }
    const lines = entries
        .slice(0, MAX_PLAN_ENTRIES)
        .filter(isRecord)
        .map((entry, index) => {
        const content = getString(entry['content']) ?? '';
        const status = getString(entry['status']) ?? 'pending';
        return `${index + 1}. [${sanitizeDisplayText(status)}] ${sanitizeDisplayText(content)}`;
    })
        .filter((line) => line.trim().length > 0);
    return lines.length > 0 ? lines.join('\n') : undefined;
}
function mapToolStatus(status) {
    switch (status) {
        case 'pending':
            return ToolCallStatus.Pending;
        case 'confirming':
            return ToolCallStatus.Confirming;
        case 'in_progress':
        case 'running':
            return ToolCallStatus.Executing;
        case 'completed':
        case 'success':
            return ToolCallStatus.Success;
        case 'failed':
        case 'error':
            return ToolCallStatus.Error;
        case 'canceled':
        case 'cancelled':
            return ToolCallStatus.Canceled;
        default:
            return ToolCallStatus.Error;
    }
}
function sanitizeReason(reason) {
    const withoutAnsi = stripControlSequences(reason);
    let sanitized = '';
    for (const char of withoutAnsi) {
        const code = char.charCodeAt(0);
        if ((code < 32 && code !== 10) || code === 127 || isC1Control(code)) {
            continue;
        }
        sanitized += char;
        if (sanitized.length >= 500) {
            break;
        }
    }
    return sanitized;
}
function sanitizeDisplayText(text) {
    const stripped = stripControlSequences(text);
    let sanitized = '';
    for (const char of stripped) {
        const code = char.charCodeAt(0);
        if ((code < 32 && code !== 9 && code !== 10) ||
            code === 127 ||
            isC1Control(code)) {
            continue;
        }
        sanitized += char;
        if (sanitized.length >= MAX_DISPLAY_TEXT_LENGTH) {
            break;
        }
    }
    return sanitized;
}
function stripControlSequences(value) {
    return value
        .replace(BIDI_CONTROL_RE, '')
        .replace(OSC_RE, '')
        .replace(DCS_RE, '')
        .replace(C1_STRING_RE, '')
        .replace(C1_CSI_RE, '')
        .replace(CSI_RE, '')
        .replace(C1_RE, '');
}
function isC1Control(code) {
    return code >= 0x80 && code <= 0x9f;
}
function sanitizeDaemonValue(value) {
    if (typeof value === 'string') {
        return sanitizeDisplayText(value);
    }
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeDaemonValue(item));
    }
    if (isRecord(value)) {
        return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [
            key,
            sanitizeDaemonValue(entryValue),
        ]));
    }
    return value;
}
function createSanitizedDaemonError(error) {
    const message = sanitizeReason(error instanceof Error ? error.message : String(error));
    return new Error(`Daemon RPC failed: ${message}`);
}
function formatToolResultDisplay(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === 'string') {
        return sanitizeDisplayText(value);
    }
    if (isRecord(value) &&
        (typeof value['fileDiff'] === 'string' ||
            'ansiOutput' in value ||
            value['type'] === 'todo_list' ||
            value['type'] === 'plan_summary' ||
            value['type'] === 'task_execution' ||
            value['type'] === 'mcp_tool_progress')) {
        return sanitizeDaemonValue(value);
    }
    try {
        return sanitizeDisplayText(JSON.stringify(value));
    }
    catch {
        return sanitizeDisplayText(String(value));
    }
}
function formatToolContentText(value) {
    if (!Array.isArray(value)) {
        return undefined;
    }
    const parts = value
        .map((item) => {
        if (!isRecord(item)) {
            return undefined;
        }
        const content = item['content'];
        if (isRecord(content)) {
            const text = getString(content['text']);
            return text === undefined ? undefined : sanitizeDisplayText(text);
        }
        const text = getString(item['text']);
        return text === undefined ? undefined : sanitizeDisplayText(text);
    })
        .filter((part) => part !== undefined && part.length > 0);
    return parts.length > 0 ? parts.join('\n') : undefined;
}
function terminalUpdates(event, reason) {
    const sanitizedReason = sanitizeReason(reason);
    return [
        {
            type: 'disconnected',
            reason: sanitizedReason,
            daemonEventId: event.id,
        },
        {
            type: 'history',
            item: {
                type: 'error',
                text: `Daemon session disconnected: ${sanitizedReason}`,
            },
            daemonEventId: event.id,
        },
    ];
}
function toolUpdateToHistoryItem(update, state) {
    const toolCallId = getString(update['toolCallId']);
    if (!toolCallId) {
        return undefined;
    }
    const title = getString(update['title']);
    const kind = getString(update['kind']);
    const safeToolCallId = sanitizeDisplayText(toolCallId);
    const safeTitle = title === undefined ? undefined : sanitizeDisplayText(title);
    const safeKind = kind === undefined ? undefined : sanitizeDisplayText(kind);
    const rawOutput = formatToolResultDisplay(update['rawOutput']);
    const contentOutput = formatToolContentText(update['content']);
    const previous = state?.toolCallsById.get(toolCallId);
    const tool = {
        callId: safeToolCallId,
        name: safeKind ?? safeTitle ?? previous?.name ?? safeToolCallId,
        description: safeTitle ?? safeKind ?? previous?.description ?? safeToolCallId,
        resultDisplay: rawOutput ?? contentOutput ?? previous?.resultDisplay,
        status: update['status'] == null
            ? (previous?.status ?? ToolCallStatus.Pending)
            : mapToolStatus(update['status']),
        // Confirmation UI is driven by daemon permission_request events. The
        // in-process ToolCallConfirmationDetails shape contains callbacks and is
        // not directly serializable across the daemon boundary.
        confirmationDetails: previous?.confirmationDetails,
    };
    if (state && !state.toolCallsById.has(toolCallId)) {
        state.toolCallOrder.push(toolCallId);
    }
    state?.toolCallsById.set(toolCallId, tool);
    if (state) {
        while (state.toolCallOrder.length > MAX_TOOL_CALLS) {
            const oldest = state.toolCallOrder.shift();
            if (oldest !== undefined) {
                state.toolCallsById.delete(oldest);
            }
        }
    }
    return {
        type: 'tool_group',
        tools: Array.from(state?.toolCallsById.values() ?? [tool]),
    };
}
function isPermissionRequestData(value) {
    return (isRecord(value) &&
        typeof value['requestId'] === 'string' &&
        typeof value['sessionId'] === 'string' &&
        isRecord(value['toolCall']) &&
        typeof value['toolCall']['toolCallId'] === 'string' &&
        typeof value['toolCall']['kind'] === 'string' &&
        Array.isArray(value['options']) &&
        value['options'].every((option) => isRecord(option) && typeof option['optionId'] === 'string'));
}
function sanitizePermissionRequest(request) {
    const sanitizedToolCall = sanitizeDaemonValue(request.toolCall);
    return {
        ...request,
        toolCall: {
            ...sanitizedToolCall,
            toolCallId: request.toolCall.toolCallId,
        },
        options: request.options.map((option) => ({
            ...option,
            name: typeof option.name === 'string'
                ? sanitizeDisplayText(option.name)
                : option.name,
        })),
    };
}
function sanitizePermissionOutcome(value) {
    if (!isRecord(value)) {
        return undefined;
    }
    const outcome = value['outcome'];
    if (outcome === 'cancelled') {
        return { outcome };
    }
    if (outcome === 'selected' && typeof value['optionId'] === 'string') {
        return { outcome, optionId: sanitizeDisplayText(value['optionId']) };
    }
    return undefined;
}
function warnUnknownEventTypeOnce(event) {
    const eventType = sanitizeDisplayText(event.type);
    if (UNKNOWN_EVENT_TYPES.has(eventType)) {
        return;
    }
    if (UNKNOWN_EVENT_TYPES.size >= MAX_UNKNOWN_EVENT_TYPES) {
        return;
    }
    UNKNOWN_EVENT_TYPES.add(eventType);
    debugLogger.warn('[DaemonTuiAdapter] Unknown daemon event type:', {
        eventType,
        eventId: event.id,
    });
}
function shouldReportUnsupportedProtocolVersion(version) {
    const sanitizedVersion = sanitizeDisplayText(String(version));
    if (UNSUPPORTED_PROTOCOL_VERSIONS.has(sanitizedVersion)) {
        return false;
    }
    if (UNSUPPORTED_PROTOCOL_VERSIONS.size >= MAX_UNSUPPORTED_PROTOCOL_VERSIONS) {
        return false;
    }
    UNSUPPORTED_PROTOCOL_VERSIONS.add(sanitizedVersion);
    return true;
}
export function reduceDaemonEventToTuiUpdates(event, state) {
    switch (event.type) {
        case 'session_update': {
            const update = getSessionUpdate(event.data);
            const sessionUpdate = getString(update?.['sessionUpdate']);
            const text = getTextContent(update?.['content']);
            if (sessionUpdate === 'user_message_chunk') {
                return [];
            }
            if (sessionUpdate === 'agent_message_chunk' && text) {
                return [
                    {
                        type: 'history',
                        item: { type: 'gemini_content', text: sanitizeDisplayText(text) },
                        daemonEventId: event.id,
                    },
                ];
            }
            if (sessionUpdate === 'agent_thought_chunk' && text) {
                return [
                    {
                        type: 'history',
                        item: {
                            type: 'gemini_thought_content',
                            text: sanitizeDisplayText(text),
                        },
                        daemonEventId: event.id,
                    },
                ];
            }
            if (update &&
                (sessionUpdate === 'tool_call' || sessionUpdate === 'tool_call_update')) {
                const item = toolUpdateToHistoryItem(update, state);
                return item
                    ? [{ type: 'tool_group_update', item, daemonEventId: event.id }]
                    : [];
            }
            if (sessionUpdate === 'plan') {
                const text = formatPlan(update?.['entries']);
                return text
                    ? [
                        {
                            type: 'history',
                            item: { type: 'info', text },
                            daemonEventId: event.id,
                        },
                    ]
                    : [];
            }
            return [];
        }
        case 'permission_request': {
            if (!isPermissionRequestData(event.data)) {
                return [];
            }
            const request = sanitizePermissionRequest(event.data);
            return [
                {
                    type: 'permission_request',
                    requestId: request.requestId,
                    request,
                    daemonEventId: event.id,
                },
            ];
        }
        case 'permission_resolved': {
            if (!isRecord(event.data) ||
                typeof event.data['requestId'] !== 'string') {
                return [];
            }
            const outcome = sanitizePermissionOutcome(event.data['outcome']);
            return [
                {
                    type: 'permission_resolved',
                    requestId: event.data['requestId'],
                    outcome,
                    daemonEventId: event.id,
                },
            ];
        }
        case 'model_switched': {
            if (!isRecord(event.data) || typeof event.data['modelId'] !== 'string') {
                return [];
            }
            const modelId = sanitizeDisplayText(event.data['modelId']);
            return [
                {
                    type: 'model_switched',
                    modelId,
                    daemonEventId: event.id,
                },
                {
                    type: 'history',
                    item: {
                        type: 'info',
                        text: `Model switched to ${modelId}`,
                    },
                    daemonEventId: event.id,
                },
            ];
        }
        case 'session_died': {
            const reason = isRecord(event.data) && typeof event.data['reason'] === 'string'
                ? event.data['reason']
                : 'session_died';
            return terminalUpdates(event, reason);
        }
        case 'client_evicted': {
            const reason = isRecord(event.data) && typeof event.data['reason'] === 'string'
                ? event.data['reason']
                : 'client_evicted';
            return terminalUpdates(event, reason);
        }
        case 'stream_error': {
            const reason = isRecord(event.data) && typeof event.data['error'] === 'string'
                ? event.data['error']
                : 'stream_error';
            return terminalUpdates(event, reason);
        }
        default:
            warnUnknownEventTypeOnce(event);
            return [];
    }
}
export class DaemonTuiAdapter {
    session;
    onUpdate;
    reducerState = createDaemonTuiReducerState();
    eventController = null;
    eventPump = null;
    lastSeenEventId;
    lifecycle = 'idle';
    restartAfterStop = false;
    pumpGeneration = 0;
    busy = false;
    constructor(options) {
        this.session = options.session;
        this.onUpdate = options.onUpdate;
        this.lastSeenEventId = options.session.lastEventId;
    }
    start() {
        if (this.lifecycle === 'running') {
            return;
        }
        if (this.lifecycle === 'stopping') {
            this.restartAfterStop = true;
            return;
        }
        this.startPump();
    }
    startPump() {
        this.eventController = new AbortController();
        this.lifecycle = 'running';
        const generation = ++this.pumpGeneration;
        this.eventPump = this.pumpEvents(this.eventController.signal, generation);
    }
    async stop() {
        if (this.lifecycle === 'idle') {
            return;
        }
        this.lifecycle = 'stopping';
        this.eventController?.abort();
        if (this.eventPump) {
            try {
                const drained = await this.waitForPumpToDrain(this.eventPump);
                if (!drained && this.lifecycle === 'stopping') {
                    debugLogger.error('[DaemonTuiAdapter] Event pump did not drain within timeout; forcing idle');
                    this.forceIdleAfterPumpTimeout();
                }
            }
            catch {
                /* pump errors are converted into updates */
            }
        }
    }
    async sendPrompt(prompt) {
        this.assertRunning();
        if (this.busy) {
            throw new Error('A prompt is already in progress');
        }
        this.busy = true;
        clearDaemonTuiReducerState(this.reducerState);
        const promptBlocks = typeof prompt === 'string'
            ? [{ type: 'text', text: prompt }]
            : prompt;
        try {
            const result = await this.session.prompt({ prompt: promptBlocks }, this.eventController?.signal);
            return typeof result.stopReason === 'string'
                ? { ...result, stopReason: sanitizeReason(result.stopReason) }
                : result;
        }
        catch (error) {
            this.reportDaemonFailure(error, { disconnect: true });
            throw createSanitizedDaemonError(error);
        }
        finally {
            this.busy = false;
        }
    }
    async cancel() {
        this.assertRunning();
        try {
            await this.session.cancel();
        }
        catch (error) {
            this.reportDaemonFailure(error);
            throw createSanitizedDaemonError(error);
        }
    }
    async setModel(modelId) {
        this.assertRunning();
        try {
            return await this.session.setModel(modelId);
        }
        catch (error) {
            this.reportDaemonFailure(error);
            throw createSanitizedDaemonError(error);
        }
    }
    async approvePermission(requestId, optionId) {
        this.assertRunning();
        try {
            return await this.session.respondToPermission(requestId, {
                outcome: { outcome: 'selected', optionId },
            });
        }
        catch (error) {
            this.reportDaemonFailure(error);
            throw createSanitizedDaemonError(error);
        }
    }
    async rejectPermission(requestId) {
        this.assertRunning();
        try {
            return await this.session.respondToPermission(requestId, {
                outcome: { outcome: 'cancelled' },
            });
        }
        catch (error) {
            this.reportDaemonFailure(error);
            throw createSanitizedDaemonError(error);
        }
    }
    get currentSessionId() {
        return this.session.sessionId;
    }
    get workspaceCwd() {
        return this.session.workspaceCwd;
    }
    get lastEventId() {
        return this.lastSeenEventId ?? this.session.lastEventId;
    }
    async pumpEvents(signal, generation) {
        try {
            const resumeId = this.lastSeenEventId ?? this.session.lastEventId;
            for await (const event of this.session.events({
                signal,
                lastEventId: resumeId,
                resume: true,
            })) {
                if (signal.aborted) {
                    break;
                }
                if (event.id !== undefined) {
                    this.lastSeenEventId = event.id;
                }
                if (event.v !== 1) {
                    if (!shouldReportUnsupportedProtocolVersion(event.v)) {
                        continue;
                    }
                    this.emit({
                        type: 'history',
                        item: {
                            type: 'error',
                            text: `Unsupported daemon protocol version: ${sanitizeDisplayText(String(event.v))}`,
                        },
                        daemonEventId: event.id,
                    });
                    continue;
                }
                for (const update of reduceDaemonEventToTuiUpdates(event, this.reducerState)) {
                    this.emit(update);
                }
            }
            if (!signal.aborted) {
                this.emit({
                    type: 'disconnected',
                    reason: 'event stream ended',
                });
                this.emit({
                    type: 'history',
                    item: { type: 'info', text: 'Daemon event stream ended' },
                });
            }
        }
        catch (error) {
            if (!signal.aborted) {
                const message = sanitizeReason(error instanceof Error ? error.message : String(error));
                this.emit({ type: 'disconnected', reason: message });
            }
        }
        finally {
            if (this.pumpGeneration === generation) {
                this.eventController = null;
                this.eventPump = null;
                const shouldRestart = this.restartAfterStop;
                this.restartAfterStop = false;
                this.lifecycle = 'idle';
                if (shouldRestart) {
                    this.start();
                }
            }
        }
    }
    reportDaemonFailure(error, options = {}) {
        const message = sanitizeReason(error instanceof Error ? error.message : String(error));
        if (options.disconnect && this.lifecycle === 'running') {
            this.lifecycle = 'stopping';
            this.eventController?.abort();
            this.emit({ type: 'disconnected', reason: message });
            return;
        }
        this.emit({
            type: 'history',
            item: { type: 'error', text: `Daemon RPC failed: ${message}` },
        });
    }
    emit(update) {
        try {
            this.onUpdate(update);
        }
        catch {
            /* isolate renderer callback failures from the daemon event pump */
        }
    }
    assertRunning() {
        if (this.lifecycle !== 'running') {
            throw new Error('Daemon TUI adapter is not running');
        }
    }
    async waitForPumpToDrain(pump) {
        let timedOut = false;
        let timeout;
        try {
            await Promise.race([
                pump.then(() => undefined, () => undefined),
                new Promise((resolve) => {
                    timeout = setTimeout(() => {
                        timedOut = true;
                        resolve();
                    }, STOP_TIMEOUT_MS);
                    timeout.unref?.();
                }),
            ]);
        }
        finally {
            if (timeout !== undefined) {
                clearTimeout(timeout);
            }
        }
        return !timedOut;
    }
    forceIdleAfterPumpTimeout() {
        const staleController = this.eventController;
        staleController?.abort();
        this.pumpGeneration += 1;
        const shouldRestart = this.restartAfterStop;
        this.restartAfterStop = false;
        this.eventController = null;
        this.eventPump = null;
        this.lifecycle = 'idle';
        if (shouldRestart) {
            this.start();
        }
    }
}
//# sourceMappingURL=DaemonTuiAdapter.js.map