/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { MIN_CHILD_HEAP_MB, } from './daemon-memory-budget.js';
import { MAX_DAEMON_WORKSPACES } from './channel-control-timeouts.js';
export function createChildHeapPolicy(options) {
    const { budget, mode } = options;
    let refusals = 0;
    // A FIXED partition, not a share of the pool divided by the children live
    // at this instant. A per-spawn share bounds the child *count* but not the
    // memory: V8 cannot lower a running child's ceiling, so grants accumulate
    // as P + P/2 + P/3 + ... = P x H(n) — 2.6x the pool at seven children on an
    // 8 GB host. Holding the ceiling constant makes the total n * ceiling, and
    // admitting at most `maxConcurrentChildren` keeps that inside the pool by
    // construction, with no ledger and no dependence on arrival order.
    //
    // Not clamped to a minimum of one. A pool below `MIN_CHILD_HEAP_MB` hosts
    // no child at all, and saying "1" there produced a ceiling of 0 — which V8
    // reads as its *default* heap, roughly 4 GB, against a pool of nothing.
    const admissible = Math.min(Math.floor(budget.childPoolMb / MIN_CHILD_HEAP_MB), MAX_DAEMON_WORKSPACES);
    // `floor(pool / admissible) >= MIN_CHILD_HEAP_MB` by construction, but the
    // legacy cap is `floor(available / 2)` and is under the floor whenever
    // available memory is below 1024 MB. The `Math.min` lets it win, so the
    // partition could publish a ceiling *below* the `minChildHeapMb` sitting
    // next to it in the same snapshot — a host with 768 MB available and an
    // explicit `--memory-budget-mb 1024` modeled one child at 384 MB. Not
    // reachable from a derived budget (the pool hits 0 first), but the docs tell
    // operators on exactly those hosts to pass that flag, so the documented
    // remedy is what reaches the band.
    //
    // Refuse the model rather than shrink under the floor: a ceiling the module
    // says no child may run at is not a partition, and this is the figure a
    // future `enforce` would hand to `--max-old-space-size`. Such a host already
    // reports `insufficientMemory`, which is where an operator should be reading
    // it from.
    const rawCeilingMb = admissible > 0
        ? Math.min(Math.floor(budget.childPoolMb / admissible), budget.legacyChildCeilingMb)
        : null;
    const modelable = rawCeilingMb !== null && rawCeilingMb >= MIN_CHILD_HEAP_MB;
    // Kept in lockstep: publishing "one child fits" beside a null ceiling would
    // be the same contradiction from the other side.
    const maxConcurrentChildren = modelable ? admissible : 0;
    const perChildCeilingMb = modelable ? rawCeilingMb : null;
    return {
        decide(concurrentChildren) {
            if (mode === 'off')
                return { refuse: false };
            const refuse = concurrentChildren > maxConcurrentChildren;
            if (refuse)
                refusals += 1;
            return { refuse };
        },
        snapshot() {
            // `off` publishes no partition. The figures are computed above either
            // way — the arithmetic is free and the code stays branchless — but
            // reporting them under a mode documented as "do not model it" would
            // hand an operator a 7-child / 526 MB partition they switched off, with
            // nothing on the wire saying it is inert.
            const modeled = mode !== 'off';
            return {
                mode,
                childPoolMb: budget.childPoolMb,
                minChildHeapMb: MIN_CHILD_HEAP_MB,
                maxConcurrentChildren: modeled ? maxConcurrentChildren : null,
                perChildCeilingMb: modeled ? perChildCeilingMb : null,
                refusals,
            };
        },
    };
}
//# sourceMappingURL=child-heap-policy.js.map