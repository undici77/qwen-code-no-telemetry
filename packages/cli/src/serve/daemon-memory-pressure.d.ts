/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Thresholds mirror `MemoryPressureMonitor` in core
 * (`packages/core/src/services/memoryPressureMonitor.ts`), which is the
 * established contract for what these words mean in this codebase. They are
 * duplicated rather than imported: the monitor is only constructed by
 * `Config.initialize()`, which the daemon never calls, and its limit
 * resolution is a private method. Consolidating means extracting from
 * `packages/core/src/services/**`, which is a maintainer-gated change and
 * belongs in its own review.
 */
export declare const SOFT_PRESSURE_RATIO = 0.5;
export declare const HARD_PRESSURE_RATIO = 0.65;
export declare const CRITICAL_PRESSURE_RATIO = 0.8;
export type DaemonMemoryPressureLevel = 'normal' | 'soft' | 'hard' | 'critical';
/**
 * Which side produced the reported ratio, or `unknown` when neither was
 * usable. `unknown` is not the same as `normal`: it says the daemon could not
 * measure its own pressure, which a consumer must not read as "fine".
 *
 * A side is usable only when *both* its numerator and its denominator are, so
 * this is also the field that says a reported `rssBytes: 0` / `heapUsedBytes:
 * 0` is a placeholder rather than a reading.
 */
export type DaemonMemoryPressureSource = 'rss' | 'heap' | 'unknown';
export interface DaemonMemoryPressure {
    level: DaemonMemoryPressureLevel;
    /** The larger of the two ratios below, which is what `level` classifies. */
    ratio: number;
    source: DaemonMemoryPressureSource;
    rssBytes: number;
    rssRatio: number;
    /**
     * Bytes the daemon tree may use: the cgroup limit, else host memory.
     *
     * Those two are not equally trustworthy as a denominator, and
     * `limits.memory.availableMemorySource` is what tells them apart. Under a
     * cgroup (`constrained`) this is exactly the number the OOM killer watches,
     * so `rssRatio` is the real thing. On bare metal (`host`) it is the size of
     * the machine, and the daemon is killed when the *machine* runs out — which
     * depends on every other process on the box. A daemon at 20% of a 64 GB host
     * beside a 55 GB neighbour reports `normal` right up until it dies, so under
     * `source: 'host'` read `rssRatio` as a lower bound on real pressure rather
     * than as a measurement of it. This is a denominator caveat and is not
     * covered by the separate one about the thresholds being uncalibrated.
     */
    availableBytes: number;
    heapUsedBytes: number;
    heapRatio: number;
    /**
     * V8's `heap_size_limit` for this process — the whole heap, not only the old
     * space `--max-old-space-size` names, which is what `heapUsedBytes` measures
     * against.
     */
    heapLimitBytes: number;
}
/**
 * Classifies the daemon root's memory pressure against two independent
 * denominators, and reports the worse one.
 *
 * Both are needed: a container usually dies by RSS against its cgroup limit,
 * while a process on a large host can exhaust V8's old space long before RSS
 * is a meaningful fraction of the machine. Reporting only one hides whichever
 * failure the deployment is actually heading for.
 *
 * This covers the daemon root process only. Aggregate child RSS is a separate
 * measurement — the sampler currently reads the primary ACP child alone — so
 * this figure must not be read as process-tree pressure.
 */
export declare function computeDaemonMemoryPressure(input: {
    /** Bytes, to match the sampler's gauges. Callers holding MB must convert. */
    rssBytes: number;
    heapUsedBytes: number;
    /**
     * Bytes. `DaemonMemoryBudget.availableMemoryMb` is in **megabytes** — the
     * one place these two modules meet, and the one place a factor of 1024² can
     * hide, since either unit produces a plausible-looking ratio.
     */
    availableBytes: number;
    /** Test seam; defaults to this process's real V8 ceiling. */
    heapLimitBytes?: number;
}): DaemonMemoryPressure;
