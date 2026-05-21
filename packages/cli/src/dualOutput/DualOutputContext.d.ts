/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DualOutputBridge } from './DualOutputBridge.js';
/**
 * React context for the dual output bridge.
 * Provides access to the sidecar JSON event emitter throughout the
 * interactive UI component tree.
 */
export declare const DualOutputContext: import("react").Context<DualOutputBridge | null>;
/**
 * Hook to access the dual output bridge from any component or hook
 * within the interactive UI.
 *
 * Returns null when dual output is not enabled (no --json-fd or --json-file).
 */
export declare function useDualOutput(): DualOutputBridge | null;
