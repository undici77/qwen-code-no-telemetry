/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Qwen Session Update Handler class
 * Processes various session update events and calls appropriate callbacks
 */
export class QwenSessionUpdateHandler {
    callbacks;
    constructor(callbacks) {
        this.callbacks = callbacks;
    }
    /**
     * Update callbacks
     *
     * @param callbacks - New callback collection
     */
    updateCallbacks(callbacks) {
        this.callbacks = callbacks;
    }
    /**
     * Handle session update
     *
     * @param data - ACP session update data
     */
    handleSessionUpdate(data) {
        const update = data.update;
        const sessionUpdate = update.sessionUpdate;
        console.log('[SessionUpdateHandler] Processing update type:', sessionUpdate);
        switch (sessionUpdate) {
            case 'user_message_chunk': {
                const text = this.getTextContent(update.content);
                if (text && this.callbacks.onStreamChunk) {
                    this.callbacks.onStreamChunk(text);
                }
                break;
            }
            case 'agent_message_chunk': {
                const text = this.getTextContent(update.content);
                if (text && this.callbacks.onStreamChunk) {
                    this.callbacks.onStreamChunk(text);
                }
                this.emitUsageMeta(update._meta);
                break;
            }
            case 'agent_thought_chunk': {
                const text = this.getTextContent(update.content);
                if (text) {
                    if (this.callbacks.onThoughtChunk) {
                        this.callbacks.onThoughtChunk(text);
                    }
                    else if (this.callbacks.onStreamChunk) {
                        // Fallback to regular stream processing
                        console.log('[SessionUpdateHandler] 🧠 Falling back to onStreamChunk');
                        this.callbacks.onStreamChunk(text);
                    }
                }
                this.emitUsageMeta(update._meta);
                break;
            }
            case 'tool_call': {
                // Handle new tool call
                if (this.callbacks.onToolCall && 'toolCallId' in update) {
                    const meta = update._meta;
                    const timestamp = typeof meta?.timestamp === 'number' ? meta.timestamp : undefined;
                    this.callbacks.onToolCall({
                        toolCallId: update.toolCallId,
                        kind: update.kind || undefined,
                        title: update.title || undefined,
                        status: update.status || undefined,
                        rawInput: update.rawInput,
                        rawOutput: update.rawOutput,
                        content: update.content,
                        locations: update.locations,
                        ...(timestamp !== undefined && { timestamp }),
                    });
                }
                break;
            }
            case 'tool_call_update': {
                if (this.callbacks.onToolCall && 'toolCallId' in update) {
                    const meta = update._meta;
                    const timestamp = typeof meta?.timestamp === 'number' ? meta.timestamp : undefined;
                    this.callbacks.onToolCall({
                        toolCallId: update.toolCallId,
                        kind: update.kind || undefined,
                        title: update.title || undefined,
                        status: update.status || undefined,
                        rawInput: update.rawInput,
                        rawOutput: update.rawOutput,
                        content: update.content,
                        locations: update.locations,
                        ...(timestamp !== undefined && { timestamp }),
                    });
                }
                break;
            }
            case 'plan': {
                if ('entries' in update) {
                    const entries = update.entries;
                    if (this.callbacks.onPlan) {
                        this.callbacks.onPlan(entries);
                    }
                    else if (this.callbacks.onStreamChunk) {
                        // Fallback to stream processing
                        const planText = '\n📋 Plan:\n' +
                            entries
                                .map((entry, i) => `${i + 1}. [${entry.priority}] ${entry.content}`)
                                .join('\n');
                        this.callbacks.onStreamChunk(planText);
                    }
                }
                break;
            }
            case 'current_mode_update': {
                // Notify UI about mode change
                try {
                    const modeId = update.currentModeId;
                    if (modeId && this.callbacks.onModeChanged) {
                        this.callbacks.onModeChanged(modeId);
                    }
                }
                catch (err) {
                    console.warn('[SessionUpdateHandler] Failed to handle mode update', err);
                }
                break;
            }
            case 'available_commands_update': {
                // Notify UI about available commands
                try {
                    const commands = update.availableCommands;
                    if (commands && this.callbacks.onAvailableCommands) {
                        this.callbacks.onAvailableCommands(commands);
                    }
                    const meta = update._meta;
                    if (this.callbacks.onAvailableSkills) {
                        this.callbacks.onAvailableSkills(meta?.availableSkills ?? []);
                    }
                }
                catch (err) {
                    console.warn('[SessionUpdateHandler] Failed to handle available commands update', err);
                }
                break;
            }
            default:
                console.log('[QwenAgentManager] Unhandled session update type');
                break;
        }
    }
    getTextContent(content) {
        if (!content || typeof content !== 'object') {
            return undefined;
        }
        const text = content.text;
        return typeof text === 'string' ? text : undefined;
    }
    emitUsageMeta(meta) {
        if (!meta || !this.callbacks.onUsageUpdate) {
            return;
        }
        const raw = meta.usage;
        const usage = raw
            ? {
                // SDK field names
                inputTokens: raw['inputTokens'] ??
                    raw['promptTokens'],
                outputTokens: raw['outputTokens'] ??
                    raw['completionTokens'],
                thoughtTokens: raw['thoughtTokens'] ??
                    raw['thoughtsTokens'],
                totalTokens: raw['totalTokens'],
                cachedReadTokens: raw['cachedReadTokens'] ??
                    raw['cachedTokens'],
                cachedWriteTokens: raw['cachedWriteTokens'],
                // Legacy compat
                promptTokens: raw['promptTokens'] ??
                    raw['inputTokens'],
                completionTokens: raw['completionTokens'] ??
                    raw['outputTokens'],
                thoughtsTokens: raw['thoughtsTokens'] ??
                    raw['thoughtTokens'],
                cachedTokens: raw['cachedTokens'] ??
                    raw['cachedReadTokens'],
            }
            : undefined;
        const payload = {
            usage,
            durationMs: meta.durationMs ?? undefined,
        };
        this.callbacks.onUsageUpdate(payload);
    }
}
//# sourceMappingURL=qwenSessionUpdateHandler.js.map