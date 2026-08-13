/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Key } from './useKeypress.js';
export declare function removeLastGrapheme(value: string): string;
/**
 * Normalize deletion-key detection so Windows terminals that deliver
 * Backspace as the raw DEL byte (0x7F) without setting `name` are still
 * recognised.  The `name` field is the primary signal; the sequence-byte
 * fallback covers the case where the terminal emulator or ink-testing-library
 * does not normalise the key name on Windows.
 *
 * The byte fallback is guarded by `!key.ctrl && !key.meta` so that
 * Ctrl+H (`name: 'h'`, `ctrl: true`, `sequence: '\b'`) is not
 * misidentified as a deletion key.
 */
export declare const isDeletionKey: (key: Key) => boolean;
/**
 * True when the key represents a single printable character that
 * should be appended to the search buffer. Excludes:
 *   - any modified key (Ctrl/Meta combos handled separately);
 *   - bracketed pastes (a multi-line paste should never silently
 *     become a search query);
 *   - control characters (C0 and C1, including CSI);
 *   - DEL (0x7F) — Backspace's sequence byte, otherwise it would
 *     slip past the printable check and produce a literal DEL
 *     character in the query.
 *
 * Exported because the picker's outer keypress handler reuses this
 * predicate to recognize the "implicit search entry" gesture (any
 * printable letter typed in list mode flips into search and seeds
 * the query). Sharing the definition keeps the two paths in sync.
 */
export declare function isPrintableSearchChar(key: Key): boolean;
export interface UseSessionSearchInputOptions {
    /**
     * Called when the search frame should yield back to list mode —
     * fires synchronously when a non-empty → empty query transition
     * occurs (Esc, Ctrl+U/L, or the last Backspace), detected via a
     * ref-backed setter. The parent typically maps this to
     * `setViewMode('list')`.
     *
     * **Timing note**: `onExitToList` fires from within the state
     * updater, *before* React re-renders. At callback invocation time
     * `searchQueryRef.current` is already the new (empty) value, but
     * the `searchQuery` state variable still holds the old value. Parents
     * should rely on their own state for the current query, not on the
     * `searchQuery` return value.
     */
    onExitToList: () => void;
}
export interface UseSessionSearchInputResult {
    /** Current query text. */
    searchQuery: string;
    /**
     * Imperative setter — the parent uses this for "implicit entry"
     * (typing in list mode seeds the query) without going through
     * `handleSearchKey`. Functional updaters are supported and
     * recommended whenever the new value depends on the previous one.
     *
     * **Side effect**: when called with a value that transitions the
     * query from non-empty to empty, synchronously calls
     * `onExitToList()` via a ref-backed check *before* React re-renders.
     * The `searchQuery` state still holds the old value inside the
     * callback; parents should rely on their own state for the current
     * query value.
     */
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    /**
     * Process a key event that arrived while the picker is in search
     * mode. Always treated as the final handler for that key — the
     * search input has exclusive ownership of the keyboard while
     * focused, so anything this function doesn't recognize is
     * intentionally swallowed by the caller. (Mode-independent
     * shortcuts that need to fire in search mode — Enter, ↑/↓,
     * Ctrl+C — are routed by the parent before this delegate.)
     */
    handleSearchKey: (key: Key) => void;
}
export declare function useSessionSearchInput(options: UseSessionSearchInputOptions): UseSessionSearchInputResult;
