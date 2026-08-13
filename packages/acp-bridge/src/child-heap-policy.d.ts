/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type DaemonMemoryBudget } from './daemon-memory-budget.js';
/**
 * Whether the daemon models a per-child heap partition.
 *
 * `off` — do not model it.
 *
 * `observe` — compute the partition and count the spawns it would have
 * refused. Nothing is applied: no child receives a derived
 * `--max-old-space-size`, and no spawn is refused.
 *
 * There is deliberately no `enforce` yet. Applying the partition needs a way
 * to tell an operator beforehand whether their workload fits it, and that
 * observation does not exist: `refusals` below counts admission pressure, not
 * whether a child would have survived the ceiling. Enforcing on a signal that
 * cannot answer the question it is being read for is how a healthy daemon gets
 * switched into an OOM loop. The enforcing mode ships with the measurement
 * that justifies it — peak old-space per child, compared against
 * `perChildCeilingMb`.
 */
export type ChildHeapMode = 'off' | 'observe';
export interface ChildHeapPolicySnapshot {
    mode: ChildHeapMode;
    childPoolMb: number;
    minChildHeapMb: number;
    /**
     * Children the pool could host concurrently under the modeled partition.
     * **0** when no partition can be modeled at all — either the pool cannot
     * cover one child at `minChildHeapMb`, or the ceiling would land under that
     * floor once capped at today's host-derived one. Both are real states on a
     * small host, and neither is the same as 1.
     *
     * `null` under `off`, which models nothing. That is a different statement
     * from `0`: zero is a computed answer meaning "this pool hosts no child",
     * while null means no partition was computed at all. Collapsing them would
     * make an operator who disabled the model read it as a host too small to
     * run anything.
     */
    maxConcurrentChildren: number | null;
    /**
     * The ceiling every child would receive. Never 0 and never below
     * `minChildHeapMb` — `null` instead, under `off` and on any host where the
     * partition cannot be modeled within that floor. A zero would be worse than
     * useless: `--max-old-space-size=0` means *V8's default heap*, so emitting
     * one would authorise gigabytes against an empty pool.
     */
    perChildCeilingMb: number | null;
    /**
     * Spawns that would have been refused for exceeding
     * `maxConcurrentChildren`.
     *
     * Read it as admission pressure and nothing more. In particular a count of
     * 0 does **not** mean the partition is safe to apply: children currently
     * run on the far larger host-derived ceiling, so a workload needing more
     * old space than `perChildCeilingMb` is perfectly healthy here and would
     * only fail once the partition were applied.
     *
     * Two ways it counts something other than capacity pressure, both by
     * construction:
     *
     * - **Channel swaps at full occupancy.** The decision reads
     *   `committedProcessCount`, which counts a terminating child until it
     *   actually exits — deliberately, since its memory is still resident. So a
     *   replacement spawned before the old child exits transiently makes the
     *   count one higher than steady state. Where `MAX_DAEMON_WORKSPACES` is the
     *   binding term (`childPoolMb >= 12800`, i.e. a ~32 GB host and up), a
     *   daemon at 25 live children books a refusal on every channel replacement,
     *   with no memory pressure involved. Do not net this out by giving the
     *   comparison swap headroom: that would admit a 26th ceiling against a
     *   25-child pool, trading a metric artifact for real overcommit.
     * - **Hosts too small to model a partition.** `maxConcurrentChildren` is 0
     *   there, so this equals the total ACP spawn count. Correct by the
     *   definition and alarming to read; `insufficientMemory` on the budget is
     *   the field that says why.
     */
    refusals: number;
}
export interface ChildHeapPolicy {
    /**
     * @param concurrentChildren Children already committed *including this one*
     *   — `ProcessRegistry.committedProcessCount` taken after `reserve()`.
     */
    decide(concurrentChildren: number): {
        refuse: boolean;
    };
    snapshot(): ChildHeapPolicySnapshot;
}
export declare function createChildHeapPolicy(options: {
    budget: DaemonMemoryBudget;
    mode: ChildHeapMode;
}): ChildHeapPolicy;
