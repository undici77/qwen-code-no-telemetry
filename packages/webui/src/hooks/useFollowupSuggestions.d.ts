/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FollowupState } from '../types/followup.js';
export type { FollowupState } from '../types/followup.js';
export interface UseFollowupSuggestionsOptions {
    enabled?: boolean;
    onAccept?: (suggestion: string) => void;
    onOutcome?: (params: {
        outcome: 'accepted' | 'ignored';
        accept_method?: 'tab' | 'enter' | 'right';
        time_ms: number;
        suggestion_length: number;
    }) => void;
}
export interface UseFollowupSuggestionsReturn {
    state: FollowupState;
    getPlaceholder: (defaultPlaceholder: string) => string;
    setSuggestion: (text: string | null) => void;
    /** Accept the current suggestion */
    accept: (method?: 'tab' | 'enter' | 'right', options?: {
        skipOnAccept?: boolean;
    }) => void;
    /** Dismiss the current suggestion */
    dismiss: () => void;
    clear: () => void;
}
export declare function useFollowupSuggestions(options?: UseFollowupSuggestionsOptions): UseFollowupSuggestionsReturn;
