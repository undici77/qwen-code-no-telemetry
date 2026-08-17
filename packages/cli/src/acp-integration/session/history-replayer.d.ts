/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  ChatRecord,
  GoalSnapshotV2,
  GoalStateCause,
  HistoryGap,
} from '@qwen-code/qwen-code-core';
import { type TranscriptReplayStateV1 } from '@qwen-code/acp-bridge/transcriptReplay';
import type { SessionEmitterContext } from './types.js';
export declare const MISSING_TOOL_RESULT_MESSAGE: string;
export interface PendingReplayToolCall {
  callId: string;
  toolName: string;
  timestamp?: string;
  recordId: string;
}
export interface HistoryReplayPageOptions {
  pendingToolCalls?: PendingReplayToolCall[];
  finalizeDangling?: boolean;
  gaps?: HistoryGap[];
  goalState?: GoalSnapshotV2;
  goalCause?: GoalStateCause;
}
export interface HistoryReplayPageState {
  pendingToolCalls: PendingReplayToolCall[];
  replay: TranscriptReplayStateV1;
}
/**
 * Handles replaying session history on session load.
 *
 * Uses the unified emitters to ensure consistency with normal flow.
 * This ensures that replayed history looks identical to how it would
 * have appeared during the original session.
 */
export declare class HistoryReplayer {
  private readonly ctx;
  private readonly toolCallEmitter;
  private machine;
  constructor(ctx: SessionEmitterContext);
  replay(records: ChatRecord[], gaps?: HistoryGap[]): Promise<void>;
  replayPage(
    records: ChatRecord[],
    options?: HistoryReplayPageOptions,
  ): Promise<HistoryReplayPageState>;
  getPendingToolCalls(): PendingReplayToolCall[];
  getReplayState(): TranscriptReplayStateV1;
  private createMachine;
  private presentationAdapter;
  private sendUpdate;
  private copyCumulativeUsage;
  private setActiveRecordId;
}
