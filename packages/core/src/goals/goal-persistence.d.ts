/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ChatRecord } from '../services/chatRecordingService.js';
import { type GoalStateRecordPayloadV2 } from './goal-protocol.js';
export type GoalRecovery =
  | {
      kind: 'v2';
      payload: GoalStateRecordPayloadV2;
    }
  | {
      kind: 'legacy';
      objective: string;
    }
  | {
      kind: 'unsupported';
      reason: string;
    }
  | {
      kind: 'none';
    };
export type GoalRecoveryRecord = Pick<ChatRecord, 'uuid' | 'type'> & {
  subtype?: string;
  systemPayload?: unknown;
};
export declare function recoverGoalFromRecords(
  records: readonly GoalRecoveryRecord[],
): GoalRecovery;
export interface MigratedGoalStateInput {
  objective: string;
  goalId: string;
  recordUuid: string;
  now: number;
}
export declare function createMigratedGoalState(
  input: MigratedGoalStateInput,
): GoalStateRecordPayloadV2;
