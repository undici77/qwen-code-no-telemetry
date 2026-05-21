/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ChatRecord } from '@qwen-code/qwen-code-core';
import type { SessionContext } from './types.js';
/**
 * Handles replaying session history on session load.
 *
 * Uses the unified emitters to ensure consistency with normal flow.
 * This ensures that replayed history looks identical to how it would
 * have appeared during the original session.
 */
export declare class HistoryReplayer {
    private readonly ctx;
    private readonly messageEmitter;
    private readonly toolCallEmitter;
    constructor(ctx: SessionContext);
    /**
     * Replays all chat records from a loaded session.
     *
     * @param records - Array of chat records to replay
     */
    replay(records: ChatRecord[]): Promise<void>;
    /**
     * Replays a single chat record.
     */
    private replayRecord;
    /**
     * Replays content from a message (user or assistant).
     * Handles text parts, thought parts, and function calls.
     *
     * @param content - The content to replay
     * @param role - The role (user or assistant)
     * @param timestamp - Optional server-side timestamp from the JSONL record
     */
    private replayContent;
    /**
     * Replays usage metadata.
     * @param usageMetadata - The usage metadata to replay
     */
    private replayUsageMetadata;
    /**
     * Replays a tool result record.
     */
    private replayToolResult;
    /**
     * Emits token usage from a AgentResultDisplay execution summary, if present.
     */
    private emitTaskUsageFromResultDisplay;
    /**
     * Replays a slash_command system record by re-emitting its output as an
     * agent message chunk. This allows Zed to reconstruct the correct turn
     * structure (user → agent) on session resume without polluting model context.
     */
    private replaySlashCommandResult;
    /**
     * Extracts tool name from a chat record's function response.
     */
    private extractToolNameFromRecord;
    private setActiveRecordId;
}
