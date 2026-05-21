/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HistoryItemWithoutId } from '../types.js';
interface VerboseModeContextType {
    verboseMode: boolean;
    frozenSnapshot: HistoryItemWithoutId[] | null;
}
export declare const useVerboseMode: () => VerboseModeContextType;
export declare const VerboseModeProvider: import("react").Provider<VerboseModeContextType>;
export {};
