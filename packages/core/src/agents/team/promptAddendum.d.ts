/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview System prompt addendum for teammates.
 *
 * Appended to a teammate's system prompt to instruct it about
 * team communication and coordination. Leaders get NO team
 * instructions — they infer from tool availability.
 */
/**
 * Build the system prompt addendum for a teammate.
 *
 * @param teammateName - The teammate's display name.
 * @param teamName - The team name.
 * @param leaderName - The leader's display name.
 */
export declare function buildTeammatePromptAddendum(teammateName: string, teamName: string, leaderName: string, options?: {
    planModeRequired?: boolean;
    readOnly?: boolean;
}): string;
