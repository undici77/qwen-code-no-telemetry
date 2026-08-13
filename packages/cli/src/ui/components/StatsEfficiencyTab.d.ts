/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { StatsData } from '../utils/statsDataService.js';
export declare const EfficiencyTab: React.FC<{
    data: StatsData;
    bodyWidth: number;
    /** When set, only the top N models are listed (the rest collapse into a
     * "+N more" line). Used when the tab is embedded in a height-limited view. */
    maxModelRows?: number;
    /** When set, only the top N tools are listed (the rest collapse into a
     * "+N more" line). Used when the tab is embedded in a height-limited view so
     * a long tool leaderboard cannot overflow the host dialog. */
    maxToolRows?: number;
}>;
