/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../../config/config.js';
import type {
  WorkflowAgentOpts,
  WorkflowAgentResult,
  WorkflowBudget,
  WorkflowMeta,
  WorkflowOrchestratorEmitter,
} from './workflow-sandbox.js';
import type { WorkflowJournal, JournalReplay } from './workflow-journal.js';
import { AgentEventEmitter } from './agent-events.js';
import { WorkflowDispatchScheduler } from './workflow-dispatch-scheduler.js';
/**
 * Default ceiling on total `agent()` calls per workflow run (matches upstream
 * `hOK = 1000`). Counts EVERY dispatch — sequential, `parallel()`, and
 * `pipeline()` all funnel through the one wrapped dispatch — so a fan-out
 * cannot bypass it. The 1001st call throws. Override via env (see below).
 */
export declare const DEFAULT_MAX_AGENTS_PER_RUN = 1000;
export declare const MAX_WORKFLOW_AGENTS_ENV = 'QWEN_CODE_MAX_WORKFLOW_AGENTS';
/**
 * Absolute upper bound on the env-override agent cap. Even an operator who
 * sets `QWEN_CODE_MAX_WORKFLOW_AGENTS=999999999` cannot exceed this — the
 * intent is to catch fat-finger / misconfig that would silently uncap a
 * runaway workflow (1000-agent default × per-agent token cost). 10000 is
 * 10× the default, generous for legitimate large fan-outs.
 */
export declare const HARD_MAX_AGENTS_PER_RUN_CEILING = 10000;
/**
 * Resolve the per-run agent cap, honoring `QWEN_CODE_MAX_WORKFLOW_AGENTS`.
 * Mirrors `resolveMaxConcurrentBackgroundAgents` (background-tasks.ts): a
 * non-integer / <1 override is rejected with a debug warning and the default
 * is used. An override above `HARD_MAX_AGENTS_PER_RUN_CEILING` is clamped
 * (with a debug warning) — the env knob is operator-facing, not security-
 * critical, but a misconfigured ceiling shouldn't silently uncap the run.
 */
export declare function resolveMaxAgentsPerRun(
  env?: Record<string, string | undefined>,
): number;
export declare const MAX_WORKFLOW_CONCURRENCY_ENV =
  'QWEN_CODE_MAX_WORKFLOW_CONCURRENCY';
/**
 * Absolute upper bound on the env-override concurrency window. Above this,
 * a single Node process running N concurrent LLM calls is past the point a
 * distributed worker is the better tool. 64 ≈ 4× the 16-default ceiling.
 */
export declare const HARD_MAX_CONCURRENCY_CEILING = 64;
/**
 * Maximum agents in flight at once within a single run, shared across all
 * `parallel()` / `pipeline()` calls. `min(16, cpus-2)` mirrors upstream;
 * `max(1, …)` guards 1–2 core machines where `cpus-2 <= 0` would otherwise
 * produce a deadlocking limit. `QWEN_CODE_MAX_WORKFLOW_CONCURRENCY` overrides
 * the computed value with an explicit integer in `[1, HARD_MAX_CONCURRENCY_CEILING]`;
 * an invalid override falls back to the cpu-derived default with a debug
 * warning, and an over-ceiling override is clamped.
 */
export declare function resolveConcurrencyLimit(
  env?: Record<string, string | undefined>,
): number;
/**
 * `WorkflowExecutionError` preserves the phases and logs the script
 * accumulated before failing — without it, all diagnostic context is lost
 * when the orchestrator's catch block surfaces only `err.message`.
 *
 * `cause` carries the underlying error message but no host-realm Error
 * object: we only ever store strings to avoid re-introducing the T1
 * thrown-Error realm-escape vector.
 */
