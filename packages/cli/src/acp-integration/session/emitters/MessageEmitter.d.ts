/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentResponseUsageMetadata } from '@google/genai';
import { type SubagentMeta } from '../types.js';
import { type GoalRecord, type GoalSnapshotV2, type GoalStateCause } from '@qwen-code/qwen-code-core';
import { BaseEmitter } from './base-emitter.js';
import type { SessionUpdate } from '@agentclientprotocol/sdk';
import type { HistoryItemGoalStatus } from '../../../ui/types.js';
/**
 * Build the `goalStatus` card without sending it.
 *
 * Split out of {@link MessageEmitter.emitGoalStatus} so the bulk load-replay
 * path can place the card inside its `LOAD_REPLAY` envelope instead of
 * streaming it. See `Session.renderRecoveredGoalUpdates`.
 */
export declare function buildGoalStatusUpdate(status: Omit<HistoryItemGoalStatus, 'id' | 'type'>): SessionUpdate;
/**
 * Build the `goalState` card without sending it.
 *
 * Split out of {@link MessageEmitter.emitGoalState}; see
 * {@link buildGoalStatusUpdate} for why the render/send split exists.
 */
export declare function buildGoalStateUpdate(snapshot: GoalSnapshotV2, cause?: GoalStateCause, previousGoal?: GoalRecord | null): SessionUpdate;
/**
 * Handles emission of text message chunks (user, agent, thought).
 *
 * This emitter is responsible for sending message content to the ACP client
 * in a consistent format, regardless of whether the message comes from
 * normal flow, history replay, or other sources.
 */
export declare class MessageEmitter extends BaseEmitter {
    /**
     * Emits a StopHookLoop event when Stop hooks create a loop.
     * This informs the client that Stop hooks have been executed multiple times.
     *
     * @param iterationCount - The current iteration count
     * @param reasons - Array of reasons from each Stop hook execution
     * @param stopHookCount - Number of Stop hooks that were executed
     */
    emitStopHookLoop(iterationCount: number, reasons: string[], stopHookCount: number): Promise<void>;
    emitGoalStatus(status: Omit<HistoryItemGoalStatus, 'id' | 'type'>): Promise<void>;
    emitGoalState(snapshot: GoalSnapshotV2, cause?: GoalStateCause, previousGoal?: GoalRecord | null): Promise<void>;
    /**
     * Emits a user message chunk.
     *
     * @param text - The user message text content
     * @param timestamp - Optional server-side timestamp (ISO string or ms) for message ordering
     */
    emitUserMessage(text: string, timestamp?: string | number, options?: {
        source?: string;
    }): Promise<void>;
    /**
     * Emits an agent thought chunk.
     *
     * @param text - The thought text content
     * @param timestamp - Optional server-side timestamp (ISO string or ms) for message ordering
     */
    emitAgentThought(text: string, timestamp?: string | number, subagentMeta?: SubagentMeta): Promise<void>;
    /**
     * Emits an agent message chunk.
     *
     * @param text - The agent message text content
     * @param timestamp - Optional server-side timestamp (ISO string or ms) for message ordering
     */
    emitAgentMessage(text: string, timestamp?: string | number, subagentMeta?: SubagentMeta): Promise<void>;
    emitSlashCommandOutput(text: string, timestamp?: string | number): Promise<void>;
    /**
     * Emits usage metadata.
     */
    emitUsageMetadata(usageMetadata: GenerateContentResponseUsageMetadata, text?: string, durationMs?: number, subagentMeta?: SubagentMeta): Promise<void>;
    /**
     * Emits a message chunk based on role and thought flag.
     * This is the unified method that handles all message types.
     *
     * @param text - The message text content
     * @param role - Whether this is a user or assistant message
     * @param isThought - Whether this is an assistant thought (only applies to assistant role)
     * @param timestamp - Optional server-side timestamp (ISO string or ms) for message ordering
     */
    emitMessage(text: string, role: 'user' | 'assistant', isThought?: boolean, timestamp?: string | number, subagentMeta?: SubagentMeta): Promise<void>;
}
