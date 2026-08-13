/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MAX_SUGGESTIONS_TO_SHOW } from '../components/SuggestionsDisplay.js';
/** Fixed display order of category tabs. */
const CATEGORY_ORDER = [
    'file',
    'session',
    'mcp',
    'extension',
];
export function useCompletion(options = {}) {
    // Raw, unfiltered suggestions as provided by producers. The publicly exposed
    // `suggestions` below is this list filtered to the active category tab, so
    // navigation/accept/display all operate on the same visible set.
    const [rawSuggestions, setSuggestions] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [visibleStartIndex, setVisibleStartIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isPerfectMatch, setIsPerfectMatch] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    // Skip the next clearDismissed call when the query changes due to an
    // accepted suggestion (dismissCompletion).  Accepting a suggestion also
    // mutates the buffer → changes the query, but we don't want to reset
    // dismissed in that case.
    const skipNextClearRef = useRef(false);
    // Tabs present in the current suggestion set. Only becomes multi-entry when
    // more than one category is present (e.g. files + sessions in `@` mode);
    // slash/file-only completion keeps a single 'all' entry so the UI hides the
    // tab bar and behavior is unchanged.
    const availableCategories = useMemo(() => {
        const present = new Set(rawSuggestions.map((s) => s.category ?? 'file'));
        const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
        return ordered.length > 1 ? ['all', ...ordered] : ['all'];
    }, [rawSuggestions]);
    // The visible suggestion set: the raw list filtered to the active tab.
    const suggestions = useMemo(() => activeCategory === 'all'
        ? rawSuggestions
        : rawSuggestions.filter((s) => (s.category ?? 'file') === activeCategory), [rawSuggestions, activeCategory]);
    // If the active tab disappears (suggestion set changed), fall back to 'all'.
    useEffect(() => {
        if (!availableCategories.includes(activeCategory)) {
            setActiveCategory('all');
            setActiveSuggestionIndex(0);
            setVisibleStartIndex(0);
        }
    }, [availableCategories, activeCategory]);
    // Clamp the active index when the filtered suggestion list shrinks within
    // a still-existing category (e.g. async search returns fewer items).
    useEffect(() => {
        setActiveSuggestionIndex((prev) => prev >= suggestions.length && suggestions.length > 0
            ? suggestions.length - 1
            : prev);
        setVisibleStartIndex((prev) => prev >= suggestions.length
            ? Math.max(0, suggestions.length - MAX_SUGGESTIONS_TO_SHOW)
            : prev);
    }, [suggestions.length]);
    const switchCategory = useCallback((direction) => {
        setActiveCategory((cur) => {
            const idx = availableCategories.indexOf(cur);
            if (idx === -1)
                return 'all';
            const next = (idx + direction + availableCategories.length) %
                availableCategories.length;
            return availableCategories[next];
        });
        setActiveSuggestionIndex(0);
        setVisibleStartIndex(0);
    }, [availableCategories]);
    const resetCompletionState = useCallback(() => {
        setSuggestions([]);
        setActiveCategory('all');
        setActiveSuggestionIndex(-1);
        setVisibleStartIndex(0);
        setShowSuggestions(false);
        setIsLoadingSuggestions(false);
        setIsPerfectMatch(false);
        setDismissed(false);
    }, []);
    const dismissCompletion = useCallback(() => {
        resetCompletionState();
        setDismissed(true);
        skipNextClearRef.current = true;
    }, [resetCompletionState]);
    // Clear dismissed flag when the completion query changes (user typed more).
    // Skip the clear on the render immediately following a dismiss, since
    // accepting a suggestion also changes the query.
    const prevQueryRef = useRef(undefined);
    useEffect(() => {
        if (options.query !== prevQueryRef.current) {
            if (skipNextClearRef.current) {
                skipNextClearRef.current = false;
            }
            else {
                setDismissed(false);
            }
            prevQueryRef.current = options.query;
        }
    }, [options.query]);
    const navigateUp = useCallback(() => {
        if (suggestions.length === 0)
            return;
        setActiveSuggestionIndex((prevActiveIndex) => {
            // Calculate new active index, handling wrap-around
            const newActiveIndex = prevActiveIndex <= 0 ? suggestions.length - 1 : prevActiveIndex - 1;
            // Adjust scroll position based on the new active index
            setVisibleStartIndex((prevVisibleStart) => {
                // Case 1: Wrapped around to the last item
                if (newActiveIndex === suggestions.length - 1 &&
                    suggestions.length > MAX_SUGGESTIONS_TO_SHOW) {
                    return Math.max(0, suggestions.length - MAX_SUGGESTIONS_TO_SHOW);
                }
                // Case 2: Scrolled above the current visible window
                if (newActiveIndex < prevVisibleStart) {
                    return newActiveIndex;
                }
                // Otherwise, keep the current scroll position
                return prevVisibleStart;
            });
            return newActiveIndex;
        });
    }, [suggestions.length]);
    const navigateDown = useCallback(() => {
        if (suggestions.length === 0)
            return;
        setActiveSuggestionIndex((prevActiveIndex) => {
            // Calculate new active index, handling wrap-around
            const newActiveIndex = prevActiveIndex >= suggestions.length - 1 ? 0 : prevActiveIndex + 1;
            // Adjust scroll position based on the new active index
            setVisibleStartIndex((prevVisibleStart) => {
                // Case 1: Wrapped around to the first item
                if (newActiveIndex === 0 &&
                    suggestions.length > MAX_SUGGESTIONS_TO_SHOW) {
                    return 0;
                }
                // Case 2: Scrolled below the current visible window
                const visibleEndIndex = prevVisibleStart + MAX_SUGGESTIONS_TO_SHOW;
                if (newActiveIndex >= visibleEndIndex) {
                    return newActiveIndex - MAX_SUGGESTIONS_TO_SHOW + 1;
                }
                // Otherwise, keep the current scroll position
                return prevVisibleStart;
            });
            return newActiveIndex;
        });
    }, [suggestions.length]);
    return {
        suggestions,
        activeSuggestionIndex,
        visibleStartIndex,
        showSuggestions,
        isLoadingSuggestions,
        isPerfectMatch,
        dismissed,
        setSuggestions,
        setShowSuggestions,
        setActiveSuggestionIndex,
        setVisibleStartIndex,
        setIsLoadingSuggestions,
        setIsPerfectMatch,
        resetCompletionState,
        dismissCompletion,
        navigateUp,
        navigateDown,
        activeCategory,
        availableCategories,
        switchCategory,
    };
}
//# sourceMappingURL=useCompletion.js.map