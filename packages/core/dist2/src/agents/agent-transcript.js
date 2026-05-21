/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Per-agent transcript for background subagents.
 *
 * Each background subagent produces two sibling files under
 * `<projectDir>/subagents/<sessionId>/`:
 *
 *   agent-<id>.jsonl       — canonical, ChatRecord-shaped event log;
 *                            the model reads this via read_file to check
 *                            in-flight progress and <output-file> in the
 *                            notification XML points here
 *   agent-<id>.meta.json   — sidecar with agentType, description, parent
 *                            session/agent IDs, createdAt
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { AgentEventType, } from './runtime/agent-events.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { _recoverObjectsFromLine } from '../utils/jsonl-utils.js';
const debugLogger = createDebugLogger('AGENT_TRANSCRIPT');
export function sanitizeFilenameComponent(value) {
    return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}
/**
 * Returns the directory holding all subagent transcripts for a given session.
 * Layout: `<projectDir>/subagents/<sessionId>/`.
 *
 * TODO: this path is part of the model-facing contract via `<output-file>` in
 * the task-notification XML. When a second background task kind lands (e.g. a
 * shell pool), migrate to `<projectDir>/tasks/<sessionId>/<kind>-<id>.jsonl`
 * so the namespace generalizes. Update `read-file.ts` auto-allow accordingly.
 */
export function getSubagentSessionDir(projectDir, sessionId) {
    // Sanitize sessionId defensively (UUIDs are safe; resumed/external IDs
    // could carry path-traversal bytes).
    return path.join(projectDir, 'subagents', sanitizeFilenameComponent(sessionId));
}
/** Returns the canonical JSONL transcript path. */
export function getAgentJsonlPath(projectDir, sessionId, agentId) {
    return path.join(getSubagentSessionDir(projectDir, sessionId), `agent-${sanitizeFilenameComponent(agentId)}.jsonl`);
}
/** Returns the sidecar metadata file path. */
export function getAgentMetaPath(projectDir, sessionId, agentId) {
    return path.join(getSubagentSessionDir(projectDir, sessionId), `agent-${sanitizeFilenameComponent(agentId)}.meta.json`);
}
/**
 * Best-effort — a failed sidecar write must not break the agent launch path.
 */
export function writeAgentMeta(metaPath, meta) {
    try {
        fs.mkdirSync(path.dirname(metaPath), { recursive: true });
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    }
    catch (error) {
        debugLogger.warn(`Failed to write agent meta sidecar ${metaPath}:`, error);
    }
}
export function readAgentMeta(metaPath) {
    try {
        return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            debugLogger.warn(`Failed to read agent meta sidecar ${metaPath}:`, error);
        }
        return undefined;
    }
}
export function patchAgentMeta(metaPath, updates) {
    const current = readAgentMeta(metaPath);
    if (!current)
        return undefined;
    const next = {
        ...current,
        ...updates,
    };
    writeAgentMeta(metaPath, next);
    return next;
}
export function readLastTranscriptRecordUuidSync(jsonlPath) {
    try {
        const raw = fs.readFileSync(jsonlPath, 'utf8');
        const lines = raw.split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
            const trimmed = lines[i]?.trim();
            if (!trimmed)
                continue;
            try {
                const parsed = JSON.parse(trimmed);
                return parsed.uuid ?? null;
            }
            catch {
                const recovered = _recoverObjectsFromLine(trimmed);
                const lastRecovered = recovered[recovered.length - 1];
                if (lastRecovered?.uuid) {
                    return lastRecovered.uuid;
                }
            }
        }
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            debugLogger.warn(`Failed to read last transcript record UUID from ${jsonlPath}:`, error);
        }
    }
    return null;
}
/**
 * Subscribes to an AgentEventEmitter and appends ChatRecord-shaped JSONL
 * lines to `jsonlPath`. Maintains a parentUuid chain so consumers can walk
 * the transcript tree the same way they walk the main session log.
 *
 * Holds a single append-mode fd for the lifetime of the writer so streaming
 * tools (which can fire many TOOL_CALL/TOOL_RESULT events per round) avoid
 * an open+write+close syscall storm. The fd is opened lazily on the first
 * write so callers that attach but never produce a record don't materialize
 * an empty file.
 */
