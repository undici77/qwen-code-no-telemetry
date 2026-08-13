/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { WorkspaceRegistry, WorkspaceRuntime } from '../workspace-registry.js';
export interface RealtimeStartupContextOptions {
    runtime: WorkspaceRuntime;
    workspaceRegistry: WorkspaceRegistry;
    sessionId: string;
    currentCwd: string;
    userRoot?: string;
}
export declare function truncateRealtimeTextToTokenBudget(text: string, budgetTokens: number): string;
export declare function buildRealtimeStartupContext(options: RealtimeStartupContextOptions): Promise<string | undefined>;
