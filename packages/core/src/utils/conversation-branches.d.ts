/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ChatRecord } from '../services/chatRecordingService.js';
export type ConversationBranchClassification =
  | 'ordinary'
  | 'rewind-descendant'
  | 'rewind-sibling'
  | 'mixed-rewind';
export interface ConversationBranchSummary {
  leafUuid: string;
  branchPointUuid: string | null;
  classification: ConversationBranchClassification;
  containsRewindUuids: string[];
  siblingRewindUuids: string[];
  firstUserTextAfterBranchPoint?: string;
  lastUserText?: string;
  lastAssistantText?: string;
  recordCounts: {
    user: number;
    assistant: number;
    toolResult: number;
    system: number;
  };
  startedAt: string;
  updatedAt: string;
}
export type ConversationBranchDiagnostic =
  | {
      kind: 'missing-parent';
      childUuid: string;
      missingParentUuid: string;
    }
  | {
      kind: 'parent-cycle';
      uuids: string[];
    }
  | {
      kind: 'conflicting-parent';
      uuid: string;
      parentUuids: Array<string | null>;
    };
export interface ConversationBranchAnalysis {
  branches: ConversationBranchSummary[];
  diagnostics: ConversationBranchDiagnostic[];
}
export declare function inspectConversationBranches(
  records: readonly ChatRecord[],
): ConversationBranchAnalysis;
