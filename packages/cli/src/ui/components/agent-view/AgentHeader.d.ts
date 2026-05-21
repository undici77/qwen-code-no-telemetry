/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Compact header for agent tabs, visually distinct from the
 * main view's boxed logo header. Shows model, working directory, and git
 * branch in a bordered info panel.
 */
import type React from 'react';
interface AgentHeaderProps {
    modelId: string;
    modelName?: string;
    workingDirectory: string;
    gitBranch?: string;
}
export declare const AgentHeader: React.FC<AgentHeaderProps>;
export {};
