/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GoalTurnHost, GoalTurnPermit } from '@qwen-code/qwen-code-core';
export interface QueuedGoalTurn {
    kind: 'goal';
    permit: GoalTurnPermit;
    turnKey: string;
    continuationContext: string;
    verifierFeedback?: string;
}
export interface QueuedUserSubmission {
    kind: 'user';
    modelText: string;
    submittedPrompt?: string;
    turnKey: string;
}
export interface DirectUserAdmission {
    turnKey: string;
    goal?: QueuedGoalTurn;
}
export type QueuedSubmission = QueuedUserSubmission | QueuedGoalTurn;
export type GoalQueueControlMode = 'normal' | 'priority' | 'only';
export interface UseMessageQueueReturn {
    messageQueue: string[];
    pendingSubmissionCount: number;
    addMessage: (message: string, deferUntilIdle?: boolean, submittedPrompt?: string) => void;
    enqueueGoalTurn: (input: Parameters<GoalTurnHost['startGoalTurn']>[0]) => void;
    peekNextUserBatchKey: (goalTurnActive?: boolean) => string | undefined;
    hasQueuedUserMessages: () => boolean;
    getPendingSubmissionCount: () => number;
    claimGoalTurn: () => QueuedGoalTurn | undefined;
    claimDirectUserAdmission: () => DirectUserAdmission;
    removeGoalTurns: () => string[];
    popNextSubmission: (goalControlMode?: GoalQueueControlMode) => QueuedSubmission | null;
    clearQueue: () => void;
    getQueuedMessagesText: () => string;
    popAllMessages: (onRemoved?: (turnKeys: string[]) => void) => QueuedUserSubmission | null;
    restoreMessages: (messages: string[], submittedPrompt?: string) => void;
    drainQueue: (includeDeferred?: boolean, goalTurnActive?: boolean) => string[];
}
export declare const GOAL_COMMAND_RE: RegExp;
export declare function useMessageQueue(): UseMessageQueueReturn;
