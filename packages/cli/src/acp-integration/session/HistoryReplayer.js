/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { MessageEmitter } from './emitters/MessageEmitter.js';
import { ToolCallEmitter } from './emitters/ToolCallEmitter.js';
/**
 * Handles replaying session history on session load.
 *
 * Uses the unified emitters to ensure consistency with normal flow.
 * This ensures that replayed history looks identical to how it would
 * have appeared during the original session.
 */
export class HistoryReplayer {
    ctx;
    messageEmitter;
    toolCallEmitter;
    constructor(ctx) {
        this.ctx = ctx;
        this.messageEmitter = new MessageEmitter(ctx);
        this.toolCallEmitter = new ToolCallEmitter(ctx);
    }
    /**
     * Replays all chat records from a loaded session.
     *
     * @param records - Array of chat records to replay
     */
    async replay(records) {
        for (const record of records) {
            await this.replayRecord(record);
        }
    }
    /**
     * Replays a single chat record.
     */
    async replayRecord(record) {
        this.setActiveRecordId(record.uuid, record.timestamp);
        switch (record.type) {
            case 'user':
                // Notification/cron records hold raw XML/prompt the user never
                // typed; replay the friendly displayText so the assistant's reply
                // has an antecedent in the ACP transcript.
                if (record.subtype === 'notification' || record.subtype === 'cron') {
                    const displayText = record.systemPayload?.displayText;
                    if (displayText) {
                        await this.messageEmitter.emitUserMessage(displayText, record.timestamp);
                    }
                    break;
                }
                if (record.subtype === 'mid_turn_user_message') {
                    const displayText = record.systemPayload?.displayText;
                    if (displayText) {
                        await this.messageEmitter.emitUserMessage(displayText, record.timestamp);
                    }
                    else if (record.message) {
                        await this.replayContent(record.message, 'user', record.timestamp);
                    }
                    break;
                }
                if (record.message) {
                    await this.replayContent(record.message, 'user', record.timestamp);
                }
                break;
            case 'assistant':
                if (record.message) {
                    await this.replayContent(record.message, 'assistant', record.timestamp);
                }
                if (record.usageMetadata) {
                    await this.replayUsageMetadata(record.usageMetadata);
                }
                break;
            case 'tool_result':
                await this.replayToolResult(record);
                break;
            case 'system':
                if (record.subtype === 'slash_command') {
                    await this.replaySlashCommandResult(record);
                }
                // Other system subtypes (compression, telemetry, at_command) are skipped.
                break;
            default:
                break;
        }
        this.setActiveRecordId(null);
    }
    /**
     * Replays content from a message (user or assistant).
     * Handles text parts, thought parts, and function calls.
     *
     * @param content - The content to replay
     * @param role - The role (user or assistant)
     * @param timestamp - Optional server-side timestamp from the JSONL record
     */
    async replayContent(content, role, timestamp) {
        for (const part of content.parts ?? []) {
            // Text content
            if ('text' in part && part.text) {
                const isThought = part.thought ?? false;
                await this.messageEmitter.emitMessage(part.text, role, isThought, timestamp);
            }
            // Function call (tool start)
            if ('functionCall' in part && part.functionCall) {
                const functionName = part.functionCall.name ?? '';
                const callId = part.functionCall.id ?? `${functionName}-${Date.now()}`;
                await this.toolCallEmitter.emitStart({
                    toolName: functionName,
                    callId,
                    args: part.functionCall.args,
                    status: 'in_progress',
                    timestamp,
                });
            }
        }
    }
    /**
     * Replays usage metadata.
     * @param usageMetadata - The usage metadata to replay
     */
    async replayUsageMetadata(usageMetadata) {
        await this.messageEmitter.emitUsageMetadata(usageMetadata);
    }
    /**
     * Replays a tool result record.
     */
    async replayToolResult(record) {
        // message is required - skip if not present
        if (!record.message?.parts) {
            return;
        }
        const result = record.toolCallResult;
        const callId = result?.callId ?? record.uuid;
        // Extract tool name from the function response in message if available
        const toolName = this.extractToolNameFromRecord(record);
        await this.toolCallEmitter.emitResult({
            toolName,
            callId,
            success: !result?.error,
            message: record.message.parts,
            resultDisplay: result?.resultDisplay,
            // For TodoWriteTool fallback, try to extract args from the record
            // Note: args aren't stored in tool_result records by default
            args: undefined,
            timestamp: record.timestamp,
        });
        // Special handling: Task tool execution summary contains token usage
        const { resultDisplay } = result ?? {};
        if (!!resultDisplay &&
            typeof resultDisplay === 'object' &&
            'type' in resultDisplay &&
            resultDisplay.type === 'task_execution') {
            await this.emitTaskUsageFromResultDisplay(resultDisplay);
        }
    }
    /**
     * Emits token usage from a AgentResultDisplay execution summary, if present.
     */
    async emitTaskUsageFromResultDisplay(resultDisplay) {
        const summary = resultDisplay.executionSummary;
        if (!summary) {
            return;
        }
        const usageMetadata = {};
        if (Number.isFinite(summary.inputTokens)) {
            usageMetadata.promptTokenCount = summary.inputTokens;
        }
        if (Number.isFinite(summary.outputTokens)) {
            usageMetadata.candidatesTokenCount = summary.outputTokens;
        }
        if (Number.isFinite(summary.thoughtTokens)) {
            usageMetadata.thoughtsTokenCount = summary.thoughtTokens;
        }
        if (Number.isFinite(summary.cachedTokens)) {
            usageMetadata.cachedContentTokenCount = summary.cachedTokens;
        }
        if (Number.isFinite(summary.totalTokens)) {
            usageMetadata.totalTokenCount = summary.totalTokens;
        }
        // Only emit if we captured at least one token metric
        if (Object.keys(usageMetadata).length > 0) {
            await this.messageEmitter.emitUsageMetadata(usageMetadata);
        }
    }
    /**
     * Replays a slash_command system record by re-emitting its output as an
     * agent message chunk. This allows Zed to reconstruct the correct turn
     * structure (user → agent) on session resume without polluting model context.
     */
    async replaySlashCommandResult(record) {
        const payload = record.systemPayload;
        if (payload?.phase !== 'result' || !payload.outputHistoryItems?.length) {
            return;
        }
        for (const item of payload.outputHistoryItems) {
            const text = typeof item['text'] === 'string' ? item['text'] : '';
            if (text) {
                await this.messageEmitter.emitAgentMessage(text.replace(/\n/g, '  \n'), record.timestamp);
            }
        }
    }
    /**
     * Extracts tool name from a chat record's function response.
     */
    extractToolNameFromRecord(record) {
        // Try to get from functionResponse in message
        if (record.message?.parts) {
            for (const part of record.message.parts) {
                if ('functionResponse' in part && part.functionResponse?.name) {
                    return part.functionResponse.name;
                }
            }
        }
        return '';
    }
    setActiveRecordId(recordId, timestamp) {
        const context = this.ctx;
        if (typeof context.setActiveRecordId === 'function') {
            context.setActiveRecordId(recordId, timestamp);
        }
    }
}
//# sourceMappingURL=HistoryReplayer.js.map