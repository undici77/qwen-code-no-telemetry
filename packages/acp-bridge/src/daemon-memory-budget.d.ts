/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Mirrors the hardcoded 0.5 in spawnChannel.ts:getAcpMemoryArgs(). */
export declare const LEGACY_CHILD_HEAP_FRACTION = 0.5;
/** This module's own derived-budget fraction; free to move independently. */
export declare const DEFAULT_MEMORY_BUDGET_FRACTION = 0.5;
export declare const MIN_MEMORY_BUDGET_MB = 1024;
export declare const MAX_MEMORY_BUDGET_MB = 1048576;
export declare const MIN_CHILD_HEAP_MB = 512;
export declare const MAX_CHILD_HEAP_MB = 16384;
export declare const ROOT_RESERVE_FRACTION = 0.1;
export declare const MIN_ROOT_RESERVE_MB = 256;
export declare const MAX_ROOT_RESERVE_MB = 1024;
export type MemoryBudgetSource = 'flag' | 'derived';
export type AvailableMemorySource = 'constrained' | 'host';
/**
 * The daemon's resolved memory figures. Purely descriptive: nothing here
 * changes how a child is spawned. It exists so `GET /daemon/status` can report
 * how much memory the daemon believes it has, and so a later child-capacity
 * policy has one denominator to be designed against rather than inventing its
 * own.
 */
export interface DaemonMemoryBudget {
    /** What was asked for — the flag value, or half of host memory. */
    readonly configuredBudgetMb: number;
    /**
     * What the daemon can actually work with: `configured` capped at resolved
     * host/cgroup memory. These differ when an operator passes a budget larger
     * than the machine, and reporting only the configured figure would make
     * every ratio derived from it meaningless.
     */
    readonly effectiveBudgetMb: number;
    readonly budgetSource: MemoryBudgetSource;
    /**
     * Memory the daemon may actually use: the cgroup limit when one applies,
     * otherwise host total. Named for what it is rather than for the host,
     * because under a cgroup the two differ and the cgroup figure is the one
     * every ratio must divide by.
     */
    readonly availableMemoryMb: number;
    readonly availableMemorySource: AvailableMemorySource;
    readonly rootReserveMb: number;
    /** `effectiveBudgetMb` minus the root reserve. */
    readonly childPoolMb: number;
    /**
     * A conservative model of the ceiling an ACP child receives today, with no
     * budget involved: `min(50% of available memory, 16 GB)`. Re-derived rather
     * than read from the spawn path, so it can sit below the figure a child
     * actually receives; the divergences are documented on `legacyChildCeilingMb`.
     * Reported so the gap between current behavior and any future policy is
     * visible before that policy exists.
     */
    readonly legacyChildCeilingMb: number;
    /**
     * True when the machine is too small to run the daemon within the documented
     * minimum budget. An observation, not a refusal — and deliberately not a
     * reason to clamp the budget upward, which would report a denominator the
     * host cannot back.
     */
    readonly insufficientMemory: boolean;
}
/**
 * Memory available to the daemon process tree, in MB.
 *
 * `process.constrainedMemory()` already reads cgroup v1 and v2 through libuv.
 * It is clamped to the host total because cgroup v1 reports "unlimited" as a
 * huge sentinel value rather than as an absent limit.
 *
 * `packages/core/src/services/memoryPressureMonitor.ts` has a fuller cgroup
 * walk with its own sentinel handling; it is a private method on a class the
 * daemon never constructs, so consolidating onto it is left as follow-up.
 */
export declare function detectAvailableMemoryMb(): {
    memoryMb: number;
    source: AvailableMemorySource;
};
/**
 * Approximately the ceiling `getAcpMemoryArgs()` applies today with no budget:
 * half of available memory, capped at 16 GB. Reported so the gap between
 * current behavior and a future policy is visible.
 *
 * Two known divergences from the spawn path, both in the direction of this
 * figure being the more conservative one:
 *
 * - the spawn path drops the flag entirely when the target is below the
 *   spawning daemon's own heap limit, in which case the child inherits V8's
 *   default and can end up higher;
 * - the spawn path treats any `constrainedMemory() > 0` as the total, so under
 *   cgroup v1 with an "unlimited" sentinel it computes from that sentinel and
 *   lands on the 16 GB cap, while `detectAvailableMemoryMb` rejects the
 *   sentinel and computes from the host total instead.
 *
 * Aligning them belongs with the change that actually applies a ceiling; doing
 * it here would mean adopting the sentinel bug to match.
 */
export declare function legacyChildCeilingMb(availableMemoryMb?: number): number;
/**
 * Validates an operator-supplied budget. Range only — relating it to host
 * memory is `resolveDaemonMemoryBudget`'s job, because that is a capping
 * decision rather than a rejection.
 */
export declare function isValidMemoryBudgetMb(value: number): boolean;
export declare function normalizeMemoryBudgetMb(value: number): number;
export declare function memoryBudgetRangeError(): string;
/**
 * What a per-child share *would* be if the pool were divided `children` ways,
 * clamped so it could never exceed today's ceiling.
 *
 * Reported, never applied. Dividing by a workspace count is not a sound policy
 * on its own: registration does not spawn a child, so a count including
 * dormant workspaces penalises the live ones, and the per-child floor means
 * divided shares can still sum past the pool. A real policy needs admission at
 * spawn time keyed on concurrently live children; this figure exists to size
 * that work, not to substitute for it.
 */
export declare function recommendedChildShareMb(budget: DaemonMemoryBudget, 
/** Must be at least 1. With no children there is no per-child share to model. */
children: number): number;
export declare function resolveDaemonMemoryBudget(input?: {
    budgetMb?: number;
    /** Test seam: bypasses detection so the arithmetic is pure. */
    availableMemoryMb?: number;
    /** Paired with availableMemoryMb; defaults to 'host'. */
    availableMemorySource?: AvailableMemorySource;
}): DaemonMemoryBudget;
export declare function formatMemoryBudgetStderr(budget: DaemonMemoryBudget): string;
