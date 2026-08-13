/**
 * File I/O for durable cron tasks. Reads/writes the per-project tasks file
 * under the user's runtime dir (`~/.qwen/tmp/<project-hash>/`), NOT the
 * working tree — durable tasks are the user's own automation against a
 * project, not project-shared config, so they live alongside the other
 * per-project-private runtime state (checkpoints, shell history) and never
 * become a committed/pulled prompt-injection surface.
 * Session-only tasks never touch this module.
 */
/**
 * One entry in a recurring task's bounded run history — a record that the
 * task actually fired, surfaced by the Web Shell scheduled-tasks page. Only
 * recurring tasks accrue these: a one-shot is removed from disk the moment it
 * fires, so there is no surviving entry to attach history to.
 */
export interface CronTaskRun {
    /** Fire time (epoch ms), minute-aligned like `lastFiredAt`. */
    at: number;
    /**
     * How the run was delivered:
     *  - `'scheduled'` — fired on time by the running scheduler tick.
     *  - `'catch-up'` — a recurring fire that came due while no session owned
     *    the schedule, delivered late when a session took over.
     *  - `'manual'` — triggered by the user via the management UI's "run now",
     *    not by the scheduler.
     * Absent is treated as `'scheduled'` by consumers. Typed loosely (any
     * string is accepted on read) so a future kind can't fail validation on an
     * older reader.
     */
    kind?: 'scheduled' | 'catch-up' | 'manual';
    /**
     * Id of the session that owned the schedule when this fire ran — the session
     * whose transcript contains the run. Lets a management UI link a run back to
     * the conversation it happened in. Absent on tool-created history or when no
     * owner id was known.
     */
    sessionId?: string;
    /**
     * READ-ONLY backward-compatibility field. A pre-removal version stamped this
     * on a fire whose precondition withheld the prompt (it was booked as a run
     * but nothing executed). The isolated/precondition machinery is gone, so this
     * is never written anymore — but stored history still carries it, and dropping
     * it would misreport a deliberately-skipped fire as an ordinary successful
     * run. Preserved through read/validation/passthrough so the UI keeps its
     * "skipped" marker on legacy entries. Absent = a real dispatched run.
     */
    withheld?: boolean;
}
/** Cap on a task's on-disk run history. A ring, newest kept — this bounds the
 * per-task growth of the tasks file (every fire already rewrites it to stamp
 * `lastFiredAt`, so appending a capped run adds no extra write, only bytes). */
export declare const MAX_TASK_RUNS = 20;
export declare const MAX_CHANNEL_DELIVERY_NAME_LENGTH = 2048;
export declare const MAX_CHANNEL_DELIVERY_TARGET_ID_LENGTH = 2048;
export interface CronTaskDelivery {
    kind: 'channel';
    target: {
        channelName: string;
        type: 'user' | 'chat';
        id: string;
    };
}
export interface DurableCronTask {
    id: string;
    cron: string;
    prompt: string;
    recurring: boolean;
    createdAt: number;
    lastFiredAt: number | null;
    /**
     * Optional display name, shown in management UIs (the Web Shell
     * scheduled-tasks page). Absent on tool-created tasks — consumers fall
     * back to the prompt. Never used for scheduling.
     */
    name?: string;
    /**
     * Whether the task is active. Absent or `true` = scheduled; `false` =
     * kept on disk but skipped by the scheduler — a reversible "off" switch
     * for the management UI. Absent defaults to enabled so tool-created
     * tasks (which never write this field) keep firing.
     */
    enabled?: boolean;
    /**
     * Set when a task was disabled BY archiving its bound session (not by the
     * user's own off-switch). Only such tasks are re-enabled when the session is
     * unarchived, so a task the user deliberately disabled stays disabled across
     * an archive/unarchive cycle. Cleared on re-enable.
     */
    disabledByArchive?: boolean;
    /**
     * Id of the dedicated session this task is bound to. A task created through
     * the Web Shell management page mints its own session and stores its id here;
     * the task then fires ONLY inside that session (not via the shared per-project
     * durable owner), so the session's transcript is the task's run history, and
     * archiving/deleting that session stops the task. Absent on tool-created
     * (`cron_create`) and legacy tasks, which keep the shared-owner firing model.
     */
    sessionId?: string;
    delivery?: CronTaskDelivery;
    /**
     * Bounded, newest-last history of recent fires (capped at MAX_TASK_RUNS).
     * Absent on tool-created tasks and on any task that has not fired yet.
     * Appended at the scheduler's persist sites via {@link appendCronRun}.
     */
    runs?: CronTaskRun[];
}
/**
 * Appends a run record to a task's bounded history ring (newest last), capping
 * at {@link MAX_TASK_RUNS} by dropping the oldest. Pure — returns a fresh
 * array and treats an absent/foreign `runs` as empty, so it is safe on a task
 * that predates the field. Shared by every scheduler persist site so the cap
 * is enforced in exactly one place.
 */
