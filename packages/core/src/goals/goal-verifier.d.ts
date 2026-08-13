/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ValidatedGoalEvidenceRecord } from './goal-evidence.js';
import type { GoalTerminalProposal } from './goal-protocol.js';
export type GoalVerifierEvidenceRecord = ValidatedGoalEvidenceRecord;
interface GoalVerifierInputBase {
    goal: {
        goalId: string;
        revision: number;
        objective: string;
    };
    currentTurnId?: string;
    evidence: readonly GoalVerifierEvidenceRecord[];
    currentDeliveredOutput?: readonly string[];
}
export type GoalVerifierInput = GoalVerifierInputBase & ({
    proposal: GoalTerminalProposal & {
        status: 'complete';
    };
    blockedPolicy?: never;
} | {
    proposal: GoalTerminalProposal & {
        status: 'blocked';
    };
    blockedPolicy: string;
});
export type GoalVerificationResult = {
    decision: 'accept';
    reason: string;
} | {
    decision: 'reject';
    reason: string;
};
export type GoalVerifier = (input: GoalVerifierInput, attemptSignal?: AbortSignal) => Promise<GoalVerificationResult>;
export interface CreateGoalVerifierOptions {
    timeoutMs?: number;
}
export declare class GoalVerifierInputTooLargeError extends Error {
    readonly byteLength: number;
    constructor(byteLength: number);
}
export declare function parseGoalVerifierText(text: string): GoalVerificationResult;
export declare function validateGoalVerifierText(text: string): string | null;
export declare function createGoalVerifier(config: Config, options?: CreateGoalVerifierOptions): GoalVerifier;
export {};
