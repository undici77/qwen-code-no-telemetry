/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { GoalSnapshotV2 } from '@qwen-code/qwen-code-core';
export declare function useFooterGoalState(): GoalSnapshotV2 | undefined;
export declare function isLiveGoalSnapshot(
  snapshot: GoalSnapshotV2 | undefined,
): boolean;
export interface GoalPillProps {
  snapshot: GoalSnapshotV2 | undefined;
}
export declare const GoalPill: React.FC<GoalPillProps>;
