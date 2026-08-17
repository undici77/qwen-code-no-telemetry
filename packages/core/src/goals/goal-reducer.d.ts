/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type GoalControlRequest,
  type GoalRecord,
  type GoalSnapshotV2,
  type GoalStateCause,
  type GoalStateRecordPayloadV2,
  type TranscriptCursor,
} from './goal-protocol.js';
export interface GoalControlTransition {
  request: GoalControlRequest;
  now: number;
  nextGoalId: string;
  cursor: TranscriptCursor;
}
export interface GoalTurnFinishedTransition {
  now: number;
  lastReason?: string;
}
export declare class GoalConflictError extends Error {
  readonly current: GoalSnapshotV2;
  constructor(current: GoalSnapshotV2);
}
export declare class GoalInvalidTransitionError extends Error {
  readonly current: GoalSnapshotV2;
  constructor(message: string, current: GoalSnapshotV2);
}
export declare function elapsedActiveTime(
  goal: GoalRecord,
  now: number,
): number;
export declare function reduceGoalControl(
  current: GoalRecord | null,
  transition: GoalControlTransition,
): GoalRecord | null;
export declare function reduceGoalTurnFinished(
  current: GoalRecord,
  transition: GoalTurnFinishedTransition,
): GoalRecord;
export declare function parseGoalControlRequest(
  value: unknown,
): GoalControlRequest | undefined;
export declare function parseGoalStateRecordPayloadV2(
  value: unknown,
): GoalStateRecordPayloadV2 | undefined;
export declare function parseGoalSnapshotV2(
  value: unknown,
): GoalSnapshotV2 | undefined;
export declare function parseGoalStateCause(
  value: unknown,
): GoalStateCause | undefined;
