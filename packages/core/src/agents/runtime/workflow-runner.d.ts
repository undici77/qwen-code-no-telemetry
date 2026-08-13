/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../../config/config.js';
import { type WorkflowRunRegistry, type WorkflowTask } from '../workflow-run-registry.js';
import { WorkflowExecutionError, type WorkflowAgentDispatch, type WorkflowRunOutcome } from './workflow-orchestrator.js';
import { WorkflowBudgetImpl } from './workflow-budget.js';
import { WorkflowDispatchScheduler } from './workflow-dispatch-scheduler.js';
export interface WorkflowRunnerOptions {
    config: Config;
    signal: AbortSignal;
    script?: string;
    scriptPath?: string;
    args: unknown;
    resumeFromRunId?: string;
    dispatch?: WorkflowAgentDispatch;
    onUpdate?: (entry: WorkflowTask) => void;
    runInBackground?: boolean;
}
export type WorkflowRunSettlement = {
    ok: true;
    outcome: WorkflowRunOutcome;
} | {
    ok: false;
    message: string;
    details?: WorkflowExecutionError;
};
export declare class WorkflowRunHandle {
    readonly runId: string;
    readonly budget: WorkflowBudgetImpl;
    readonly registry: WorkflowRunRegistry | undefined;
    private readonly controller;
    private readonly scheduler;
    readonly completion: Promise<WorkflowRunSettlement>;
    constructor(runId: string, budget: WorkflowBudgetImpl, registry: WorkflowRunRegistry | undefined, controller: AbortController, scheduler: WorkflowDispatchScheduler, start: () => Promise<WorkflowRunSettlement>);
    abort(): void;
    pause(): boolean;
    resume(): boolean;
}
export declare class WorkflowRunner {
    static start(options: WorkflowRunnerOptions): Promise<WorkflowRunHandle>;
}
