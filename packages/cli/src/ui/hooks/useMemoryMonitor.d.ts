/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type HistoryItemWithoutId } from '../types.js';
export declare const MEMORY_WARNING_THRESHOLD: number;
export declare const MEMORY_CHECK_INTERVAL: number;
interface MemoryMonitorOptions {
    addItem: (item: HistoryItemWithoutId, timestamp: number) => void;
}
export declare const useMemoryMonitor: ({ addItem }: MemoryMonitorOptions) => void;
export {};
