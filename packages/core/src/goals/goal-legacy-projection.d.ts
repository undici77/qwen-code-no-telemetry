/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  GoalRecord,
  GoalSnapshotV2,
  GoalStateCause,
  GoalStateRecordPayloadV2,
} from './goal-protocol.js';
export type LegacyGoalStatusKind =
  | 'set'
  | 'achieved'
  | 'cleared'
  | 'failed'
  | 'aborted'
  | 'paused'
  | 'checking';
export interface LegacyGoalStatus {
  type: 'goal_status';
  kind: LegacyGoalStatusKind;
  condition: string;
  iterations?: number;
  setAt?: number;
  durationMs?: number;
  lastReason?: string;
}
export interface LegacyActiveGoal {
  readonly condition: string;
  readonly iterations: number;
  readonly setAt: number;
  readonly tokensAtStart?: number;
  readonly hookId?: string;
  readonly lastReason?: string;
}
export interface LegacyGoalTerminal {
  kind: 'achieved' | 'failed' | 'aborted';
  condition: string;
  iterations: number;
  durationMs: number;
  lastReason?: string;
}
export interface LegacyGoalProjection {
  activeGoal: LegacyActiveGoal | null;
  goalStatus: LegacyGoalStatus;
  goalTerminal: LegacyGoalTerminal | null;
}
export declare function projectGoalStateToLegacy(
  payload: GoalStateRecordPayloadV2,
  previousGoal?: GoalRecord | null,
): LegacyGoalProjection;
export declare function isGoalCheckpointBookkeepingRecord(input: {
  cause: GoalStateCause;
  previousCause: GoalStateCause | undefined;
  previous: GoalSnapshotV2 | undefined;
  next: GoalSnapshotV2;
}): boolean;
