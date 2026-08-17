/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type GoalEvidenceCatalog,
  type GoalEvidenceRecord,
} from './goal-evidence.js';
import { type GoalCheckpointVerifier } from './goal-checkpoint.js';
import {
  type GoalControlRequest,
  type GoalSnapshotV2,
  type GoalStateCause,
  type GoalStateRecordPayloadV2,
  type GoalStateResponse,
  type GoalTerminalProposal,
  type GoalTurnPermit,
  type TranscriptCursor,
} from './goal-protocol.js';
import type { GoalVerifier } from './goal-verifier.js';
import { type GoalRecoveryRecord } from './goal-persistence.js';
export declare const GOAL_RUNTIME_DISPOSED_MESSAGE =
  'Goal runtime has been disposed';
export declare const STALE_GOAL_TURN_MESSAGE =
  'Goal turn permit is no longer valid';
export interface GoalJournal {
  getTranscriptCursor(): TranscriptCursor;
  recordGoalState(
    recordUuid: string,
    payload: GoalStateRecordPayloadV2,
  ): Promise<unknown>;
}
export interface CreateGoalRuntimeOptions {
  journal: GoalJournal;
  evidenceSource?: GoalEvidenceSource;
  verifier?: GoalVerifier;
  checkpointVerifier?: GoalCheckpointVerifier;
}
export interface GoalEvidenceSource {
  flush(): Promise<void>;
  readActiveTranscriptChain(): Promise<readonly GoalEvidenceRecord[]>;
}
export declare class GoalPersistenceUnavailableError extends Error {
  constructor(message?: string, options?: ErrorOptions);
}
export interface GoalTurnHost {
  startGoalTurn(input: {
    permit: GoalTurnPermit;
    continuationContext: string;
    verifierFeedback?: string;
  }): Promise<void>;
  preemptGoalTurn(reason: string): void;
}
export interface GoalProposalReceipt {
  recorded: boolean;
  readyForVerification: boolean;
}
export interface GoalWorkerView {
  goalId: string;
  revision: number;
  objective: string;
  evidenceCursor: TranscriptCursor;
  evidenceCatalog?: GoalEvidenceCatalog;
  verifierFeedback?: string;
}
export interface GoalPendingProposal {
  permit: GoalTurnPermit;
  proposal: GoalTerminalProposal;
}
export interface GoalRuntime {
  getSnapshot(): GoalSnapshotV2;
  getSnapshotForPermit?(permit: GoalTurnPermit): GoalSnapshotV2;
  /**
   * The cause the last successful {@link restore} broadcast, or undefined if
   * nothing was recovered. Lets a subscriber that attached after restore —
   * the ACP resume path always does — republish the recovered state with the
   * cause the broadcast carried.
   */
  getRecoveryCause?(): GoalStateCause | undefined;
  subscribe(
    listener: (snapshot: GoalSnapshotV2, cause?: GoalStateCause) => void,
  ): () => void;
  restore(records: readonly GoalRecoveryRecord[]): Promise<void>;
  dispatch(request: GoalControlRequest): Promise<GoalStateResponse>;
  bindHost(host: GoalTurnHost): () => void;
  beginTurn(turnKey: string): GoalTurnPermit | undefined;
  releaseTurn(turnKey: string): Promise<boolean>;
  permitForTurn(turnKey: string): GoalTurnPermit | undefined;
  getVerifierFeedback(permit: GoalTurnPermit): string | undefined;
  finishTurn(permit: GoalTurnPermit): Promise<void>;
  getGoalForWorker(permit: GoalTurnPermit): Promise<GoalWorkerView>;
  recordTerminalProposal(
    permit: GoalTurnPermit,
    proposal: GoalTerminalProposal,
  ): GoalProposalReceipt;
  takePendingTerminalProposal(): GoalPendingProposal | undefined;
  dispose(): void;
}
export declare function createGoalRuntime(
  options: CreateGoalRuntimeOptions,
): GoalRuntime & {
  getSnapshotForPermit(permit: GoalTurnPermit): GoalSnapshotV2;
};
