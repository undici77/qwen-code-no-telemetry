/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC } from 'react';
export interface InsightProgressCardProps {
    stage: string;
    progress: number;
    detail?: string;
}
export declare const InsightProgressCard: FC<InsightProgressCardProps>;