export declare function appendCronRun(runs: CronTaskRun[] | undefined, entry: CronTaskRun): CronTaskRun[];
/**
 * True for a task written by a pre-removal version as an `isolated` task with a
 * `condition` precondition. The field is no longer part of {@link
 * DurableCronTask} (validation accepts it as an unknown key), so it is read off
 * the raw object. A blank/absent condition is not a gate.
 *
 * The isolated run mode and its preconditions were removed; such a task can no
 * longer be evaluated. Every consumer — the scheduler, the REST list view, and
 * the manual `/run` endpoint — uses this to FAIL CLOSED (skip / block / reject)
 * so a removed safety gate ("only run when X") can never silently degrade into
 * "always run" on any path. The user re-creates the task if they still want it.
 */
export declare function taskHasLegacyCondition(task: DurableCronTask): boolean;
/**
 * True for a task written by a pre-removal version with `runMode: 'isolated'`
 * (with or without a precondition). The field is no longer part of {@link
 * DurableCronTask}, so it is read off the raw object.
 *
 * Unlike a legacy precondition (which is a safety gate → fail closed), a bare
 * isolated task has no gate: it can still run, just no longer in a fresh
 * per-run session — it now accumulates history in its bound session. So the
 * scheduler still fires it, but logs a one-time notice so an operator who
 * relied on the clean-slate isolation is not left wondering why runs now differ.
 */
export declare function taskHasLegacyRunMode(task: DurableCronTask): boolean;
/**
 * Generates an 8-character base36 id for a durable task. Shared by the
 * scheduler (`CronScheduler`) and the daemon's scheduled-tasks route so
 * route-created and tool-created tasks use one id scheme — changing it here
 * changes it everywhere. Math.random is fine: ids only need to be unique
 * within a <50-entry file, not unpredictable.
 */
export declare function generateCronTaskId(): string;
/** Generic label for the tasks file, for user-facing messages and tool
 * descriptions. The real path is per-project (hashed); this template
 * communicates the location without leaking the hash. */
export declare const CRON_TASKS_DISPLAY_PATH = "~/.qwen/tmp/<project-hash>/scheduled_tasks.json";
export declare function getCronFilePath(projectRoot: string): string;
export declare function readCronTasks(projectRoot: string): Promise<DurableCronTask[]>;
export declare function writeCronTasks(projectRoot: string, tasks: DurableCronTask[], options?: {
    assertCanCommit?: () => void;
}): Promise<void>;
/**
 * Applies `mutate` to the on-disk task list in a single read-modify-write
 * cycle. Cycles are serialized — by a mutex within this process, guarded
 * by `<tasksFile>.lock` across processes — so concurrent updates from
 * other sessions sharing the cwd can't clobber each other.
 *
 * Returning the input array unchanged signals a no-op: the write is
 * skipped, so other sessions' file watchers don't reload for nothing.
 */
export declare function updateCronTasks(projectRoot: string, mutate: (tasks: DurableCronTask[]) => DurableCronTask[], options?: {
    assertCanCommit?: () => void;
}): Promise<void>;
export declare function addCronTask(projectRoot: string, task: DurableCronTask): Promise<void>;
/** Returns the number of tasks actually removed. */
export declare function removeCronTasks(projectRoot: string, ids: string[]): Promise<number>;
