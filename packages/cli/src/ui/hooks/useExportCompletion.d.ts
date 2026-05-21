/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TextBuffer } from '../components/shared/text-buffer.js';
import type { Suggestion } from '../components/SuggestionsDisplay.js';
import type { SlashCommand } from '../commands/types.js';
import type { Key } from './useKeypress.js';
import type { UseCommandCompletionReturn } from './useCommandCompletion.js';
/**
 * Parse a single export format from an input buffer.
 *
 * The valid-format list is passed in so that adding a new "/export <fmt>"
 * sub-command to slashCommands automatically enables Phase-2 cycling for it,
 * without requiring a synchronous hard-coded regex update.
 *
 * Uses a simple slice-based approach (no regex) for two reasons:
 *   1. No escaping concerns when format names contain regex metacharacters.
 *   2. O(1) cost after the cheap startsWith prefix guard.
 */
export declare const getExportFormatFromInput: (input: string, validFormats: readonly string[]) => string | null;
/**
 * Compute the next index for export format cycling (round-robin).
 * Extracted as a module-level pure function to avoid per-keystroke
 * closure recreation inside handleInput.
 */
export declare const getNextExportCompletionIndex: (formatList: readonly string[], currentIndex: number, direction: "up" | "down") => number;
export interface ExportCompletionResult {
    /** Whether the suggestions panel should be visible (export-specific). */
    shouldShowSuggestions: boolean;
    /**
     * Display props for the SuggestionsDisplay component when export
     * suggestions are active, or null if the caller should fall back
     * to the generic completion state.
     */
    suggestionDisplayProps: {
        suggestions: Suggestion[];
        activeIndex: number;
        isLoading: boolean;
        scrollOffset: number;
    } | null;
    /**
     * Handle a keypress for export-specific completion logic.
     * Returns true if the key was consumed, false if the caller should
     * fall through to generic completion handling.
     */
    handleExportInput: (key: Key, completion: UseCommandCompletionReturn) => boolean;
    /** Reset all export cycling state (call on ESC / Ctrl+C / Ctrl+U / submit). */
    reset: () => void;
    /**
     * Allow the next buffer text change to seed export cycling if it becomes
     * exactly "/export <fmt>". Call this only for direct user text edits.
     */
    markNextTextChangeAsUserInput: () => void;
    /**
     * Shared "has navigated" flag.  The generic completion path sets this
     * to true on arrow navigation and the isPerfectMatch + Enter path reads
     * it.  Owned by this hook so both the export-specific and generic paths
     * share a single source of truth.
     */
    navigatedRef: React.MutableRefObject<boolean>;
    /**
     * Buffer text snapshot captured when navigatedRef was last set to true.
     * Used by the caller to detect stale navigation state when the buffer
     * has been modified externally (e.g. via setText in tests).
     */
    navigatedTextRef: React.MutableRefObject<string>;
}
export declare function useExportCompletion(buffer: TextBuffer, slashCommands: readonly SlashCommand[]): ExportCompletionResult;
