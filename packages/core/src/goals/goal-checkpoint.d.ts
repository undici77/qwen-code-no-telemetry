/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ValidatedGoalEvidenceRecord } from './goal-evidence.js';
import type {
  GoalEvidenceCheckpoint,
  GoalEvidenceCheckpointClaim,
  GoalEvidenceProofKind,
} from './goal-protocol.js';
export interface GoalCheckpointVerifierClaim {
  proofKind: GoalEvidenceProofKind;
  claim: string;
  sourceRefs: string[];
}
export interface GoalCheckpointVerifierInput {
  goal: {
    goalId: string;
    revision: number;
    objective: string;
  };
  previousClaims: readonly GoalEvidenceCheckpointClaim[];
  evidence: readonly ValidatedGoalEvidenceRecord[];
}
export interface GoalCheckpointVerificationResult {
  claims: GoalCheckpointVerifierClaim[];
}
export type GoalCheckpointVerifier = (
  input: GoalCheckpointVerifierInput,
  attemptSignal?: AbortSignal,
) => Promise<GoalCheckpointVerificationResult>;
export declare class InvalidGoalCheckpointError extends Error {
  constructor(message: string);
}
export declare function materializeGoalEvidenceCheckpoint(input: {
  checkpointId: string;
  createdAt: number;
  previousClaims: readonly GoalEvidenceCheckpointClaim[];
  evidence: readonly ValidatedGoalEvidenceRecord[];
  result: GoalCheckpointVerificationResult;
}): GoalEvidenceCheckpoint;
