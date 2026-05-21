/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { MAX_WIDTH } from './PrepareLabel.js';
import type { CommandKind, CommandSource, ExecutionMode } from '../commands/types.js';
export interface Suggestion {
    label: string;
    value: string;
    description?: string;
    matchedIndex?: number;
    /** @deprecated Use source/sourceBadge instead. */
    commandKind?: CommandKind;
    source?: CommandSource;
    sourceLabel?: string;
    sourceBadge?: string;
    argumentHint?: string;
    matchedAlias?: string;
    supportedModes?: ExecutionMode[];
    modelInvocable?: boolean;
}
interface SuggestionsDisplayProps {
    suggestions: Suggestion[];
    activeIndex: number;
    isLoading: boolean;
    width: number;
    scrollOffset: number;
    userInput: string;
    mode: 'reverse' | 'slash';
    expandedIndex?: number;
}
export declare const MAX_SUGGESTIONS_TO_SHOW = 8;
export { MAX_WIDTH };
export declare function SuggestionsDisplay({ suggestions, activeIndex, isLoading, width, scrollOffset, userInput, mode, expandedIndex, }: SuggestionsDisplayProps): import("react/jsx-runtime").JSX.Element | null;
