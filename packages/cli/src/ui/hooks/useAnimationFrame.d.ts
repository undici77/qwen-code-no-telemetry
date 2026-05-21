/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Hook that polls a ref at a fixed interval and smoothly animates the
 * displayed value toward the real value. This avoids jarring jumps when
 * large chunks of characters arrive at once (e.g. tool call args JSON).
 *
 * Animation rules (matching Claude Code's SpinnerAnimationRow):
 * - Gap < 70:   increment by 3 per frame
 * - Gap 70–200: increment by ~20% of gap per frame
 * - Gap > 200:  increment by 50 per frame
 *
 * When the real value decreases (e.g. ref reset to 0), the displayed
 * value snaps immediately — animation only applies to increases.
 *
 * Pass `null` as intervalMs to pause polling entirely.
 *
 * @param watchRef - The ref to poll for changes.
 * @param intervalMs - How often to check (ms), or null to pause.
 * @returns The smoothly animated value.
 */
export declare function useAnimationFrame(watchRef: React.RefObject<number>, intervalMs?: number | null): number;
