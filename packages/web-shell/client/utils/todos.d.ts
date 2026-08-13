import type { ACPToolCall, Message, PermissionRequest, TodoItem } from '../adapters/types';
/**
 * The todo tool is registered as `todo_write` on the wire, but older paths and
 * the ACP plan bridge use `todowrite`. Match both so detection never hinges on
 * the (unrelated) tool `kind`, which is `think` for this tool.
 */
export declare function isTodoWriteToolName(name: string): boolean;
/**
 * The full exit-plan approval rule: the switch_mode frame kind plus the
 * exit_plan_mode wire name. Shared by App, ChatPane, and ToolApproval so the
 * surfaces that gate the revision-bound approval UI never drift.
 */
export declare function isExitPlanApprovalRequest(request: Pick<PermissionRequest, 'toolKind' | 'toolName'> | null | undefined): boolean;
export declare function parseTodoItemsFromEntries(entries: readonly unknown[]): TodoItem[];
export declare function extractTodosFromToolCall(tool: ACPToolCall): TodoItem[] | undefined;
export declare function hasActiveTodos(todos: readonly TodoItem[]): boolean;
export declare function getTodoStatusIcon(status: TodoItem['status']): string;
export interface FloatingTodosState {
    todos: TodoItem[];
    planId: string | null;
    /** Every item is completed — the panel shows a transient "all done" state. */
    allCompleted: boolean;
    /** Transcript message the latest todo update came from. */
    sourceMessageId: string | null;
}
export declare function getFloatingTodos(messages: readonly Message[]): FloatingTodosState;
export declare function getActiveTodosForPlanRevision(messages: readonly Message[], revision: {
    planId: string;
    sourceCallId: string;
} | null | undefined): TodoItem[];
export declare function getAgentToolsForPlan(messages: readonly Message[], plan: Pick<FloatingTodosState, 'planId' | 'sourceMessageId'>): ACPToolCall[];
/** A status transition surfaced for a single todo snapshot. */
export interface TodoEvent {
    kind: 'started' | 'completed';
    id: string;
    content: string;
}
/** What changed in one todo snapshot relative to the conversation so far. */
export interface TodoSnapshotDiff {
    events: TodoEvent[];
}
/**
 * Identity used to track an item across snapshots. Folds content into the key
 * because todo ids are NOT globally unique. Modern Qwen plan metadata preserves
 * the core id, but legacy ACP records fall back to positional ids (`plan-0`,
 * `plan-1`, …), and models commonly restart numbering at `1, 2, 3` for a new
 * `todo_write` plan. Keying on id alone would diff a new plan's items against a
 * previous plan's stale terminal status; id+content keeps distinct tasks
 * separate and, unlike a user-turn reset, still tracks a list correctly when it
 * spans turns (a "continue" turn that completes an item carried over from
 * before).
 *
 * Two rare cases this trades for, affecting the collapsed diff and the per-task
 * detail ({@link computeTodoDetails}) but not the expanded list itself:
 * - A todo reworded on a stable id reads as a new task. Reworded while still
 *   `in_progress` it emits a spurious `started`; reworded straight to
 *   `completed` (`1 "Write report"` → `1 "Write the final report" completed`)
 *   the completion is treated as first-seen and dropped.
 * - Two unrelated plans that reuse both the id AND the exact content (a generic
 *   recurring todo like `"Run tests"`) still collide. computeTodoDetails resets
 *   a task's window when a completed key restarts as `in_progress`, so the
 *   common reuse keeps correct numbers; a reused id+content that goes *straight*
 *   to `completed` (never observed `in_progress`) still shares the earlier
 *   task's detail slot.
 */
export declare function todoStateKey(todo: TodoItem): string;
/**
 * Walk the todo snapshots in order and, for each one, derive what changed
 * relative to the running state: which items just started and which just
 * completed.
 *
 * Keyed by snapshot id (tool callId or plan message id) so a history row can
 * look up its own diff. Only transitions actually witnessed produce events — an
 * item first seen already completed (e.g. a restored session's opening
 * snapshot) is recorded silently so its old completion is not replayed as if it
 * just happened.
 */
