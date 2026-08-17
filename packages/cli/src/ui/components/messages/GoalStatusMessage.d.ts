/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import type { GoalSnapshotV2, GoalStateCause } from '@qwen-code/qwen-code-core';
import { type GoalStatusKind } from '../../types.js';
interface LegacyGoalStatusMessageProps {
  kind: GoalStatusKind;
  condition: string;
  iterations?: number;
  durationMs?: number;
  lastReason?: string;
  snapshot?: never;
  cause?: never;
}
interface GoalStateMessageProps {
  snapshot: GoalSnapshotV2;
  cause?: GoalStateCause;
  kind?: never;
  condition?: never;
  iterations?: never;
  durationMs?: never;
  lastReason?: never;
}
type GoalStatusMessageProps =
  | LegacyGoalStatusMessageProps
  | GoalStateMessageProps;
export declare const GoalStatusMessage: React.NamedExoticComponent<GoalStatusMessageProps>;
export {};
