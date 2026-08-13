/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import readline from 'node:readline';
import { getSubagentSessionDir, parseLineTolerant, read as readJsonl, readAgentMeta, Storage, } from '@qwen-code/qwen-code-core';
import { EventBus, } from '@qwen-code/acp-bridge/eventBus';
import { createTranscriptMessageUpdate } from '@qwen-code/acp-bridge/transcriptReplay';
import { replayTranscriptRecordPage } from '../acp-integration/session/history-replay-page.js';
const PREFIX = 'subagent.';
export const MAX_VIRTUAL_SESSION_ID_PART_LENGTH = 500;
const MAX_VIRTUAL_SESSION_ID_LENGTH = 2_000;
const POLL_INTERVAL_MS = 250;
const TARGET_RETENTION_MS = 60_000;
async function readFirstUserText(filePath) {
    const stream = createReadStream(filePath);
    const lines = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
    });
    try {
        for await (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            for (const record of parseLineTolerant(trimmed, filePath)) {
                if (record.type !== 'user')
                    continue;
                return record.message?.parts?.find((part) => typeof part.text === 'string')?.text;
            }
        }
        return undefined;
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return undefined;
        throw error;
    }
    finally {
        lines.close();
        stream.destroy();
    }
}
function asRecord(value) {
    return typeof value === 'object' && value !== null
        ? value
        : undefined;
}
function finiteNonNegative(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
        ? value
        : undefined;
}
function normalizeTaskStatus(status) {
    if (typeof status !== 'string')
        return undefined;
    if (status === 'success')
        return 'completed';
    if (status === 'error')
        return 'failed';
    if (status === 'background')
        return 'running';
    return status;
}
function isTerminalTaskStatus(status) {
    return (status === 'completed' ||
        status === 'failed' ||
        status === 'cancelled' ||
        status === 'canceled');
}
export function preferTerminalTaskStatus(metricsStatus, selectedStatus) {
    return !isTerminalTaskStatus(metricsStatus) &&
        isTerminalTaskStatus(selectedStatus)
        ? selectedStatus
        : (metricsStatus ?? selectedStatus);
}
function durationBetween(start, end) {
    if (!end)
        return undefined;
    const startTime = Date.parse(start);
    const endTime = Date.parse(end);
    return Number.isFinite(startTime) && Number.isFinite(endTime)
        ? Math.max(0, endTime - startTime)
        : undefined;
}
function findToolCallMetrics(records, toolCallId) {
    const toolResult = records.find((record) => record.toolCallResult?.callId === toolCallId)?.toolCallResult;
    const display = asRecord(toolResult?.resultDisplay);
    const summary = asRecord(display?.['executionSummary']);
    return {
        status: normalizeTaskStatus(display?.['status']) ??
            normalizeTaskStatus(toolResult?.status),
        durationMs: finiteNonNegative(summary?.['totalDurationMs']),
        totalTokens: finiteNonNegative(summary?.['totalTokens']) ??
            finiteNonNegative(display?.['tokenCount']),
        inputTokens: finiteNonNegative(summary?.['inputTokens']),
        outputTokens: finiteNonNegative(summary?.['outputTokens']),
        cachedTokens: finiteNonNegative(summary?.['cachedTokens']),
    };
}
function encodePart(value) {
    return Buffer.from(value, 'utf8').toString('base64url');
}
function decodePart(value) {
    try {
        return Buffer.from(value, 'base64url').toString('utf8');
    }
    catch {
        return undefined;
    }
}
// Parent ids reach filesystem paths, so they keep the strict charset;
// agent ids are comparison-only and may use the round-trippable space.
function isValidVirtualParentSessionId(value) {
    return (value.length > 0 &&
        value.length <= MAX_VIRTUAL_SESSION_ID_PART_LENGTH &&
        /^[a-zA-Z0-9_-]+$/.test(value));
}
function isValidVirtualAgentId(value) {
    return (value.length > 0 &&
        value.length <= MAX_VIRTUAL_SESSION_ID_PART_LENGTH &&
        // Round-trip rejects lone surrogates: UTF-8 maps them to U+FFFD, so two
        // distinct agent ids would otherwise encode to the same session id.
        decodePart(encodePart(value)) === value);
}
export function createVirtualSubagentSessionId(parentSessionId, agentId) {
    if (!isValidVirtualParentSessionId(parentSessionId) ||
        !isValidVirtualAgentId(agentId)) {
        throw new Error('Virtual subagent session ids require valid id parts');
    }
    const sessionId = `${PREFIX}${encodePart(parentSessionId)}.${encodePart(agentId)}`;
    if (sessionId.length > MAX_VIRTUAL_SESSION_ID_LENGTH) {
        throw new Error(`Virtual subagent session id exceeds ${MAX_VIRTUAL_SESSION_ID_LENGTH} characters`);
    }
    return sessionId;
}
export function parseVirtualSubagentSessionId(sessionId) {
    if (!sessionId.startsWith(PREFIX) ||
        sessionId.length > MAX_VIRTUAL_SESSION_ID_LENGTH) {
        return undefined;
    }
    const parts = sessionId.slice(PREFIX.length).split('.');
    if (parts.length !== 2)
        return undefined;
    const parentPart = parts[0];
    const agentPart = parts[1];
    const parentSessionId = decodePart(parentPart);
    const agentId = decodePart(agentPart);
    if (!parentSessionId ||
        !agentId ||
        !isValidVirtualParentSessionId(parentSessionId) ||
        !isValidVirtualAgentId(agentId) ||
        encodePart(parentSessionId) !== parentPart ||
        encodePart(agentId) !== agentPart) {
        return undefined;
    }
    return { parentSessionId, agentId };
}
function replayCursorState(sessionId, position, leafUuid, startTime, lastUpdated) {
    return {
        v: 1,
        sessionId,
        fileIdentity: { dev: 0, ino: 0 },
        snapshotSize: position,
        position,
        leafUuid,
        startTime,
        lastUpdated,
    };
}
class VirtualSubagentTarget {
    sessionId;
    parentSessionId;
    task;
    workspaceCwd;
    onExpired;
    bus = new EventBus(1_024, 8);
    events = [];
    snapshotDelivered = false;
    offset = 0;
    transcriptIdentity;
    streamOffset = 0;
    streamIdentity;
    streamReady = false;
    canonicalThroughTimestamp = 0;
    completedStreamRounds = new Set();
    streamedRounds = new Set();
    streamRunIds = new Set();
    legacyStreamedSinceCanonical = false;
    replayState;
    initialized = false;
    refreshPromise = Promise.resolve();
    snapshotPromise = Promise.resolve();
    pollTimer;
    subscribers = 0;
    retentionTimer;
    constructor(sessionId, parentSessionId, task, workspaceCwd, onExpired) {
        this.sessionId = sessionId;
        this.parentSessionId = parentSessionId;
        this.task = task;
        this.workspaceCwd = workspaceCwd;
        this.onExpired = onExpired;
    }
    updateStatus(status) {
        const wasRunning = this.task.status === 'running';
        this.task.status = status;
        if (status !== 'running' && this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }
        if (wasRunning && status !== 'running') {
            void this.refreshLive().catch(() => undefined);
        }
    }
    rememberEvent(event) {
        if (event && !this.snapshotDelivered)
            this.events.push(event);
    }
    resetCanonicalState() {
        this.offset = 0;
        this.replayState = undefined;
        this.canonicalThroughTimestamp = 0;
        this.completedStreamRounds.clear();
        this.streamRunIds.clear();
        this.streamedRounds.clear();
        this.legacyStreamedSinceCanonical = false;
    }
    resetStreamState() {
        this.streamOffset = 0;
        this.completedStreamRounds.clear();
        this.streamRunIds.clear();
        this.streamedRounds.clear();
        this.legacyStreamedSinceCanonical = false;
    }
    async readNewRecords(endOffset) {
        let handle;
        try {
            handle = await fs.open(this.task.outputFile, 'r');
            const stat = await handle.stat();
            const identity = `${stat.dev}:${stat.ino}`;
            if ((this.transcriptIdentity !== undefined &&
                this.transcriptIdentity !== identity) ||
                stat.size < this.offset) {
                this.resetCanonicalState();
            }
            this.transcriptIdentity = identity;
            const size = Math.min(stat.size, endOffset ?? stat.size);
            if (size <= this.offset)
                return [];
            const bytes = Buffer.alloc(size - this.offset);
            const { bytesRead } = await handle.read(bytes, 0, bytes.length, this.offset);
            const chunk = bytes.subarray(0, bytesRead);
            const lastNewline = chunk.lastIndexOf(0x0a);
            if (lastNewline < 0)
                return [];
            const complete = chunk.subarray(0, lastNewline + 1);
            this.offset += complete.length;
            return complete
                .toString('utf8')
                .split('\n')
                .flatMap((line) => {
                const trimmed = line.trim();
                return trimmed
                    ? parseLineTolerant(trimmed, this.task.outputFile)
                    : [];
            });
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                if (this.transcriptIdentity !== undefined) {
                    this.transcriptIdentity = undefined;
                    this.resetCanonicalState();
                }
                return [];
            }
            throw error;
        }
        finally {
            await handle?.close();
        }
    }
    async readStreamUpdates(endOffset) {
        const replayingExisting = !this.streamReady;
        this.streamReady = true;
        const filePath = `${this.task.outputFile}.stream`;
        let handle;
        try {
            handle = await fs.open(filePath, 'r');
            const stat = await handle.stat();
            const identity = `${stat.dev}:${stat.ino}`;
            if (this.streamIdentity !== undefined &&
                this.streamIdentity !== identity) {
                this.resetStreamState();
            }
            this.streamIdentity = identity;
            if (stat.size < this.streamOffset)
                this.resetStreamState();
            const size = Math.min(stat.size, endOffset ?? stat.size);
            if (size <= this.streamOffset)
                return;
            const bytes = Buffer.alloc(size - this.streamOffset);
            const { bytesRead } = await handle.read(bytes, 0, bytes.length, this.streamOffset);
            const chunk = bytes.subarray(0, bytesRead);
            const lastNewline = chunk.lastIndexOf(0x0a);
            if (lastNewline < 0)
                return;
            const complete = chunk.subarray(0, lastNewline + 1);
            this.streamOffset += complete.length;
            const records = complete
                .toString('utf8')
                .split('\n')
                .flatMap((line) => {
                const trimmed = line.trim();
                return trimmed
                    ? parseLineTolerant(trimmed, filePath)
                    : [];
            });
            for (const record of records) {
                if (record.v !== 1 ||
                    typeof record.text !== 'string' ||
                    typeof record.timestamp !== 'number') {
                    continue;
                }
                const roundKey = typeof record.runId === 'string' && typeof record.round === 'number'
                    ? `${record.runId}:${record.round}`
                    : undefined;
                if (typeof record.runId === 'string') {
                    this.streamRunIds.add(record.runId);
                }
                if ((roundKey
                    ? this.completedStreamRounds.has(roundKey)
                    : record.timestamp <= this.canonicalThroughTimestamp) ||
                    (replayingExisting && typeof record.round !== 'number')) {
                    continue;
                }
                const event = this.bus.publish({
                    type: 'session_update',
                    data: createTranscriptMessageUpdate({
                        role: 'assistant',
                        text: record.text,
                        timestamp: record.timestamp,
                        ...(record.thought ? { thought: true } : {}),
                    }),
                });
                this.rememberEvent(event);
                if (roundKey)
                    this.streamedRounds.add(roundKey);
                else
                    this.legacyStreamedSinceCanonical = true;
            }
            for (const completed of this.completedStreamRounds) {
                const runId = completed.slice(0, completed.lastIndexOf(':'));
                if (!this.streamRunIds.has(runId)) {
                    this.completedStreamRounds.delete(completed);
                }
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
            this.streamIdentity = undefined;
            this.streamOffset = 0;
            this.streamRunIds.clear();
            this.streamedRounds.clear();
            this.legacyStreamedSinceCanonical = false;
        }
        finally {
            await handle?.close();
        }
    }
    refreshOnce = async (endOffset) => {
        let records = await this.readNewRecords(endOffset);
        if (records.length === 0) {
            this.initialized = true;
            return;
        }
        for (const record of records) {
            if (record.type === 'assistant' &&
                (record.usageMetadata !== undefined ||
                    record.message?.parts?.some((part) => typeof part.text === 'string'))) {
                if (typeof record.agentRunId === 'string' &&
                    typeof record.agentRound === 'number') {
                    this.completedStreamRounds.add(`${record.agentRunId}:${record.agentRound}`);
                }
                const timestamp = Date.parse(record.timestamp);
                if (Number.isFinite(timestamp)) {
                    this.canonicalThroughTimestamp = Math.max(this.canonicalThroughTimestamp, timestamp);
                }
            }
        }
        if (this.streamedRounds.size > 0 || this.legacyStreamedSinceCanonical) {
            records = records.filter((record) => {
                const roundKey = typeof record.agentRunId === 'string' &&
                    typeof record.agentRound === 'number'
                    ? `${record.agentRunId}:${record.agentRound}`
                    : undefined;
                if (roundKey && this.streamedRounds.delete(roundKey))
                    return false;
                if (!this.legacyStreamedSinceCanonical ||
                    record.type !== 'assistant' ||
                    record.message?.parts?.some((part) => part.functionCall)) {
                    return true;
                }
                this.legacyStreamedSinceCanonical = false;
                return false;
            });
            if (records.length === 0) {
                this.initialized = true;
                return;
            }
        }
        const startTime = records[0]?.timestamp ?? new Date().toISOString();
        const lastUpdated = records[records.length - 1]?.timestamp ?? new Date().toISOString();
        const page = {
            sessionId: this.sessionId,
            filePath: this.task.outputFile,
            records,
            gaps: [],
            hasMore: true,
            replay: this.replayState,
            startTime,
            lastUpdated,
            nextCursorState: replayCursorState(this.sessionId, this.offset, records[records.length - 1]?.uuid ?? '', startTime, lastUpdated),
        };
        let nextReplayState;
        const replay = await replayTranscriptRecordPage({
            sessionId: this.sessionId,
            page,
            encodeCursor: (state) => {
                nextReplayState = state.replay;
                return 'virtual-subagent-replay';
            },
        });
        this.replayState = nextReplayState;
        const inputs = replay.updates.map((update) => ({
            type: 'session_update',
            data: update,
        }));
        const published = this.initialized
            ? inputs.flatMap((input) => {
                const event = this.bus.publish(input);
                return event ? [event] : [];
            })
            : this.bus.seedReplayEvents(inputs);
        if (!this.snapshotDelivered)
            this.events.push(...published);
        this.initialized = true;
    };
    refreshAt(bounds) {
        return this.refreshOnce(bounds?.transcript).then(async () => {
            if (this.task.status === 'running') {
                await this.readStreamUpdates(bounds?.stream);
            }
        });
    }
    enqueueRefresh(work) {
        const result = this.refreshPromise.catch(() => undefined).then(work);
        this.refreshPromise = result.then(() => undefined, () => undefined);
        return result;
    }
    refreshLive() {
        return this.enqueueRefresh(() => this.refreshAt());
    }
    async captureReadBounds() {
        const size = async (filePath) => {
            try {
                return (await fs.stat(filePath)).size;
            }
            catch (error) {
                if (error.code === 'ENOENT')
                    return 0;
                throw error;
            }
        };
        const [transcript, stream] = await Promise.all([
            size(this.task.outputFile),
            size(`${this.task.outputFile}.stream`),
        ]);
        return { transcript, stream };
    }
    async createSnapshotOnce() {
        if (!this.snapshotDelivered) {
            await this.refreshLive();
            const snapshot = [...this.events];
            this.events.length = 0;
            this.snapshotDelivered = true;
            return { events: snapshot, lastEventId: this.bus.lastEventId };
        }
        return this.enqueueRefresh(async () => {
            const bounds = await this.captureReadBounds();
            const target = new VirtualSubagentTarget(this.sessionId, this.parentSessionId, this.task, this.workspaceCwd, () => undefined);
            await target.refreshAt(bounds);
            await this.refreshAt(bounds);
            return {
                events: [...target.events],
                lastEventId: this.bus.lastEventId,
            };
        });
    }
    createSnapshot() {
        const snapshot = this.snapshotPromise.then(() => this.createSnapshotOnce());
        this.snapshotPromise = snapshot.then(() => undefined, () => undefined);
        return snapshot;
    }
    async load(clientId) {
        const snapshot = await this.createSnapshot();
        if (this.subscribers === 0)
            this.scheduleRetention();
        return {
            sessionId: this.sessionId,
            workspaceCwd: this.workspaceCwd,
            attached: true,
            ...(clientId ? { clientId } : {}),
            createdAt: new Date(this.task.startTime).toISOString(),
            hasActivePrompt: this.task.status === 'running',
            state: {},
            compactedReplay: snapshot.events,
            liveJournal: [],
            historyHasMore: false,
            lastEventId: snapshot.lastEventId,
        };
    }
    async *iterate(opts) {
        if (this.retentionTimer) {
            clearTimeout(this.retentionTimer);
            this.retentionTimer = undefined;
        }
        this.subscribers++;
        try {
            await this.refreshLive();
            if (!this.snapshotDelivered) {
                this.events.length = 0;
                this.snapshotDelivered = true;
            }
            if (this.task.status === 'running' && !this.pollTimer) {
                this.pollTimer = setInterval(() => {
                    void this.refreshLive().catch(() => undefined);
                }, POLL_INTERVAL_MS);
                this.pollTimer.unref();
            }
            yield* this.bus.subscribe(opts);
        }
        finally {
            this.subscribers--;
            if (this.subscribers === 0) {
                if (this.pollTimer)
                    clearInterval(this.pollTimer);
                this.pollTimer = undefined;
                this.scheduleRetention();
            }
        }
    }
    subscribe(opts) {
        return {
            [Symbol.asyncIterator]: () => this.iterate(opts),
        };
    }
    scheduleRetention() {
        if (this.retentionTimer)
            clearTimeout(this.retentionTimer);
        this.retentionTimer = setTimeout(this.onExpired, TARGET_RETENTION_MS);
        this.retentionTimer.unref();
    }
}
export class VirtualSubagentSessions {
    targets = new Map();
    async findTask(runtime, parentSessionId, predicate) {
        const status = await runtime.bridge.getSessionTasksStatus(parentSessionId);
        const task = status.tasks.find((candidate) => candidate.kind === 'agent' &&
            typeof candidate.outputFile === 'string' &&
            predicate(candidate));
        if (task?.kind === 'agent' && task.outputFile) {
            return {
                id: task.id,
                title: task.label,
                outputFile: task.outputFile,
                status: task.status,
                startTime: task.startTime,
                durationMs: task.stats?.durationMs ??
                    (task.endTime === undefined
                        ? undefined
                        : Math.max(0, task.endTime - task.startTime)),
                totalTokens: task.stats?.totalTokens,
            };
        }
        const projectDir = Storage.runWithResolvedRuntimeBaseDir(runtime.sessionRuntimeBaseDir, () => new Storage(runtime.workspaceCwd).getProjectDir());
        const sessionDir = getSubagentSessionDir(projectDir, parentSessionId);
        let names;
        try {
            names = await fs.readdir(sessionDir);
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return undefined;
            throw error;
        }
        for (const name of names) {
            if (!name.endsWith('.meta.json'))
                continue;
            const metaPath = `${sessionDir}/${name}`;
            const meta = readAgentMeta(metaPath);
            if (!meta ||
                !predicate({
                    kind: 'agent',
                    id: meta.agentId,
                    toolUseId: meta.toolUseId,
                    outputFile: metaPath.slice(0, -'.meta.json'.length) + '.jsonl',
                })) {
                continue;
            }
            return {
                id: meta.agentId,
                title: meta.description || meta.agentType,
                outputFile: metaPath.slice(0, -'.meta.json'.length) + '.jsonl',
                status: meta.status ?? 'completed',
                startTime: Number.isFinite(Date.parse(meta.createdAt))
                    ? Date.parse(meta.createdAt)
                    : Date.now(),
                durationMs: durationBetween(meta.createdAt, meta.lastUpdatedAt),
            };
        }
        return undefined;
    }
    async findLegacyTaskByToolCall(runtime, parentSessionId, toolCallId) {
        // Pre-toolUseId transcripts cannot be linked exactly. This score is only a
        // best-effort compatibility path and identical parallel launches may tie.
        const projectDir = Storage.runWithResolvedRuntimeBaseDir(runtime.sessionRuntimeBaseDir, () => new Storage(runtime.workspaceCwd).getProjectDir());
        const parentRecords = await readJsonl(`${projectDir}/chats/${parentSessionId}.jsonl`);
        let root;
        for (const record of parentRecords) {
            for (const part of record.message?.parts ?? []) {
                const call = part.functionCall;
                if (call?.id !== toolCallId || call.name !== 'agent')
                    continue;
                const args = call.args;
                root = {
                    timestamp: Date.parse(record.timestamp),
                    ...(typeof args?.['description'] === 'string'
                        ? { description: args['description'] }
                        : {}),
                    ...(typeof args?.['prompt'] === 'string'
                        ? { prompt: args['prompt'] }
                        : {}),
                    ...(typeof args?.['subagent_type'] === 'string'
                        ? { agentType: args['subagent_type'] }
                        : {}),
                };
                break;
            }
            if (root)
                break;
        }
        if (!root)
            return undefined;
        const sessionDir = getSubagentSessionDir(projectDir, parentSessionId);
        let names;
        try {
            names = await fs.readdir(sessionDir);
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return undefined;
            throw error;
        }
        const candidates = [];
        for (const name of names) {
            if (!name.endsWith('.meta.json'))
                continue;
            const metaPath = `${sessionDir}/${name}`;
            const meta = readAgentMeta(metaPath);
            if (!meta)
                continue;
            const outputFile = metaPath.slice(0, -'.meta.json'.length) + '.jsonl';
            const launchPrompt = await readFirstUserText(outputFile);
            let score = 0;
            if (root.prompt && launchPrompt === root.prompt)
                score += 8;
            if (root.description && meta.description === root.description)
                score += 4;
            if (root.agentType && meta.agentType === root.agentType)
                score += 2;
            const startTime = Date.parse(meta.createdAt);
            const delta = Math.abs(startTime - root.timestamp);
            if (Number.isFinite(delta) && delta <= 60_000)
                score += 1;
            if (score === 0)
                continue;
            candidates.push({
                id: meta.agentId,
                title: meta.description || meta.agentType,
                outputFile,
                status: meta.status ?? 'completed',
                startTime: Number.isFinite(startTime) ? startTime : Date.now(),
                durationMs: durationBetween(meta.createdAt, meta.lastUpdatedAt),
                score,
                delta,
            });
        }
        candidates.sort((a, b) => b.score - a.score || a.delta - b.delta);
        const selected = candidates[0];
        if (!selected)
            return undefined;
        const metrics = findToolCallMetrics(parentRecords, toolCallId);
        return {
            ...selected,
            status: preferTerminalTaskStatus(metrics.status, selected.status),
            durationMs: metrics.durationMs ?? selected.durationMs,
            totalTokens: metrics.totalTokens ?? selected.totalTokens,
            inputTokens: metrics.inputTokens ?? selected.inputTokens,
            outputTokens: metrics.outputTokens ?? selected.outputTokens,
            cachedTokens: metrics.cachedTokens ?? selected.cachedTokens,
        };
    }
    async readParentToolCallMetrics(runtime, parentSessionId, toolCallId) {
        const projectDir = Storage.runWithResolvedRuntimeBaseDir(runtime.sessionRuntimeBaseDir, () => new Storage(runtime.workspaceCwd).getProjectDir());
        const records = await readJsonl(`${projectDir}/chats/${parentSessionId}.jsonl`);
        return findToolCallMetrics(records, toolCallId);
    }
    async resolve(runtime, parentSessionId, toolCallId) {
        let task = await this.findTask(runtime, parentSessionId, (candidate) => 
        // /fork has no parent transcript tool call, so its task ID is the
        // stable reference used by Web Shell.
        candidate.id === toolCallId ||
            candidate.toolUseId === toolCallId ||
            candidate.id.endsWith(`-${toolCallId}`));
        const metrics = task && task.status !== 'running'
            ? await this.readParentToolCallMetrics(runtime, parentSessionId, toolCallId)
            : undefined;
        task ??= await this.findLegacyTaskByToolCall(runtime, parentSessionId, toolCallId);
        if (!task)
            return undefined;
        const sessionId = createVirtualSubagentSessionId(parentSessionId, task.id);
        const status = task.status;
        this.targets
            .get(`${runtime.workspaceId}:${sessionId}`)
            ?.updateStatus(status);
        return {
            sessionId,
            taskId: task.id,
            title: task.title,
            status,
            durationMs: metrics?.durationMs ?? task.durationMs,
            totalTokens: metrics?.totalTokens ?? task.totalTokens,
            inputTokens: metrics?.inputTokens ?? task.inputTokens,
            outputTokens: metrics?.outputTokens ?? task.outputTokens,
            cachedTokens: metrics?.cachedTokens ?? task.cachedTokens,
        };
    }
    async getTarget(runtime, sessionId) {
        const targetKey = `${runtime.workspaceId}:${sessionId}`;
        const cached = this.targets.get(targetKey);
        if (cached)
            return cached;
        const key = parseVirtualSubagentSessionId(sessionId);
        if (!key)
            return undefined;
        const task = await this.findTask(runtime, key.parentSessionId, (candidate) => candidate.id === key.agentId);
        if (!task)
            return undefined;
        const existing = this.targets.get(targetKey);
        if (existing)
            return existing;
        const target = new VirtualSubagentTarget(sessionId, key.parentSessionId, task, runtime.workspaceCwd, () => this.targets.delete(targetKey));
        this.targets.set(targetKey, target);
        return target;
    }
    async load(runtime, sessionId, clientId) {
        return (await this.getTarget(runtime, sessionId))?.load(clientId);
    }
    async subscribe(runtime, sessionId, opts) {
        return (await this.getTarget(runtime, sessionId))?.subscribe(opts);
    }
}
//# sourceMappingURL=virtual-subagent-sessions.js.map