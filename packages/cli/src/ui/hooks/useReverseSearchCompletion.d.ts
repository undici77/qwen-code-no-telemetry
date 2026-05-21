/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TextBuffer } from '../components/shared/text-buffer.js';
import type { Suggestion } from '../components/SuggestionsDisplay.js';
export interface UseReverseSearchCompletionReturn {
    suggestions: Suggestion[];
    activeSuggestionIndex: number;
    visibleStartIndex: number;
    showSuggestions: boolean;
    isLoadingSuggestions: boolean;
    navigateUp: () => void;
    navigateDown: () => void;
    handleAutocomplete: (i: number) => void;
    resetCompletionState: () => void;
}
export declare function useReverseSearchCompletion(buffer: TextBuffer, history: readonly string[], reverseSearchActive: boolean): UseReverseSearchCompletionReturn;
