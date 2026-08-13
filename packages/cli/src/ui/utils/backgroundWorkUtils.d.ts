/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
export declare function hasBlockingBackgroundWork(config: Config): boolean;
export declare function resetBackgroundStateForSessionSwitch(config: Config): void;
export interface BlockingBackgroundWork {
    /**
     * One formatted line per blocking entry, sorted by start time, e.g.
     * `  [bg_ab12cd34] npm run dev (running 21h 4m)`. Capped at
     * `MAX_LISTED_BLOCKING_ENTRIES` plus a `…and N more` tail. Sanitized —
     * labels are user/process-supplied.
     */
    lines: string[];
    /** True when at least one blocking entry is an agent, shell, or monitor
     *  (the kinds `/tasks` lists). */
    hasTaskEntries: boolean;
    /** True when at least one blocking entry is a workflow run (listed via
     *  `/workflows`, not `/tasks`). */
    hasWorkflowRuns: boolean;
}
/**
 * Enumerates the entries that make `hasBlockingBackgroundWork()` true,
 * mirroring its per-registry predicate exactly (background agents:
 * `isBackgrounded` + `running`; monitors: `running`; shells: `running`;
 * workflow runs: `running` or `pausing`). Returns `undefined` when nothing
 * is enumerated — e.g. an entry settled between the gate check and this
 * call — so callers fall back to their base message instead of rendering
 * an empty list.
 */
export declare function describeBlockingBackgroundWork(config: Config): BlockingBackgroundWork | undefined;
/**
 * Builds the session-switch blocked error: the caller's base message plus
 * one line per blocking entry and a pointer to the command that lists
 * each kind (`/tasks` for agents/shells/monitors, `/workflows` for
 * workflow runs). Falls back to the bare base message when nothing is
 * enumerated (see `describeBlockingBackgroundWork`).
 */
export declare function buildBackgroundWorkBlockedMessage(config: Config, baseMessage: string): string;
