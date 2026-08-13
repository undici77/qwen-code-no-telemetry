/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Strip a leading `export const meta = { ... }` declaration from a workflow
 * script. Required because Node's vm script mode rejects ES module syntax.
 *
 * P1 does not use meta semantically; it is removed so that Claude-Code-trained
 * models whose first line is `export const meta = {...}` do not produce a
 * SyntaxError at sandbox parse time.
 *
 * Recognises `//` / `/* *\/` comments and regex literals in addition to
 * string literals (single, double, template). Throws on unbalanced braces
 * instead of returning a truncated string — silently deleting the script
 * body produced the worst-case failure mode (workflow runs, returns
 * undefined, no diagnostic).
 *
 * Template-literal `${...}` substitutions that contain `{` or `}` are not
 * supported — model-authored `meta` should avoid them.
 */
export declare function stripExportMeta(source: string): string;
/**
 * The `meta` object shape — verbatim from upstream Claude Code 2.1.168.
 * `name` and `description` are mandatory; `whenToUse` and `phases` are
 * optional. Each phase carries a mandatory `title` and optional `detail`
 * / `model`. P4 surfaces this shape on `WorkflowRunOutcome.meta` so
 * `/workflows` listing and the phase-tree UI can read it directly.
 */
export interface WorkflowMeta {
    name: string;
    description: string;
    whenToUse?: string;
    phases?: Array<{
        title: string;
        detail?: string;
        model?: string;
    }>;
}
/**
 * Strip `export const meta = {...}` from the script AND extract the meta
 * object as a plain host-realm value, ready to surface on `WorkflowRunOutcome`.
 *
 * Implementation:
 *   1. `findMetaBlockBounds` (shared with `stripExportMeta`) locates the
 *      object-literal source range via the brace-walker.
 *   2. The literal source is evaluated as `(${metaSource})` inside a fresh
 *      vm context whose globalThis is a null-prototyped object — no
 *      bridge to the host realm, no access to host primitives like
 *      `process` / `require` / the workflow-sandbox bridge globals
 *      (`args` / `agent` / `phase` / `log` / etc.). The vm realm DOES
 *      provide its own intrinsics (`Object`, `Array`, `Math`, `Date`,
 *      `JSON`, …) which is fine: meta extraction is a one-shot at tool-
 *      invocation time, not replayed during resume, so non-determinism in
 *      the meta literal (a `Date.now()` call in `meta.name`) does not
 *      break the resume contract that the script body honors.
 *   3. The vm result is walked field-by-field and copied into a new
 *      host-realm plain object. No JSON round-trip is needed because every
 *      contract field is a primitive — strings and arrays of plain
 *      objects with string fields — so prototype identity on the
 *      intermediate values is irrelevant.
 *
 * Returns `{ stripped, meta: null }` when no meta declaration is present
 * (callers treat this as "no meta"). Throws when meta is present but
 * malformed: vm eval failure, missing required field, or wrong field type.
 * Error messages for the missing-required-field cases match upstream
 * 2.1.168 verbatim so script authors see one consistent error text.
 */
export declare function extractAndStripMeta(source: string): {
    stripped: string;
    meta: WorkflowMeta | null;
};
import type { WorkflowDispatchScheduler } from './workflow-dispatch-scheduler.js';
export declare const debugLogger: import("../../utils/debugLogger.js").DebugLogger;
/**
 * WorkflowAgentOpts — structured options for the `agent()` global.
 *
 * The named fields below are explicitly recognised. P1 throws for unsupported
 * fields (`schema`, `model`, `isolation`, `agentType`) rather than silently
 * dropping them. The runtime allowlist enforced in the vm-realm init script
 * additionally throws on ANY field not in the known set — catching typos
 * like `scema` before they reach dispatch.
 */