export function attachJsonlTranscriptWriter(emitter, jsonlPath, options) {
    let lastUuid = options.initialParentUuid !== undefined
        ? options.initialParentUuid
        : options.appendToExisting
            ? readLastTranscriptRecordUuidSync(jsonlPath)
            : null;
    let fd = null;
    let openFailed = false;
    const ensureOpen = () => {
        if (fd !== null)
            return true;
        if (openFailed)
            return false;
        try {
            fs.mkdirSync(path.dirname(jsonlPath), { recursive: true });
            fd = fs.openSync(jsonlPath, 'a');
            return true;
        }
        catch (error) {
            debugLogger.warn(`Failed to open JSONL transcript ${jsonlPath}:`, error);
            openFailed = true;
            return false;
        }
    };
    const baseFields = (type) => ({
        uuid: randomUUID(),
        parentUuid: lastUuid,
        sessionId: options.sessionId,
        timestamp: new Date().toISOString(),
        type,
        cwd: options.cwd,
        version: options.version,
        gitBranch: options.gitBranch,
        agentId: options.agentId,
        agentName: options.agentName,
        agentColor: options.agentColor,
        isSidechain: true,
    });
    const append = (record) => {
        if (!ensureOpen())
            return;
        try {
            fs.writeSync(fd, JSON.stringify(record) + '\n');
            lastUuid = record.uuid;
        }
        catch (error) {
            debugLogger.warn(`Failed to append JSONL record to ${jsonlPath}:`, error);
        }
    };
    const onRoundText = (event) => {
        if (!event.text)
            return;
        append({
            ...baseFields('assistant'),
            message: { role: 'model', parts: [{ text: event.text }] },
        });
    };
    const onToolCall = (event) => {
        append({
            ...baseFields('assistant'),
            message: {
                role: 'model',
                parts: [
                    {
                        functionCall: {
                            id: event.callId,
                            name: event.name,
                            args: event.args,
                        },
                    },
                ],
            },
        });
    };
    const onToolResult = (event) => {
        // Prefer the real response parts the model saw; fall back to a status
        // stub only when the agent aborted before a response was formed.
        const parts = event.responseParts ?? [
            {
                functionResponse: {
                    id: event.callId,
                    name: event.name,
                    response: {
                        success: event.success,
                        ...(event.error ? { error: event.error } : {}),
                    },
                },
            },
        ];
        append({
            ...baseFields('tool_result'),
            message: { role: 'user', parts },
            toolCallResult: {
                callId: event.callId,
                status: event.success ? 'success' : 'error',
                ...(event.durationMs !== undefined
                    ? { durationMs: event.durationMs }
                    : {}),
            },
        });
    };
    const recordUserMessage = (text, externalInputKind) => {
        if (!text)
            return;
        append({
            ...baseFields('user'),
            message: { role: 'user', parts: [{ text }] },
            ...(externalInputKind ? { externalInputKind } : {}),
        });
    };
    const recordSystem = (subtype, payload) => {
        append({
            ...baseFields('system'),
            subtype,
            systemPayload: payload,
        });
    };
    const onExternalMessage = (event) => {
        recordUserMessage(event.text, event.kind ?? 'message');
    };
    const hasBootstrapPayload = options.bootstrapHistory !== undefined ||
        options.bootstrapSystemInstruction !== undefined ||
        options.bootstrapTools !== undefined;
    if (hasBootstrapPayload) {
        const payload = {
            kind: 'fork',
            history: structuredClone(options.bootstrapHistory ?? []),
            ...(options.bootstrapSystemInstruction !== undefined
                ? {
                    systemInstruction: structuredClone(options.bootstrapSystemInstruction),
                }
                : {}),
            ...(options.bootstrapTools !== undefined
                ? { tools: structuredClone(options.bootstrapTools) }
                : {}),
        };
        recordSystem('agent_bootstrap', payload);
    }
    if (options.initialUserPrompt) {
        recordUserMessage(options.initialUserPrompt);
    }
    if (options.launchTaskPrompt) {
        recordSystem('agent_launch_prompt', {
            displayText: options.launchTaskPrompt,
        });
    }
    emitter.on(AgentEventType.ROUND_TEXT, onRoundText);
    emitter.on(AgentEventType.TOOL_CALL, onToolCall);
    emitter.on(AgentEventType.TOOL_RESULT, onToolResult);
    emitter.on(AgentEventType.EXTERNAL_MESSAGE, onExternalMessage);
    const cleanup = () => {
        emitter.off(AgentEventType.ROUND_TEXT, onRoundText);
        emitter.off(AgentEventType.TOOL_CALL, onToolCall);
        emitter.off(AgentEventType.TOOL_RESULT, onToolResult);
        emitter.off(AgentEventType.EXTERNAL_MESSAGE, onExternalMessage);
        if (fd !== null) {
            try {
                fs.closeSync(fd);
            }
            catch {
                // best effort
            }
            fd = null;
        }
    };
    return { cleanup };
}
//# sourceMappingURL=agent-transcript.js.map