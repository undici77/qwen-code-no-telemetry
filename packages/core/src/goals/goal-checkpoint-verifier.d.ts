/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { GoalCheckpointVerificationResult, GoalCheckpointVerifier } from './goal-checkpoint.js';
export interface CreateGoalCheckpointVerifierOptions {
    timeoutMs?: number;
}
export declare class GoalCheckpointVerifierInputTooLargeError extends Error {
    readonly byteLength: number;
    constructor(byteLength: number);
}
export declare function parseGoalCheckpointVerifierText(text: string): GoalCheckpointVerificationResult;
export declare function validateGoalCheckpointVerifierText(text: string): string | null;
export declare function createGoalCheckpointVerifier(config: Config, options?: CreateGoalCheckpointVerifierOptions): GoalCheckpointVerifier;
