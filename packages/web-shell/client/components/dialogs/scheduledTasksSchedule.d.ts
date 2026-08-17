/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Pure cron-schedule helpers for the Scheduled Tasks page — building a cron
 * expression from the form's builder inputs, and turning a cron expression /
 * last-fired timestamp into a localized label. Kept free of React and of the
 * SDK task type so they can be unit-tested in isolation.
 */
export type Frequency =
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'hourly'
  | 'minutes'
  | 'custom';
export interface BuilderState {
  frequency: Frequency;
  time: string;
  weekday: number;
  minuteInterval: number;
  customCron: string;
}
/** Minimal `t()` shape — a key plus optional interpolation vars. */
export type TranslateFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;
export declare function parseHhmm(time: string): {
  hh: number;
  mm: number;
} | null;
/** Build a 5-field cron from the builder inputs. Returns null when the inputs
 * for the chosen frequency are invalid (the caller surfaces a form error). */
export declare function buildCron(state: BuilderState): string | null;
/** Human-readable schedule label, localized. Covers the shapes the builder
 * emits (the common cases in the reference design); anything else — including
 * ranges/lists a power user hand-writes — falls back to the raw expression so
 * the label is never wrong, only sometimes terse. */
export declare function describeCron(cron: string, t: TranslateFn): string;
/** The default builder state for a new task, and the fallback for fields a
 * reversed cron doesn't drive. Single source of truth — the dialog imports this
 * rather than keeping its own copy, so the create form and the cron-reversal
 * can't drift apart. */
export declare const DEFAULT_BUILDER: BuilderState;
/**
 * Best-effort inverse of {@link buildCron}: maps a cron expression back onto
 * the builder so the edit form can prefill its pickers. Recognizes ONLY the
 * shapes buildCron can round-trip losslessly (mirroring {@link describeCron});
 * anything else — ranges, lists, a hand-written expression — falls back to the
 * `custom` frequency with the raw cron, so editing a task can never silently
 * rewrite a schedule it couldn't represent in the structured pickers.
 */
export declare function parseCronToBuilder(cron: string): BuilderState;
/**
 * Compact, localized countdown from a millisecond remainder: `"3h 12m"`,
 * `"5m 20s"`, `"45s"`, or the "due now" label once elapsed. Shows the two
 * most-significant units, dropping a zero secondary (`"3h"` not `"3h 0m"`), so
 * the pill stays short. Unit words come from `t` (`scheduledTasks.dur.*`).
 */
export declare function formatCountdown(
  msRemaining: number,
  t: TranslateFn,
): string;
/** "Last run: …" label, or "never run" for a task that has not genuinely
 * fired. A fresh task is stamped with `lastFiredAt = floor(createdAt)` so the
 * scheduler can't fire it during its creation minute — that stamp is NOT a
 * real run, so anything at or before the creation minute reads as "never". */
export declare function describeLastRun(
  task: {
    createdAt: number;
    lastFiredAt: number | null;
  },
  t: TranslateFn,
): string;