export declare class WorkflowExecutionError extends Error {
  readonly phases: string[];
  readonly logs: string[];
  /**
   * The extracted meta if it was parsed before the script body threw —
   * null otherwise (no declaration in the source, or malformed meta
   * which itself was the failure). Surfaced so the tool's failure
   * display can still show the workflow's name / description / phases.
   */
  readonly meta: WorkflowMeta | null;
  readonly name = 'WorkflowExecutionError';
  constructor(
    message: string,
    phases: string[],
    logs: string[],
    /**
     * The extracted meta if it was parsed before the script body threw —
     * null otherwise (no declaration in the source, or malformed meta
     * which itself was the failure). Surfaced so the tool's failure
     * display can still show the workflow's name / description / phases.
     */
    meta?: WorkflowMeta | null,
  );
}
export type { WorkflowAgentResult, WorkflowMeta, WorkflowOrchestratorEmitter };
export interface WorkflowRunRequest {
  script: string;
  args: unknown;
  /**
   * T40 (PR #4732 R4): caller-owned AbortController linked to the wall-clock
   * timeout. When the sandbox times out, this controller is aborted BEFORE
   * the rejection propagates — letting in-flight subagent dispatches see
   * the cancellation and stop burning tokens. The caller (`WorkflowTool`)
   * also threads this same controller's signal into `createProductionDispatch`
   * and aborts it in its own `finally` block to clean up on normal completion.
   * If omitted, the wall-clock still rejects but in-flight subagents continue
   * until their internal `max_time_minutes` limit.
   */
  abortOnTimeout?: AbortController;
  /**
   * P4b: optional host-side event channel. When provided, the orchestrator
   * fires `agentDispatched` / `agentCompleted` inside `countedDispatch`
   * and the sandbox fires `phaseStarted` / `logAppended` from `safePhase`
   * / `safeLog`. Wired into `SandboxOptions.emitter` and used by
   * `WorkflowTool` to keep the `WorkflowRunRegistry` record in sync
   * with the run state for the pill + dialog + detail body.
   */
  emitter?: WorkflowOrchestratorEmitter;
  /**
   * P4b: pre-generated run identifier. Callers that need the id at
   * register-time (e.g. `WorkflowTool` registering the run with
   * `WorkflowRunRegistry` before `run()` resolves) must pre-generate
   * one and pass it here. The orchestrator does NOT validate the
   * shape — it trusts the caller (the production caller uses
   * `wf_<8hex>` to match `generateRunId()`). Omitted by tests and by
   * the historical contract; orchestrator falls back to its own
   * generator so existing call sites work unchanged.
   */
  runId?: string;
  /**
   * P5: optional per-run token budget. When provided, `countedDispatch`
   * checks `budget.remaining() > 0` BEFORE each `agent()` dispatch and
   * throws `WorkflowBudgetExceededError` if the cap is hit. Also
   * surfaced via `SandboxOptions.budget` so the script-side `budget`
   * global reads the live state (`budget.spent()` / `budget.remaining()`
   * for dynamic-loop patterns).
   *
   * Token recording happens inside the production dispatch
   * (`createProductionDispatch` reads `subagent.core.stats.getSummary
   * (...).outputTokens` after each successful execute and reports back
   * via the `onTokens` callback the WorkflowTool wires through). Test
   * dispatches that want to assert budget gating should call
   * `budget.recordSpent(N)` directly.
   */
  budget?: WorkflowBudget;
  /**
   * P-nested: resolver for the `workflow(nameOrRef, args)` global. When
   * provided, the top-level sandbox exposes `workflow`, which resolves a
   * saved workflow (by name from `.qwen/workflows/<name>.js`, or by
   * `{scriptPath}`) and runs it as a nested orchestration that shares THIS
   * run's agent-count cap, concurrency window, token budget, and emitter
   * (so nested phases/logs and token spend roll into the same registry
   * entry). Nesting is limited to a single level: the nested sandbox is
   * created without a `workflow` impl, so a second-level `workflow()` call
   * throws. When omitted, `workflow()` throws "unavailable". The production
   * caller (`WorkflowTool`) wires `resolveSavedWorkflowScript(ref, config)`;
   * tests inject a mock resolver.
   */
  resolveSavedWorkflow?: (
    nameOrRef:
      | string
      | {
          scriptPath: string;
        },
  ) => Promise<{
    script: string;
    scriptPath?: string;
    name?: string;
  }>;
  /**
   * P6: append-only resume journal for THIS run. When provided, every live
   * `agent()` dispatch appends a `started` then a `result` line keyed by the
   * rolling prefix-hash. Always set by the production caller (`WorkflowTool`)
   * so any run is resumable; omitted by tests that don't exercise resume.
   */
  journal?: WorkflowJournal;
  /**
   * P6: replay maps loaded from a prior run's journal. Present only when
   * resuming (`Workflow({resumeFromRunId})`). Cached results are served for
   * the longest unchanged prefix; the first cache miss flips the run to
   * live for the remainder ("first miss invalidates the suffix").
   */
  resumeReplay?: JournalReplay;
  /** Per-run scheduler shared with the registry-owned run handle. */
  scheduler?: WorkflowDispatchScheduler;
}
export interface WorkflowRunOutcome {
  runId: string;
  result: unknown;
  phases: string[];
  logs: string[];
  /**
   * The script's `export const meta = {...}` declaration (P4). `null` when
   * the script omits the declaration. Surfaced verbatim from the sandbox's
   * `getMeta()` so callers (`/workflows` listing, phase-tree UI) can read
   * the workflow's name / description / phases / whenToUse without
   * re-parsing the script source.
   */
  meta: WorkflowMeta | null;
}
export type WorkflowAgentDispatch = (
  prompt: string,
  opts: WorkflowAgentOpts,
) => Promise<WorkflowAgentResult>;
/**
 * Build the production agent-dispatch function.
 *
 * Wraps AgentHeadless.create + execute + getFinalText into the
 * `(prompt, opts) => Promise<string>` shape required by the sandbox.
 *
 * Dynamic import lets test mocks swap agent-headless without static-import
 * hoisting interference.
 *
 * FIX-6 (ARCH-C1): accepts an optional AbortSignal and threads it into
 * subagent.execute() so cancellation from the caller propagates correctly.
 * When signal is undefined, subagent.execute() runs without external abort.
 *
 * P3 dispatch routing — two paths:
 *
 *  - **Fast path** (no `agentType` and no `model`): direct
 *    `AgentHeadless.create` with the default workflow subagent prompt and
 *    the hardcoded resource bounds + disallowed-tool floor. P1/P2 behaviour
 *    unchanged — zero added overhead, no SubagentManager touch.
 *
 *  - **Override path** (`agentType` and/or `model` set): route through
 *    `SubagentManager.createAgentHeadless` so per-call model overrides go
 *    through `buildRuntimeContentGeneratorView` (provider routing) and
 *    per-agent MCP servers / hooks get their own ToolRegistry + lifecycle.
 *    `dispose()` runs in a `finally` block so the rebuilt registry never
 *    leaks past a dispatch — even on a thrown subagent.execute().
 */
export declare function createProductionDispatch(
  config: Config,
  signal?: AbortSignal,
  /**
   * P5: callback fired after each successful subagent.execute with the
   * agent's output token count (read from `core.stats.getSummary`).
   * `WorkflowTool` wires this to `budget.recordSpent` so the per-run
   * budget tracks every dispatch's cost. Optional — when omitted
   * (tests, legacy callers), the dispatch behaves exactly as before,
   * just without budget recording.
   */
  onTokens?: (outputTokens: number, opts: WorkflowAgentOpts) => void,
  bridgeApprovalEvents?: (emitter: AgentEventEmitter) => () => void,
): WorkflowAgentDispatch;
export declare class WorkflowOrchestrator {
  private readonly dispatch;
  constructor(dispatch: WorkflowAgentDispatch);
  run(req: WorkflowRunRequest): Promise<WorkflowRunOutcome>;
}
