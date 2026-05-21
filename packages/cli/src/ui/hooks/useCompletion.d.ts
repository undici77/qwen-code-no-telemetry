/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Suggestion } from '../components/SuggestionsDisplay.js';
export interface UseCompletionReturn {
    suggestions: Suggestion[];
    activeSuggestionIndex: number;
    visibleStartIndex: number;
    showSuggestions: boolean;
    isLoadingSuggestions: boolean;
    isPerfectMatch: boolean;
    setSuggestions: React.Dispatch<React.SetStateAction<Suggestion[]>>;
    setActiveSuggestionIndex: React.Dispatch<React.SetStateAction<number>>;
    setVisibleStartIndex: React.Dispatch<React.SetStateAction<number>>;
    setIsLoadingSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
    setIsPerfectMatch: React.Dispatch<React.SetStateAction<boolean>>;
    setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
    resetCompletionState: () => void;
    navigateUp: () => void;
    navigateDown: () => void;
}
export declare function useCompletion(): UseCompletionReturn;
