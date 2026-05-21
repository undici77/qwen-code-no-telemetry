/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { Suggestion } from '../components/SuggestionsDisplay.js';
export declare enum AtCompletionStatus {
    IDLE = "idle",
    INITIALIZING = "initializing",
    READY = "ready",
    SEARCHING = "searching",
    ERROR = "error"
}
export interface UseAtCompletionProps {
    enabled: boolean;
    pattern: string;
    config: Config | undefined;
    cwd: string;
    setSuggestions: (suggestions: Suggestion[]) => void;
    setIsLoadingSuggestions: (isLoading: boolean) => void;
}
export declare function useAtCompletion(props: UseAtCompletionProps): void;
