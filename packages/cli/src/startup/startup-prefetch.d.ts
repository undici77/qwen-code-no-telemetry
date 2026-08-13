/**
 * @license
 * Copyright 2026 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../config/settings.js';
/**
 * Starts pre-render startup prefetches that benefit from maximum lead time.
 *
 * This runs after `loadCliConfig()` has produced a Config, but before
 * `initializeApp()` and UI rendering. Keep this phase limited to work that is
 * cheap to start, independent of Ink/React, and safe to ignore on failure.
 */
export declare function startEarlyStartupPrefetches(config: Config): void;
/**
 * Starts post-render startup prefetches for ordinary interactive TUI sessions.
 *
 * This runs immediately after Ink's `render()` returns (`first_paint`). Tasks
 * here may load heavier modules or perform network/IPC work, but they must not
 * affect `startInteractiveUI()` success. `connectIde` is opt-in so headless,
 * stream-json, and ACP/Zed paths can keep their awaited IDE startup semantics.
 */
export declare function startPostRenderPrefetches(config: Config, settings: LoadedSettings, options?: {
    connectIde?: boolean;
    initializeTelemetry?: boolean;
}): void;
