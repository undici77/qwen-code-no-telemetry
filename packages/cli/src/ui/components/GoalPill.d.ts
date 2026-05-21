/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type ActiveGoal } from '@qwen-code/qwen-code-core';
/**
 * Hook exposed for parent containers (e.g. Footer) so they can omit the
 * surrounding divider chip entirely when no goal is active — avoids a stray
 * separator next to a render-null pill.
 */
export declare function useFooterGoalState(): ActiveGoal | undefined;
/**
 * Compact "Goal is running" indicator for the footer. Renders nothing when no
 * goal is active. Aligned with Claude Code 2.1.140's footer pill:
 *
 *   ◎ /goal active           (during the first second)
 *   ◎ /goal active (12s)     (afterwards, most-significant unit only)
 *
 * Turns count and last-check reason are intentionally NOT in the pill — those
 * live in `/goal` status output and the `goal_status` history items so the
 * footer stays terse and stops jitter from per-iteration count flicker.
 */
export declare const GoalPill: React.FC;
