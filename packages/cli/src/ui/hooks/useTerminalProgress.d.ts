/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { StreamingState } from '../types.js';
/**
 * Emits OSC 9;4 terminal progress bar sequences based on streaming state.
 * Shows an indeterminate progress spinner in the terminal tab when tools
 * are executing, and clears it when idle.
 */
export declare function useTerminalProgress(streamingState: StreamingState, hasToolExecuting: boolean): void;
