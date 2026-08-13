/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import os from 'node:os';
// Mirrored from the inline literals in spawnChannel.ts:getAcpMemoryArgs()
// (only LEGACY_CHILD_HEAP_FRACTION and MAX_CHILD_HEAP_MB have counterparts
// there; the remaining constants are new to this module). If those change,
// update these to match. The import direction is blocked by the fast-path
// bundle closure check; reversing it is tracked as follow-up.
/** Mirrors the hardcoded 0.5 in spawnChannel.ts:getAcpMemoryArgs(). */
export const LEGACY_CHILD_HEAP_FRACTION = 0.5;
/** This module's own derived-budget fraction; free to move independently. */
export const DEFAULT_MEMORY_BUDGET_FRACTION = 0.5;
export const MIN_MEMORY_BUDGET_MB = 1_024;
export const MAX_MEMORY_BUDGET_MB = 1_048_576;
export const MIN_CHILD_HEAP_MB = 512;
export const MAX_CHILD_HEAP_MB = 16_384;
export const ROOT_RESERVE_FRACTION = 0.1;
export const MIN_ROOT_RESERVE_MB = 256;
export const MAX_ROOT_RESERVE_MB = 1_024;
function clamp(value, low, high) {
    return Math.min(Math.max(value, low), high);
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
export function detectAvailableMemoryMb() {
    const constrainedMemory = process
        .constrainedMemory;
    const constrained = typeof constrainedMemory === 'function' ? constrainedMemory() : 0;
    const totalBytes = os.totalmem();
    if (constrained > 0 && constrained < totalBytes) {
        return {
            memoryMb: Math.floor(constrained / (1024 * 1024)),
            source: 'constrained',
        };
    }
    return { memoryMb: Math.floor(totalBytes / (1024 * 1024)), source: 'host' };
}
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
export function legacyChildCeilingMb(availableMemoryMb) {
    const memoryMb = availableMemoryMb ?? detectAvailableMemoryMb().memoryMb;
    return Math.min(Math.floor(memoryMb * LEGACY_CHILD_HEAP_FRACTION), MAX_CHILD_HEAP_MB);
}
/**
 * Validates an operator-supplied budget. Range only — relating it to host
 * memory is `resolveDaemonMemoryBudget`'s job, because that is a capping
 * decision rather than a rejection.
 */
export function isValidMemoryBudgetMb(value) {
    return (Number.isSafeInteger(value) &&
        value >= MIN_MEMORY_BUDGET_MB &&
        value <= MAX_MEMORY_BUDGET_MB);
}
export function normalizeMemoryBudgetMb(value) {
    if (!isValidMemoryBudgetMb(value)) {
        throw new TypeError(`Invalid memoryBudgetMb: ${value}. ` +
            `Must be a safe integer in [${MIN_MEMORY_BUDGET_MB}, ${MAX_MEMORY_BUDGET_MB}].`);
    }
    return value;
}
export function memoryBudgetRangeError() {
    return ('qwen serve: --memory-budget-mb must be an integer in ' +
        `[${MIN_MEMORY_BUDGET_MB}, ${MAX_MEMORY_BUDGET_MB}].`);
}
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
export function recommendedChildShareMb(budget, 
/** Must be at least 1. With no children there is no per-child share to model. */
children) {
    const share = clamp(Math.floor(budget.childPoolMb / Math.max(children, 1)), MIN_CHILD_HEAP_MB, MAX_CHILD_HEAP_MB);
    return Math.min(share, budget.legacyChildCeilingMb);
}
export function resolveDaemonMemoryBudget(input = {}) {
    const detected = input.availableMemoryMb === undefined
        ? detectAvailableMemoryMb()
        : {
            memoryMb: input.availableMemoryMb,
            source: input.availableMemorySource ?? 'host',
        };
    const availableMemoryMb = detected.memoryMb;
    const configuredBudgetMb = input.budgetMb === undefined
        ? Math.min(Math.floor(availableMemoryMb * DEFAULT_MEMORY_BUDGET_FRACTION), MAX_MEMORY_BUDGET_MB)
        : normalizeMemoryBudgetMb(input.budgetMb);
    // Never report a denominator the machine cannot back, in either direction:
    // an explicit budget above available memory is capped, and a derived budget
    // below the documented minimum is left alone rather than clamped up.
    const effectiveBudgetMb = Math.min(configuredBudgetMb, availableMemoryMb);
    // The minimum reserve can exceed a very small budget, which would report a
    // reserve larger than the thing it is carved out of. Cap it so the three
    // figures stay consistent; such a host is already flagged insufficient.
    const rootReserveMb = Math.min(clamp(Math.floor(effectiveBudgetMb * ROOT_RESERVE_FRACTION), MIN_ROOT_RESERVE_MB, MAX_ROOT_RESERVE_MB), effectiveBudgetMb);
    return {
        configuredBudgetMb,
        effectiveBudgetMb,
        budgetSource: input.budgetMb === undefined ? 'derived' : 'flag',
        availableMemoryMb,
        availableMemorySource: detected.source,
        rootReserveMb,
        childPoolMb: effectiveBudgetMb - rootReserveMb,
        legacyChildCeilingMb: legacyChildCeilingMb(availableMemoryMb),
        insufficientMemory: effectiveBudgetMb < MIN_MEMORY_BUDGET_MB,
    };
}
export function formatMemoryBudgetStderr(budget) {
    let message = `qwen serve: memory budget ${budget.effectiveBudgetMb} MB ` +
        `(${budget.budgetSource}, ${budget.availableMemoryMb} MB available ` +
        `via ${budget.availableMemorySource})`;
    if (budget.effectiveBudgetMb < budget.configuredBudgetMb) {
        message += `; capped down from the configured ${budget.configuredBudgetMb} MB`;
    }
    if (budget.insufficientMemory) {
        message += `; below the ${MIN_MEMORY_BUDGET_MB} MB minimum budget`;
        if (budget.budgetSource === 'derived') {
            const minHostMb = Math.ceil(MIN_MEMORY_BUDGET_MB / DEFAULT_MEMORY_BUDGET_FRACTION);
            message +=
                ` (a derived budget needs a host with at least ~${minHostMb} MB;` +
                    ` pass --memory-budget-mb to override — requires at least ${MIN_MEMORY_BUDGET_MB} MB available)`;
        }
    }
    return message;
}
//# sourceMappingURL=daemon-memory-budget.js.map