export interface WorkflowAgentOpts {
    label?: string;
    phase?: string;
    schema?: object;
    model?: string;
    isolation?: 'worktree' | 'remote';
    agentType?: string;
    /**
     * P-stall: per-call stall-watchdog timeout in milliseconds. The dispatch
     * is aborted + retried (up to 3 attempts) after this many ms of no
     * subagent progress (with no tool in flight). Defaults to 60_000 (env
     * override `QWEN_CODE_WORKFLOW_STALL_SECONDS`). `0` disables the watchdog
     * for this call.
     */
    stallMs?: number;
    [key: string]: unknown;
}
/**
 * Agent dispatch return type. P1/P2 was `string` (the subagent's final text
 * verbatim). P3 widens to also allow a JSON-serializable object — the
 * validated arguments of the subagent's `structured_output` call when
 * `agent({schema})` is used. Strings remain the no-schema return shape;
 * the sandbox's `agent` wrapper revives object returns into the vm realm
 * per-call so a host-realm prototype escape (T1/T8/T14) cannot ride the
 * structured payload back into a script.
 */
export type WorkflowAgentResult = string | object;
/**
 * P5: budget global API surface. P1 default is throwing stubs (total = null,
 * spent()/remaining() throw). P5 will inject a real tracker.
 */
export interface WorkflowBudget {
    total: number | null;
    spent(): number;
    remaining(): number;
}
/**
 * P4b: host-side live-event channel for the orchestrator and sandbox to
 * notify external consumers (typically the `WorkflowRunRegistry`) when
 * a phase boundary or agent dispatch happens, or when the script logs
 * something. Every method is host-realm (called from sandbox closures
 * and `countedDispatch`) — no vm-realm bridge concerns.
 *
 * All methods are no-ops by default — implementations are free to
 * implement only the events they care about.
 *
 * Truncation: `phaseStarted` / `logAppended` are NOT called once the
 * sandbox's internal `MAX_PHASE_ENTRIES` / `MAX_LOG_LINES` cap has
 * been reached, mirroring `getPhases()` / `getLogs()` so a chatty
 * workflow does not flood the registry with thousands of events.
 */
