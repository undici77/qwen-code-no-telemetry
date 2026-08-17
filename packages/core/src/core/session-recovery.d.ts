/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, Part } from '@google/genai';
import { type ConversationRecord } from '../services/sessionService.js';
import type { HistoryGap } from '../utils/conversation-chain.js';
export type SessionRecoveryKind =
  | 'clean'
  | 'interrupted_prompt'
  | 'interrupted_turn'
  | 'degraded_history';
export type RecoveryRepair =
  | {
      type: 'synthesized_tool_result';
      callId: string;
      name: string;
    }
  | {
      type: 'dropped_duplicate_tool_result';
      callId: string;
      name: string;
    }
  | {
      type: 'history_gap';
      childUuid: string;
      missingParentUuid: string;
    };
export interface SessionRecoveryContinuation {
  mode: 'retry_user_parts' | 'tool_result_parts';
  parts: Part[];
  displayText: string;
}
export interface SessionRecoveryPlan {
  planId: string;
  sessionId: string;
  kind: SessionRecoveryKind;
  originalApiHistory: Content[];
  apiHistory: Content[];
  repairs: RecoveryRepair[];
  canContinue: boolean;
  canAutoContinue: boolean;
  requiresUserConfirmation: boolean;
  visibleNotice?: string;
  continuation?: SessionRecoveryContinuation;
}
export interface BuildSessionRecoveryPlanInput {
  sessionId: string;
  conversation: ConversationRecord;
  historyGaps?: HistoryGap[];
  options?: {
    allowAutoContinue?: boolean;
  };
}
export interface BuildSessionRecoveryPlanFromApiHistoryInput {
  sessionId: string;
  apiHistory: Content[];
  historyGaps?: HistoryGap[];
  options?: {
    allowAutoContinue?: boolean;
  };
}
export declare function buildSessionRecoveryPlan({
  sessionId,
  conversation,
  historyGaps,
  options,
}: BuildSessionRecoveryPlanInput): SessionRecoveryPlan;
export declare function buildSessionRecoveryPlanFromApiHistory({
  sessionId,
  apiHistory: inputApiHistory,
  historyGaps,
  options,
}: BuildSessionRecoveryPlanFromApiHistoryInput): SessionRecoveryPlan;
