/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type LoopMode } from './autonomous-loop.js';
export {
  AUTONOMOUS_SENTINEL_CRON,
  AUTONOMOUS_SENTINEL_DYNAMIC,
  AutonomousLoopTickResolver,
  detectAutonomousSentinel,
} from './autonomous-loop.js';
export type { LoopMode } from './autonomous-loop.js';
/**
 * Fire-time resolver for `.qwen/loop.md`-driven loops.
 *
 * A `/loop` whose scheduled prompt is one of these sentinels re-reads loop.md
 * on every fire and gets either the FULL task block (first delivery, or whenever
 * the file changed) or a one-line SHORT reminder (unchanged) — so the task list
 * is paid for once into the cached message-prefix and later ticks stay cheap.
 *
 * Divergence from the upstream design this mirrors: the `lastContent` cache is
 * held per Session instance (not a module singleton) so it scopes to one
 * conversation and resets cleanly with that conversation's context (compaction).
 * Change-detection is full content equality, not mtime/hash, so edit and
 * delete→recreate both re-expand for free.
 */
export declare const LOOP_SENTINEL_CRON = '<<loop.md>>';
export declare const LOOP_SENTINEL_DYNAMIC = '<<loop.md-dynamic>>';
export interface LoopTickResolverDeps {
  /** Pass `config.getWorkingDir()` — loop.md is resolved against the cwd. */
  projectRoot: string;
  /** Home-candidate confinement root: `$QWEN_HOME` when set, else `$HOME`. */
  homeDir: string;
  /**
   * QWEN_HOME-aware global dir holding the home `loop.md` (`Storage.getGlobalQwenDir()`).
   * Omitted → defaults to `<homeDir>/.qwen` inside readLoopTaskFile.
   */
  homeQwenDir?: string;
  /**
   * Pass `() => config.isTrustedFolder()`. Re-evaluated on every `resolve()`,
   * never captured once: `isTrustedFolder()` is not process-stable in IDE
   * sessions (a workspace-trust update can flip it), and a trusted→untrusted
   * flip must immediately stop reading the repo-controlled project
   * `.qwen/loop.md` (the user-owned `~/.qwen/loop.md` still is read).
   */
  allowProjectFile: () => boolean;
}
export interface LoopTickResult {
  /** Text to deliver to the model in place of the sentinel prompt. */
  modelText: string;
  /** True when the full task block was delivered (vs a short reminder). */
  full: boolean;
  /** Non-absolute label for the matched candidate (e.g. "project loop.md"),
   * when present — safe for logs/UI that must not leak the absolute path, and
   * doubles as the "a loop.md was found" flag for callers. */
  sourceLabel?: string;
  /** True ONLY for buildTransientErrorTick: a loop.md exists but could not be
   * read THIS tick (a transient EACCES/EIO or editor/AV lock), as distinct from
   * the genuinely-absent no-op (where this stays false). Lets the caller's echo
   * say "temporarily unavailable" instead of "not present". Carries no errno or
   * path — those stay in the modelText note and LOCAL debug logs only. */
  transientError?: boolean;
  /** True when this tick is an autonomous-mode tick (a `<<autonomous-loop*>>`
   * fire, or a loop.md sentinel whose file is gone and has converged on the
   * autonomous preamble). Lets the caller's echo label it distinctly. */
  autonomous?: boolean;
}
/** Detect whether a scheduled prompt is a loop.md sentinel, and which mode. */
export declare function detectLoopSentinel(prompt: string): LoopMode | null;
export declare class LoopTickResolver {
  #private;
  private readonly deps;
  constructor(deps: LoopTickResolverDeps);
  /** Forget the delivered content so the next fire re-delivers the full block
   * — called when the conversation is compacted (fresh context). */
  resetCache(): void;
  /** Commit the last resolve()'s content once it has reached the model. */
  markDelivered(): void;
  /** Resolve an autonomous-loop sentinel fire (a bare `/loop`, no loop.md).
   * Synchronous — the preamble is static; only the dedup state is consulted. */
  resolveAutonomous(mode: LoopMode): LoopTickResult;
  /** MODEL-FACING label for the home loop.md location. Mirrors
   * readLoopTaskFile's home candidate (`<homeQwenDir>/loop.md`) so the absent
   * reminder — and the caller's sanitized resolve-error — names the location
   * actually checked (QWEN_HOME-aware), but must NEVER surface a raw absolute
   * path: it flows into model/API text, leaking the host's filesystem layout.
   *   - under $HOME             → tilde-abbreviated `~/.qwen/loop.md`;
   *   - relocated via $QWEN_HOME → the literal `$QWEN_HOME/loop.md`, not the
   *     resolved dir (`tildeifyPath` only abbreviates $HOME, so it's a no-op for
   *     a $QWEN_HOME outside $HOME and would otherwise pass the path through);
   *   - any other out-of-$HOME dir → a generic placeholder, never the path.
   * The real absolute path stays in LOCAL debug logs only. */
  homeLoopLabel(): string;
  /** The checked-candidate "where" string shared by the absent reminder and the
   * caller's sanitized resolve-error. Names the project candidate ONLY when it
   * was actually read (`projectChecked` — a trusted folder), so neither path can
   * claim `.qwen/loop.md (project)` for an untrusted folder where the project
   * file is skipped. The home label is the QWEN_HOME-aware, never-absolute
   * homeLoopLabel(). Single source of truth so the two messages can't drift. */
  absentLocations(projectChecked: boolean): string;
  /**
   * No-op tick for a transient, non-whitelisted read error (EACCES/EIO, or a
   * Windows editor/AV briefly locking loop.md). Mirrors the absent tick — same
   * heading + the mode's re-arm tail (ABSENT_TAIL) — so a `dynamic` loop still
   * re-arms LoopWakeup and survives the hiccup instead of dying silently: its
   * firing wakeup was already consumed by the scheduler, and only the
   * end-of-turn re-arm keeps it alive, so a thrown turn ends the loop forever.
   * `cron` callers don't use this (they re-fire on their own next interval).
   * `projectChecked` is the trust captured for THIS tick (so the named candidate
   * set matches what was probed); `code` is the errno only — never an absolute
   * path — for a brief model-facing note.
   */
  buildTransientErrorTick(
    mode: LoopMode,
    projectChecked: boolean,
    code: string,
  ): LoopTickResult;
  /**
   * @param allowProjectFileOverride Trust captured once by the caller for this
   * tick (see LoopTickResolverDeps.allowProjectFile). Threaded in — rather than
   * re-reading the getter here — so the caller's error path can name the SAME
   * candidate set that was probed even if `isTrustedFolder()` flips mid-tick.
   * Omitted by direct callers, who fall back to the per-tick getter.
   */
  resolve(
    mode: LoopMode,
    allowProjectFileOverride?: boolean,
  ): Promise<LoopTickResult>;
}
