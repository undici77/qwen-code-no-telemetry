/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Prompt Suggestion Hook for CLI
 *
 * Thin React wrapper around the framework-agnostic controller from core.
 */
import type { FollowupState, Config } from '@qwen-code/qwen-code-core';
export type { FollowupState } from '@qwen-code/qwen-code-core';
/**
 * Options for the hook
 */
export interface UseFollowupSuggestionsOptions {
    /** Whether the feature is enabled */
    enabled?: boolean;
    /** Callback when suggestion is accepted */
    onAccept?: (suggestion: string) => void;
    /** Config for telemetry logging */
    config?: Config;
    /** Whether the terminal is focused (for telemetry) */
    isFocused?: boolean;
}
/**
 * Result returned by the hook
 */
export interface UseFollowupSuggestionsReturn {
    /** Current state */
    state: FollowupState;
    /** Set suggestion text (called by parent component) */
    setSuggestion: (text: string | null) => void;
    /** Accept the current suggestion */
    accept: (method?: 'tab' | 'enter' | 'right', options?: {
        skipOnAccept?: boolean;
    }) => void;
    /** Dismiss the current suggestion */
    dismiss: () => void;
    /** Clear all state */
    clear: () => void;
    /**
     * Notify that the user typed while suggestion was visible.
     * Call from the input handler on first keystroke.
     */
    recordKeystroke: () => void;
}
/**
 * Hook for managing prompt suggestions in CLI.
 *
 * Delegates all timer/debounce/state logic to the shared
 * `createFollowupController` from core.
 */
export declare function useFollowupSuggestionsCLI(options?: UseFollowupSuggestionsOptions): UseFollowupSuggestionsReturn;
