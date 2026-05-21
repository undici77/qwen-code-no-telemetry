/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { AgentTask } from './background-tasks.js';
export declare const DEFAULT_BACKGROUND_AGENT_CONTINUATION_MESSAGE = "Continue working on the current task from the last completed step.";
export declare class BackgroundAgentResumeService {
    private readonly config;
    private readonly resumeOperations;
    constructor(config: Config);
    loadPausedBackgroundAgents(sessionId: string): Promise<readonly AgentTask[]>;
    resumeBackgroundAgent(agentId: string, initialMessage?: string): Promise<AgentTask | undefined>;
    private resumeBackgroundAgentInternal;
    abandonBackgroundAgent(agentId: string): boolean;
    buildRecoveredBackgroundAgentsNotice(count: number): string;
    private resolveResumeTarget;
    private restorePausedEntry;
    private createResumedForkSubagent;
    private applySubagentStartHook;
    private runSubagentStopHookLoop;
}
