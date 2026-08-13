/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type GoalCommandOperation, type SlashCommand } from './types.js';
export type ParsedGoalCommand = GoalCommandOperation | {
    kind: 'error';
    message: string;
};
export declare function parseGoalCommand(args: string): ParsedGoalCommand;
export declare const goalCommand: SlashCommand;
