/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { ArenaAgentCardData } from '../../types.js';
interface ArenaAgentCardProps {
    agent: ArenaAgentCardData;
    width?: number;
}
export declare const ArenaAgentCard: React.FC<ArenaAgentCardProps>;
interface ArenaSessionCardProps {
    sessionStatus: string;
    task: string;
    totalDurationMs: number;
    agents: ArenaAgentCardData[];
    width?: number;
}
export declare const ArenaSessionCard: React.FC<ArenaSessionCardProps>;
export {};
