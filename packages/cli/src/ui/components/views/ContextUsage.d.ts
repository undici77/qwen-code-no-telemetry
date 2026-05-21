/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { ContextCategoryBreakdown, ContextToolDetail, ContextMemoryDetail, ContextSkillDetail } from '../../types.js';
interface ContextUsageProps {
    modelName: string;
    totalTokens: number;
    contextWindowSize: number;
    breakdown: ContextCategoryBreakdown;
    builtinTools: ContextToolDetail[];
    mcpTools: ContextToolDetail[];
    memoryFiles: ContextMemoryDetail[];
    skills: ContextSkillDetail[];
    /** True when totalTokens is estimated (no API call yet) */
    isEstimated?: boolean;
    /** When true, show per-item detail breakdowns. Default: false (compact). */
    showDetails?: boolean;
}
export declare const ContextUsage: React.FC<ContextUsageProps>;
export {};
