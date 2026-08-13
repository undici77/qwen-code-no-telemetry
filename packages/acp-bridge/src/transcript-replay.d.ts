/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionUpdate, ToolCallContent, ToolCallLocation, ToolKind } from '@agentclientprotocol/sdk';
import { type TranscriptProjectionDiagnostic, type TranscriptRecordInput, type TranscriptReplayGapInput } from '@qwen-code/qwen-code-core/transcriptRecords';
import { type GoalSnapshotV2, type GoalStateCause } from '@qwen-code/qwen-code-core/goalWire';
export declare const MISSING_TRANSCRIPT_TOOL_RESULT_MESSAGE: string;
export interface TranscriptReplayEmission {
    readonly sourceRecordId: string;
    readonly sourceTimestamp?: string;
    readonly emissionOrdinal: number;
    readonly update: SessionUpdate;
}
export interface TranscriptReplayUsageState {
    readonly promptTokens: number;
    readonly cachedTokens: number;
    readonly candidateTokens: number;
    readonly apiTimeMs: number;
}
export interface PendingTranscriptToolCall {
    readonly callId: string;
    readonly toolName: string;
    readonly sourceRecordId: string;
    readonly sourceTimestamp?: string;
}
export interface TranscriptReplayStateV1 {
    readonly v: 1;
    readonly pendingToolCalls: readonly PendingTranscriptToolCall[];
    readonly cumulativeUsage: TranscriptReplayUsageState;
    readonly goalState?: GoalSnapshotV2;
    readonly goalCause?: GoalStateCause;
}
export interface TranscriptReplayToolMetadata {
    readonly title: string;
    readonly locations: readonly ToolCallLocation[];
    readonly kind: ToolKind;
}
export interface TranscriptReplayPresentationAdapter {
    resolveToolMetadata(toolName: string, args: Readonly<Record<string, unknown>>): TranscriptReplayToolMetadata;
    formatHistoryGap(gap: TranscriptReplayGapInput): string;
    buildToolResultContentPrefix?(resultDisplay: unknown): readonly ToolCallContent[];
}
export interface TranscriptReplayMachineOptions {
    readonly initialState?: TranscriptReplayStateV1;
    readonly gaps?: readonly TranscriptReplayGapInput[];
    readonly presentation?: TranscriptReplayPresentationAdapter;
    readonly onDiagnostic?: (diagnostic: TranscriptProjectionDiagnostic) => void;
}
export interface TranscriptReplayMachine {
    project(record: TranscriptRecordInput): Iterable<TranscriptReplayEmission>;
    finalize(): Iterable<TranscriptReplayEmission>;
    snapshot(): TranscriptReplayStateV1;
}
interface UpdateMetaOptions {
    readonly timestamp?: string | number;
    readonly sourceRecordIds?: readonly string[];
    readonly planToolCallId?: string;
    readonly todoPlanId?: string;
    readonly extra?: Readonly<Record<string, unknown>>;
}
export interface TranscriptMessageUpdateOptions extends UpdateMetaOptions {
    readonly role: 'user' | 'assistant';
    readonly text: string;
    readonly thought?: boolean;
}
export interface TranscriptToolCallStartOptions extends UpdateMetaOptions {
    readonly toolName: string;
    readonly callId: string;
    readonly args?: Readonly<Record<string, unknown>>;
    readonly status?: 'pending' | 'in_progress' | 'completed' | 'failed';
    readonly metadata: TranscriptReplayToolMetadata;
    readonly asUpdate?: boolean;
}
export interface TranscriptToolCallResultOptions extends UpdateMetaOptions {
    readonly toolName: string;
    readonly callId: string;
    readonly success: boolean;
    readonly message?: readonly unknown[];
    readonly resultDisplay?: unknown;
    readonly errorMessage?: string;
    readonly artifacts?: readonly unknown[];
    readonly contentPrefix?: readonly ToolCallContent[];
}
export interface TranscriptTodoItem {
    readonly id?: string;
    readonly content: string;
    readonly status: 'pending' | 'in_progress' | 'completed';
    readonly blockedBy?: readonly string[];
}
export interface TranscriptTodoPlan {
    readonly planId?: string;
    readonly todos: TranscriptTodoItem[];
}
export interface TranscriptUsageUpdateOptions extends UpdateMetaOptions {
    readonly text?: string;
}
export interface TranscriptUsageMetadataInput {
    readonly promptTokenCount?: unknown;
    readonly candidatesTokenCount?: unknown;
    readonly totalTokenCount?: unknown;
    readonly thoughtsTokenCount?: unknown;
    readonly cachedContentTokenCount?: unknown;
}
export declare function toTranscriptEpochMs(timestamp?: string | number): number | undefined;
export declare function createTranscriptMessageUpdate(options: TranscriptMessageUpdateOptions): SessionUpdate;
export declare function createTranscriptImageUpdate(options: UpdateMetaOptions & {
    readonly data: string;
    readonly mimeType: string;
}): SessionUpdate;
export declare function createTranscriptUsageUpdate(usageMetadata: TranscriptUsageMetadataInput, options?: TranscriptUsageUpdateOptions): SessionUpdate;
export declare function createTranscriptToolCallStartUpdate(options: TranscriptToolCallStartOptions): SessionUpdate;
export declare function createTranscriptToolCallResultUpdate(options: TranscriptToolCallResultOptions): SessionUpdate;
export declare function createTranscriptPlanUpdate(todos: readonly TranscriptTodoItem[], cumulativeUsage?: TranscriptReplayUsageState, options?: UpdateMetaOptions): SessionUpdate;
export declare function extractTranscriptTodos(resultDisplay: unknown, args?: Readonly<Record<string, unknown>>): TranscriptTodoItem[] | null;
export declare function extractTranscriptTodoPlan(resultDisplay: unknown, args?: Readonly<Record<string, unknown>>): TranscriptTodoPlan | null;
export declare function createTranscriptReplayMachine(options?: TranscriptReplayMachineOptions): TranscriptReplayMachine;
export {};
