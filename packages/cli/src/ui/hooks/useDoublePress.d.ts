/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Generic double-press detection hook.
 *
 * Returns a callback that should be invoked on each press. On the first
 * press, optionally calls `onPending(true)` and starts a timer. If a
 * second press arrives within 800ms, calls `onDoublePress`. Otherwise,
 * the pending state is cleared after the timeout.
 *
 * @param onDoublePress Callback fired when a double-press is detected
 * @param onPending Optional callback to update pending state (for UI hints)
 * @returns A callback to invoke on each press
 */
export declare function useDoublePress(onDoublePress: () => void, onPending?: (pending: boolean) => void): () => void;
