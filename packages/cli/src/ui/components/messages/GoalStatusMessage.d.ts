/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { type GoalStatusKind } from '../../types.js';
interface GoalStatusMessageProps {
    kind: GoalStatusKind;
    condition: string;
    iterations?: number;
    durationMs?: number;
    lastReason?: string;
}
export declare const GoalStatusMessage: React.NamedExoticComponent<GoalStatusMessageProps>;
export {};
