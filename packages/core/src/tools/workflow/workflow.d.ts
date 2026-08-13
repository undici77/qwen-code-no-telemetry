/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview WorkflowTool — user-facing tool that executes a workflow script
 * via WorkflowOrchestrator. Supports sequential `agent()`, plus concurrent
 * fan-out via `parallel()` / `pipeline()` throttled at the dispatch layer.
 */
import { BaseDeclarativeTool, type ToolInvocation, type ToolResult } from '../tools.js';
import type { Config } from '../../config/config.js';
import type { WorkflowAgentDispatch } from '../../agents/runtime/workflow-orchestrator.js';
export interface WorkflowParams {
    /**
     * Inline JavaScript source for the workflow. Provide exactly one of
     * `script` or `scriptPath`.
     */
    script?: string;
    /**
     * P7b: absolute path to a saved workflow `.js` file to load and run
     * instead of inline `script`. Set by the `/<name>` saved-workflow slash
     * command (`SavedWorkflowLoader`). Read at execution time so edits to the
     * saved file take effect on the next run; the resolved path is recorded on
     * the registry entry as run provenance.
     */
    scriptPath?: string;
    /** Optional structured value bound to the `args` global inside the script. */
    args?: unknown;
    /**
     * P6: resume a prior run by id. When set, the run reuses `<runId>` and
     * loads `<projectDir>/workflows/<runId>/journal.jsonl`; `agent()` calls
     * whose rolling prefix-hash matches a journaled result are served from
     * cache (no re-dispatch) for the longest unchanged prefix. The first miss
     * runs live and the run goes live for the remainder.
     */
    resumeFromRunId?: string;
    /** Return after registration and continue the run under session ownership. */
    run_in_background?: boolean;
}
export interface WorkflowToolOptions {
    /**
     * Test-only dispatch injection. Production callers should leave this
     * undefined so createProductionDispatch wires real AgentHeadless.
     */
    dispatch?: WorkflowAgentDispatch;
}
export declare class WorkflowTool extends BaseDeclarativeTool<WorkflowParams, ToolResult> {
    private readonly config;
    private readonly toolOptions;
    constructor(config: Config, toolOptions?: WorkflowToolOptions);
    protected validateToolParamValues(params: WorkflowParams): string | null;
    protected createInvocation(params: WorkflowParams): ToolInvocation<WorkflowParams, ToolResult>;
}