export declare function computeTodoTimeline(messages: readonly Message[]): Map<string, TodoSnapshotDiff>;
/**
 * A cheap signature of the todo snapshots in a transcript: each snapshot's key
 * plus its items' id, status, and content. App memoizes the timeline on this so
 * the context provider value stays referentially stable across unrelated
 * streaming ticks (which would otherwise re-render every todo/plan row that
 * consumes the timeline).
 */
export declare function todoTimelineSignature(messages: readonly Message[]): string;
/**
 * Like {@link todoTimelineSignature} but folds in everything
 * {@link computeTodoDetails} reads beyond item status: each snapshot's message
 * timestamp and stamped stats, plus every non-todo tool span (whose durations
 * feed tool time). App memoizes the detail map on this so the TodoDetailContext
 * value stays referentially stable across streaming ticks that touch none of it.
 */
export declare function todoDetailSignature(messages: readonly Message[]): string;
export interface TodoWindow {
    start: number;
    end: number;
}
/**
 * Natural-order window of up to maxVisible items anchored on the current
 * item (first in_progress, else first pending): one item of completed
 * context above the anchor, the rest of the budget below it.
 */
export declare function getTodoWindow(todos: readonly TodoItem[], maxVisible: number): TodoWindow;
/**
 * Cumulative-usage baseline the agent stamps onto each todo update
 * (`_meta.stats`, surfaced via the tool call's rawOutput). The web-shell diffs
 * consecutive snapshots to attribute a task's spend. `apiTimeMs` only advances
 * live — replayed sessions carry tokens but not per-turn durations.
 */
export interface TodoStatsSnapshot {
    promptTokens: number;
    cachedTokens: number;
    candidateTokens: number;
    apiTimeMs: number;
}
/**
 * Read the cumulative-usage snapshot the agent stamped onto a todo_write tool
 * call's rawOutput. Absent for snapshots emitted by an agent that predates the
 * stamping, or non-tool todo sources (plain plan messages).
 */
export declare function extractTodoStats(tool: ACPToolCall): TodoStatsSnapshot | undefined;
/**
 * Resource usage consumed during a single todo's [start, end] window. Every
 * field is optional: tokens/API time come from the snapshot diff (absent on
 * sessions whose agent didn't stamp snapshots; API time is also absent on
 * replay), while tool time comes from transcript tool durations and is shown
 * whenever any tool ran in the window.
 */
export interface TodoResources {
    inputTokens?: number;
    cachedTokens?: number;
    outputTokens?: number;
    apiTimeMs?: number;
    toolTimeMs?: number;
}
/** Per-todo timing and resource breakdown. */
export interface TodoDetail {
    /** Wall-clock ms when the item first became in_progress. */
    startTs?: number;
    /** Wall-clock ms when the item became completed. */
    endTs?: number;
    /**
     * Tokens and time spent while this item was the active task. Tokens and API
     * time come from diffing the cumulative-usage snapshots stamped on its start
     * and end todo boundaries; tool time is summed from the transcript's tool
     * durations in the window. Undefined when nothing could be measured.
     */
    resources?: TodoResources;
}
/**
 * Per-todo detail keyed by {@link todoStateKey}: when each item started and
 * completed, plus the resources spent in that window.
 *
 * Mirrors {@link computeTodoTimeline}'s state machine — a todo's start is its
 * first in_progress transition and its end the completed transition — but
 * records timestamps, the snapshot diff (tokens + API time) between the start
 * and end boundaries, and the transcript tool time in the window. An item first
 * seen already completed (a restored opening snapshot) yields no detail, exactly
 * as it produces no timeline event.
 */
export declare function computeTodoDetails(messages: readonly Message[]): Map<string, TodoDetail>;
export declare function getTodoPlanId(tool: ACPToolCall): string | null;
