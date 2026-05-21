/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Owns the search-query state and the editing-key handler used by the
 * session picker while it's in search mode.
 *
 * Scoped intentionally narrow: this hook only knows how to mutate the
 * query (append a printable char, pop a char, clear) and how to ask
 * its parent to leave search mode. Mode transitions, navigation
 * (Enter / ↑ / ↓ / Ctrl+C), list-only shortcuts (Ctrl+B branch
 * toggle, Space-preview), and the "implicit entry" fallback that
 * seeds the query from list mode are all the parent's responsibility
 * — kept out of here so the search editor can be reasoned about as a
 * small, append-only buffer with a few escape hatches.
 *
 * Inspired by claude-code's `useSearchInput` but trimmed to qwen's
 * current feature set: no cursor movement, no kill ring, no word-wise
 * editing. Adding those later only requires extending this hook —
 * the outer picker stays untouched.
 */
import { useCallback, useRef, useState } from 'react';
const DELETION_KEY_NAMES = new Set(['backspace', 'delete']);
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
const isDeletionKey = (key) => DELETION_KEY_NAMES.has(key.name) ||
    (!key.ctrl &&
        !key.meta &&
        (key.sequence === '\x7f' || key.sequence === '\b'));
/**
 * True when the key represents a single printable character that
 * should be appended to the search buffer. Excludes:
 *   - any modified key (Ctrl/Meta combos handled separately);
 *   - bracketed pastes (a multi-line paste should never silently
 *     become a search query);
 *   - control characters (sequences below 0x20 like Tab/Enter/Esc);
 *   - DEL (0x7F) — Backspace's sequence byte, otherwise it would
 *     slip past the printable check and produce a literal DEL
 *     character in the query.
 *
 * Exported because the picker's outer keypress handler reuses this
 * predicate to recognize the "implicit search entry" gesture (any
 * printable letter typed in list mode flips into search and seeds
 * the query). Sharing the definition keeps the two paths in sync.
 */
export function isPrintableSearchChar(key) {
    if (key.ctrl || key.meta || key.paste)
        return false;
    if (key.sequence.length !== 1)
        return false;
    const code = key.sequence.charCodeAt(0);
    return code >= 0x20 && code !== 0x7f;
}
export function useSessionSearchInput(options) {
    const { onExitToList } = options;
    const [searchQuery, rawSetSearchQuery] = useState('');
    const searchQueryRef = useRef('');
    const onExitToListRef = useRef(onExitToList);
    onExitToListRef.current = onExitToList;
    /**
     * Ref-backed setter that detects the non-empty → empty transition
     * synchronously, without waiting for a `useEffect` flush.
     *
     * The synchronous ref check is the primary exit path.  The
     * `useEffect` that previously drove this was vulnerable to a
     * one-frame delay on Windows where the component rendered in
     * search mode with an empty query before the effect fired,
     * causing the "Press / to search" hint to be absent.
     *
     * `onExitToList` is read from a ref so that `handleSearchKey`
     * (which depends on `setSearchQuery`) does not need to be
     * recreated when the parent passes a new callback reference.
     */
    const setSearchQuery = useCallback((nextValue) => {
        const prev = searchQueryRef.current;
        const next = typeof nextValue === 'function'
            ? nextValue(prev)
            : nextValue;
        searchQueryRef.current = next;
        rawSetSearchQuery(next);
        if (prev !== '' && next === '') {
            onExitToListRef.current();
        }
    }, []);
    const handleSearchKey = useCallback((key) => {
        const { name, sequence, ctrl } = key;
        if (name === 'escape') {
            // Drop the query; the ref-backed setter fires onExitToList
            // synchronously when the transition is non-empty → empty.
            setSearchQuery('');
            return;
        }
        if (isDeletionKey(key)) {
            // Pop one char. The ref-backed setter detects when the last
            // char is removed and exits to list mode immediately.
            setSearchQuery((q) => q.slice(0, -1));
            return;
        }
        if (ctrl && (name === 'u' || name === 'l')) {
            // Wipe the query and exit via the ref-backed setter.
            setSearchQuery('');
            return;
        }
        if (isPrintableSearchChar(key)) {
            setSearchQuery((q) => q + sequence);
            return;
        }
        // Anything else (Ctrl+B, Tab, Page keys, …) is silently
        // swallowed by the caller — search owns the keyboard.
    }, [setSearchQuery]);
    return { searchQuery, setSearchQuery, handleSearchKey };
}
//# sourceMappingURL=useSessionSearchInput.js.map