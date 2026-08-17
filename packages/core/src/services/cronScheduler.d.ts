/**
 * Cron scheduler with optional durable (file-backed) task support.
 * In-memory jobs live and die with the process. Durable jobs persist
 * under the user runtime dir (~/.qwen/tmp/<project-hash>/) and survive
 * restarts.
 */
import type { CronTaskDelivery, DurableCronTask } from './cronTasksFile.js';
/** Max jobs the scheduler keeps in its in-memory map. Also the durable-task
 * load cap and the daemon route's per-file create cap — exported so all three
 * share one source of truth. */
export declare const MAX_JOBS = 50;
export declare const DEFAULT_RECURRING_MAX_AGE_DAYS = 7;
/** Single owner of the recurring-expiry contract, shared with the config
 * layer: `0` and `Infinity` both disable expiry, positive values pass
 * through, and negative or NaN input falls back to `fallback`.
 * Unit-agnostic — the config layer normalizes days, the scheduler
 * constructor milliseconds. */
export declare function normalizeRecurringMaxAge(
  value: number,
  fallback: number,
): number;
export declare const WAKEUP_MIN_SECONDS = 60;
export declare const WAKEUP_MAX_SECONDS = 3600;
export interface CronJob {
  id: string;
  cronExpr: string;
  prompt: string;
  recurring: boolean;
  createdAt: number;
  expiresAt: number;
  fireAtMs?: number;
  lastFiredAt?: number;
  jitterMs: number;
  /** Persisted under ~/.qwen (per-project) — survives restarts. */
  durable?: boolean;
  /**
   * Id of the session this durable task is bound to. When set, the task fires
   * ONLY in that session (independent of the per-project durable lock), so its
   * transcript is the task's run history; the lock owner never fires it. When
   * absent, the task uses the shared model: only the lock owner fires it.
   */
  boundSessionId?: string;
  delivery?: CronTaskDelivery;
  /** One-shot that was due while no owning session ran — fired late. */
  missed?: boolean;
  todoWorkChainId?: string;
}
export declare function clampWakeupSeconds(delaySeconds: number): number;
export declare class CronScheduler {
  #private;
  private readonly projectRoot;
  private jobs;
  private wakeups;
  private wakeupChainStartedAt;
  private _disabled;
  private timer;
  private onFire;
  private skipDurableFire;
  private durableEnabled;
  private durableGeneration;
  private sessionId;
  private readonly lockId;
  private pendingRelease;
  private isOwner;
  private pendingRemoval;
  private pendingAdd;
  private armedDurableOneShots;
  private warnedLegacyConditionIds;
  private warnedLegacyRunModeIds;
  private firePersistPending;
  private markFirePersistPending;
  private clearFirePersistPending;
  private fileWatcher;
  private lockProbeTimer;
  private debounceTimer;
  private testFireTimers;
  private pendingFires;
  private pendingPersist;
  /** Age after which recurring jobs expire, evaluated at fire time.
   * Infinity = never expire. Guarded in the constructor. */
  private readonly recurringMaxAgeMs;
  /** `projectRoot` anchors durable storage; without it only session-only
   * jobs work. Production constructs via `Config.getCronScheduler()`,
   * which always supplies it (and the configured `recurringMaxAgeMs`).
   * `normalizeRecurringMaxAge` owns the expiry contract for both this
   * constructor and the config layer: `0` and `Infinity` both mean
   * "never expire" — so a direct caller passing `0` gets disabled
   * expiry, not the default — while negative or NaN input falls back to
   * the 7-day default rather than expiring everything at birth. */
  constructor(projectRoot?: string | null, recurringMaxAgeMs?: number);
  /**
   * Creates a new session-only cron job. Returns the created job.
   * Throws if the max job limit is reached.
   */
  create(cronExpr: string, prompt: string, recurring: boolean): CronJob;
  /**
   * Schedules a second-resolution, session-only one-shot wakeup for
   * self-paced `/loop`. Clamps `delaySeconds` to [60, 3600]; non-finite
   * input falls back to the default heartbeat. The fire time is exact (not
   * minute-rounded) and is not subject to MAX_JOBS. Returns the scheduling
   * outcome for the model (mirrors ScheduleWakeup's output).
   */
  scheduleWakeup(
    delaySeconds: number,
    prompt: string,
    todoWorkChainId?: string,
  ): {
    id: string;
    scheduledFor: string;
    clampedDelaySeconds: number;
    wasClamped: boolean;
    replacedId: string | null;
  };
  /** Cancels a single pending wakeup. Returns true if it existed. */
  cancelWakeup(id: string): boolean;
  /**
   * Cancels every pending wakeup; returns how many were cancelled. The
   * primitive behind a future loop-scoped "cancel all wakeups on abort".
   */
  cancelAllWakeups(): number;
  /**
   * Creates a durable cron job: registered like any other job, and
   * persisted under ~/.qwen (per-project) so it survives restarts.
   * Throws if the job can't be persisted.
   */
  createDurable(
    cronExpr: string,
    prompt: string,
    recurring: boolean,
  ): Promise<CronJob>;
  /**
   * Deletes a job by ID. Durable jobs are also removed from disk, and the
   * removal is awaited — reporting success while the on-disk entry could
   * survive would let the task resurface in another session or after a
   * restart. On write failure the job is restored and the error rethrown.
   * Returns true if the job existed.
   */
  delete(id: string): Promise<boolean>;
  /**
   * Returns all active jobs.
   */
  list(): CronJob[];
  /**
   * Returns the number of active jobs and wakeups.
   */
  get size(): number;
  /**
   * Returns the number of session-only (non-durable) jobs. Headless mode
   * keys its hold-open loop on this: durable jobs outlive the process by
   * design and never fire without lock ownership, so they must not pin it.
   */
  get sessionSize(): number;
  /**
   * Enables durable cron support. Loads tasks from disk and watches the
   * tasks file in every session — durable tasks are project-level, so
   * cron_list/cron_delete must see them regardless of which session owns
   * the lock. The lock only gates firing.
   */
  enableDurable(sessionId: string): Promise<void>;
  /**
   * Hands back a lock acquired by an await that resumed after stop() —
   * unless a newer enableDurable() for the same session is already active
   * on this scheduler, in which case the lock is exactly the one it owns
   * (acquisition is idempotent per pid+sessionId+lockId) and releasing
   * would pull it out from under it.
   */
  private releaseLateAcquisition;
  private loadFileTasks;
  /**
   * Delivers catch-up work through the normal onFire channel, or holds
   * it until start() installs one. Delivery is what removes a missed or
   * final task from disk (and what persists a catch-up stamp) — a
   * buffered fire leaves disk state untouched, so a stop() that drops
   * the buffer loses nothing.
   */
  private fireOrBuffer;
  private deliverPending;
  /**
   * Persists the in-memory lastFiredAt stamps of just-delivered catch-up
   * fires so a restart doesn't replay them.
   */
  private persistCatchUpStamps;
  /** Launches the on-disk removal of missed/final tasks just delivered. */
  private removeMissedFromDisk;
  /**
   * Chains a background write into pendingPersist so stop() releases the
   * lock only after it lands. Failures are logged but not retried — same
   * best-effort contract as a fire-and-forget persist; the fire was
   * already delivered, so a failed stamp degrades to at-least-once.
   */
  private trackPersist;
  private startFileWatcher;
  /**
   * Installs a predicate marking durable jobs the active consumer cannot run
   * (see the `skipDurableFire` field). Such jobs are skipped before any fire or
   * persist, so their durable schedule is left intact for an owning session that
   * can run them. Set before `start()` so a buffered catch-up flush also honors
   * it. A no-op for session-only jobs.
   */
  setSkipDurableFire(predicate: (job: CronJob) => boolean): void;
  /**
   * Immediately fires a job by ID, bypassing the cron schedule check.
   * Sets lastFiredAt to prevent the normal tick from re-firing the same
   * minute slot. Returns true if the job existed and was fired, false
   * otherwise. Primarily a test seam (see QWEN_CODE_TEST_CRON_FAST in
   * create()); also useful for manual debug triggers.
   */
  forceFireJob(id: string): boolean;
  /**
   * Starts the scheduler tick. Calls `onFire` when a job is due.
   * Only fires when called — does not auto-fire missed intervals.
   */
  start(onFire: (job: CronJob) => void): void;
  /**
   * Stops the scheduler and relinquishes durable participation: the lock
   * is released so another session can take over, and a later
   * `enableDurable()` re-acquires from scratch (a re-enable under a new
   * sessionId must not be blocked by this session's own old lock).
   * Does not clear cron jobs — they remain queryable. Pending wakeups are
   * cleared because they are session-scoped and meaningless without a timer.
   */
  stop(): void;
  /**
   * True while durable (file-backed) support is active — this session is
   * either firing durable tasks (owner) or probing to take over.
   */
  get durableActive(): boolean;
  /**
   * True when the tick loop has — or may acquire — work: any in-memory
   * job, or durable mode active (the file watcher and lock takeover can
   * install fireable tasks at any time, even while the map is empty).
   */
  get hasPendingWork(): boolean;
  /**
   * Returns true if the scheduler is running.
   */
  get running(): boolean;
  /**
   * True once disable() has run. Distinct from `!running`: a fresh scheduler
   * is stopped but not disabled, and starts on first pending work. Used by
   * LoopWakeup to reject wakeups that would never fire (vs. ones that will
   * fire once the post-prompt hook starts the tick).
   */
  get disabled(): boolean;
  /**
   * Permanently disables the scheduler for this session: stops the tick and
   * marks it disabled so LoopWakeup rejects new wakeups. Only the token-limit
   * breaker calls this; cleared only by a new session (a fresh instance).
   */
  disable(): void;
  /**
   * Manual tick — checks all jobs against the current time and fires those
   * that are due. Exported for testing.
   */
  tick(now?: Date): void;
  /**
   * Processes a single job. Returns 'fired' if the job fired,
   * 'fired-final' if it fired one last time and was removed (aged out),
   * and 'none' otherwise.
   */
  private processJob;
  /**
   * Returns a human-readable summary of active session-only jobs for
   * display on session exit. Durable jobs are not included since they
   * persist. Returns null if there are no session-only jobs.
   */
  getExitSummary(): string | null;
  /**
   * Clears all jobs and stops the scheduler.
   */
  destroy(): void;
}
/**
 * Wraps missed one-shot prompts in a single confirmation notice for the
 * model (mirrors claw-code's buildMissedTaskNotification, including the
 * batching). The task file is project-controlled, so a prompt read from
 * it must not execute without the user confirming — delivering it raw
 * would bypass the approval gate cron_create runs at scheduling time.
 */
export declare function buildMissedCronNotification(
  missed: DurableCronTask[],
): string;
export declare function nextDurableFireMs(
  task: Pick<
    DurableCronTask,
    'id' | 'cron' | 'recurring' | 'lastFiredAt' | 'createdAt'
  >,
): number | null;
