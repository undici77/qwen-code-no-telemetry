/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const TODO_STOP_GUARD_MAX_ATTEMPTS = 2;
export type TodoStopGuardContinuation = {
  attempt: number;
  maxAttempts: number;
  unfinishedCount: number;
  toolClosure?: true;
};
export type TodoStopGuardDecision =
  | {
      kind: 'inactive';
    }
  | {
      kind: 'deferred';
    }
  | ({
      kind: 'continue';
    } & TodoStopGuardContinuation)
  | ({
      kind: 'exhausted';
    } & TodoStopGuardContinuation);
export declare class DaemonTodoStopGuard {
  #private;
  readonly enabled: boolean;
  constructor(enabled: boolean);
  get hasTrustedUnfinishedState(): boolean;
  get isHardSuspended(): boolean;
  get hasCommittedContinuation(): boolean;
  get blocksUnrelatedAutomaticTurns(): boolean;
  get needsStopInspection(): boolean;
  clearTrust(): void;
  startOrdinaryPrompt(): void;
  resumeTrustedPrompt(): void;
  blockUntilOrdinaryPromptStarts(): void;
  acceptMidTurnUserInput(): void;
  observeTodoWrite(resultDisplay: unknown, allowArm: boolean): boolean;
  suspend(): void;
  pauseForTrustedRetry(): void;
  awaitQueuedPrompt(): boolean;
  decide(hasRelevantBackgroundInput: boolean): TodoStopGuardDecision;
  decideToolClosure(
    currentAttempt: number,
    hasRelevantBackgroundInput: boolean,
  ): TodoStopGuardDecision;
  commitContinuation(attempt: number): boolean;
  markExhaustionReported(): boolean;
}
