/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Standalone loader for the lowlight syntax-highlight engine.
 *
 * Kept in its own module — with zero imports beyond `lowlight` itself — so
 * that priming the cache from `test-setup.ts` does not transitively pull
 * `themeManager`, settings, or `@qwen-code/qwen-code-core` into every test
 * file's module graph. That cascade was observed to alter theme/config test
 * outcomes (e.g. theme-manager auto-detection and QWEN_HOME env tests).
 */
import type { Root } from 'hast';
export type Lowlight = {
    registered(language: string): boolean;
    highlight(language: string, value: string): Root;
    highlightAuto(value: string): Root;
};
export declare function getLowlightInstance(): Lowlight | null;
/**
 * Returns true if a recent load attempt failed and we're still inside the
 * cooldown window. Callers in render-hot paths can use this to skip both the
 * `loadLowlight()` call and any duplicate failure-log it would emit.
 */
export declare function isLowlightCoolingDown(): boolean;
/**
 * Kicks off (or returns the in-flight) load of the lowlight chunk. Exported
 * for two callers:
 *   1. `CodeColorizer.tsx` — fires the load on first colorize call so the
 *      next React commit picks up the highlighted output.
 *   2. `test-setup.ts` — awaits this once to keep snapshot tests
 *      deterministic without dragging more modules into the test graph.
 *
 * On import failure the rejection is cached for `LOWLIGHT_RETRY_COOLDOWN_MS`
 * (see `isLowlightCoolingDown`); subsequent calls inside the cooldown return
 * the cached rejection without retrying. After the cooldown, the next call
 * will retry the dynamic import — this recovers from transient errors
 * (EMFILE, antivirus locks) without losing the per-render short-circuit that
 * protects against permanently-broken installs.
 */
export declare function loadLowlight(): Promise<Lowlight>;