export interface WorkflowOrchestratorEmitter {
    /** Sandbox `phase(title)` was called. */
    phaseStarted?(title: string): void;
    /** Sandbox `log(...)` produced one line of output (or `console.log`). */
    logAppended?(line: string): void;
    /** Orchestrator's `countedDispatch` is about to invoke `dispatch(...)`. */
    agentDispatched?(label?: string): void;
    /** `dispatch(...)` settled (success or thrown). `error` set on rejection. */
    agentCompleted?(label?: string, error?: string): void;
    /**
     * P5: cumulative `spent` re-snapshot after each successful agent
     * completion. `total` is `null` when no per-run cap is set
     * (`QWEN_CODE_MAX_TOKENS_PER_WORKFLOW` unset). Caller (the
     * `WorkflowTool`) mirrors this into the `WorkflowRunRegistry` so the
     * pill / dialog / detail body surface the live token usage. The
     * orchestrator only fires this when a `budget` was passed to
     * `WorkflowRunRequest.budget`.
     */
    budgetUpdated?(spent: number, total: number | null): void;
}
export interface SandboxOptions {
    /** Value bound to the `args` global inside the script. */
    args: unknown;
    /**
     * The owning run's id. Stamped onto every dispatch rejection that
     * crosses the vm boundary so the adoption-escape hook (see `run()`)
     * attributes a process-level unhandledRejection to THIS run when
     * multiple runs share one process (background runs). Omitted by
     * bare-sandbox tests.
     */
    runId?: string;
    /**
     * Function called by the script's `agent(prompt, opts)` global. Returns the
     * agent's final text. Injected so tests can mock without spawning an LLM.
     */
    dispatch: (prompt: string, opts: WorkflowAgentOpts) => Promise<WorkflowAgentResult>;
    /**
     * Forward-compatibility injection seams for P2 (parallel / pipeline) and
     * P5 (budget). When omitted the sandbox falls back to throwing stubs.
     */
    parallel?: (thunks: Array<() => Promise<unknown>>) => Promise<unknown[]>;
    pipeline?: (items: unknown[], ...stages: Array<(prev: unknown, item: unknown, idx: number) => Promise<unknown>>) => Promise<unknown[]>;
    /**
     * Host-side `workflow(nameOrRef, args)` implementation. When provided, the
     * sandbox exposes the `workflow` global that resolves a saved workflow
     * (by name from `.qwen/workflows/<name>.js`, or by `{scriptPath}`) and runs
     * it as a nested orchestration sharing this run's agent-count cap and token
     * budget. When omitted the sandbox falls back to a throwing stub — this is
     * also how single-level nesting is enforced: the orchestrator injects
     * `workflow` only at the top level, so a nested workflow's sandbox has no
     * `workflow` impl and a second-level `workflow()` call throws.
     */
    workflow?: (nameOrRef: string | {
        scriptPath: string;
    }, args: unknown) => Promise<unknown>;
    budget?: WorkflowBudget;
    /**
     * T23 (PR #4732 R2): async wall-clock cap (ms) covering the entire script
     * including awaits. The vm `timeout` option only covers the synchronous
     * portion; once the IIFE yields its first `await`, the watchdog is
     * disarmed and `return new Promise(() => {})` would hang forever.
     *
     * Defaults to 30 minutes, override via `QWEN_CODE_MAX_WORKFLOW_SECONDS`
     * env var, or pass an explicit value here (tests use small values for
     * fast verification).
     *
     * This stays a permanent defense even after P5's `budget` ships:
     * budget caps tokens, but a 0-token hang (`new Promise(() => {})`) only
     * a wall-clock can catch.
     */
    maxWallClockMs?: number;
    /**
     * T40 (PR #4732 R4): completes the R2 wall-clock defense. When the timer
     * fires, the sandbox `abort()`s this controller BEFORE rejecting. The
     * caller threads the same controller's `signal` into the dispatch
     * function (via `createProductionDispatch`) so in-flight subagents see
     * the abort and stop. Without this, the workflow user-side rejects but
     * the subagent keeps burning tokens until its own `max_time_minutes`
     * limit (10 min default).
     *
     * The caller is responsible for cleanup on natural completion (call
     * `abort()` in a `finally` block to cancel any straggler dispatch).
     */
    abortOnTimeout?: AbortController;
    /**
     * P4b: optional host-side event channel. When provided, the sandbox's
     * `safePhase` / `safeLog` closures fire `phaseStarted` / `logAppended`
     * on every accepted entry (after the per-cap truncation guard). The
     * caller (typically `WorkflowTool` via `WorkflowOrchestrator`) wires
     * these into the `WorkflowRunRegistry` so the UI surfaces (pill /
     * dialog / detail body) can re-render without polling `getPhases()`.
     */
    emitter?: WorkflowOrchestratorEmitter;
    /**
     * The run's dispatch scheduler. When provided, the async wall-clock
     * watchdog suspends only while the scheduler is `paused`: by then no
     * dispatch is in flight or being issued, so paused time must neither
     * burn wall-clock budget nor let the timer kill the run mid-pause
     * (resume would then be impossible). During `pausing` the backstop
     * stays armed because an in-flight dispatch is typically still
     * executing real work. Known limitation: an in-flight dispatch parked
     * on a tool approval waits on the user rather than executing, but
     * `pausing` time still burns wall-clock budget until the approval is
     * answered (the watchdog cannot suspend on `pausing` without losing
     * the backstop for genuinely executing dispatches, and `resume()`
     * only works from `paused`).
     *
     * The guarantee covers dispatch-gated code only: script awaits outside
     * a scheduler gate keep executing while paused and are not covered by
     * the wall-clock backstop until resume.
     */
    scheduler?: WorkflowDispatchScheduler;
}
export interface WorkflowSandbox {
    /**
     * Execute the user-authored script source. The script is wrapped as an async
     * IIFE so it may use top-level `await` and `return`. Returns the script's
     * top-level return value.
     *
     * `export const meta = {...}` is extracted before parsing and exposed via
     * `getMeta()` — the script body sees the meta-stripped source.
     */
    run(scriptSource: string): Promise<unknown>;
    /** Phase titles announced by the script in order. */
    getPhases(): string[];
    /** Log lines emitted by the script in order. */
    getLogs(): string[];
    /**
     * Append a log line produced by a nested workflow run. Nested logs
     * reach no production surface on their own (the nested sandbox's
     * buffer is never read by the orchestrator), so the orchestrator
     * merges them into the parent run's logs at nested settlement —
     * including the nested unconsumed-rejection mirror lines.
     */
    appendLog(line: string): void;
    /**
     * The script's `export const meta = {...}` declaration, validated and
     * extracted before the script body runs. `null` when the script omits
     * the declaration. Throws (during `run`) when the declaration is
     * present but malformed.
     */
    getMeta(): WorkflowMeta | null;
}
export declare function createWorkflowSandbox(opts: SandboxOptions): WorkflowSandbox;
