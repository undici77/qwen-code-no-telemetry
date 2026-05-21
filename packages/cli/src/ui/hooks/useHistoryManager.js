/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useCallback, useMemo } from 'react';
/**
 * Custom hook to manage the chat history state.
 *
 * Encapsulates the history array, message ID generation, adding items,
 * updating items, and clearing the history.
 */
export function useHistory() {
    const [history, setHistory] = useState([]);
    const messageIdCounterRef = useRef(0);
    // Generates a unique message ID based on a timestamp and a counter.
    const getNextMessageId = useCallback((baseTimestamp) => {
        messageIdCounterRef.current += 1;
        return baseTimestamp + messageIdCounterRef.current;
    }, []);
    const loadHistory = useCallback((newHistory) => {
        setHistory(newHistory);
    }, []);
    // Adds a new item to the history state with a unique ID.
    const addItem = useCallback((itemData, baseTimestamp) => {
        const id = getNextMessageId(baseTimestamp);
        const newItem = { ...itemData, id };
        setHistory((prevHistory) => {
            if (prevHistory.length > 0) {
                const lastItem = prevHistory[prevHistory.length - 1];
                // Prevent adding duplicate consecutive user messages
                if (lastItem.type === 'user' &&
                    newItem.type === 'user' &&
                    lastItem.text === newItem.text) {
                    return prevHistory; // Don't add the duplicate
                }
            }
            return [...prevHistory, newItem];
        });
        return id; // Return the generated ID (even if not added, to keep signature)
    }, [getNextMessageId]);
    /**
     * Updates an existing history item identified by its ID.
     * @deprecated Prefer not to update history item directly as we are currently
     * rendering all history items in <Static /> for performance reasons. Only use
     * if ABSOLUTELY NECESSARY
     */
    //
    const updateItem = useCallback((id, updates) => {
        setHistory((prevHistory) => prevHistory.map((item) => {
            if (item.id === id) {
                // Apply updates based on whether it's an object or a function
                const newUpdates = typeof updates === 'function' ? updates(item) : updates;
                return { ...item, ...newUpdates };
            }
            return item;
        }));
    }, []);
    // Clears the entire history state and resets the ID counter.
    const clearItems = useCallback(() => {
        setHistory([]);
        messageIdCounterRef.current = 0;
    }, []);
    // Truncates history to exclude the item with the given ID and everything after it.
    const truncateToItem = useCallback((itemId) => {
        setHistory((prev) => {
            const index = prev.findIndex((h) => h.id === itemId);
            return index === -1 ? prev : prev.slice(0, index);
        });
    }, []);
    return useMemo(() => ({
        history,
        addItem,
        updateItem,
        clearItems,
        loadHistory,
        truncateToItem,
    }), [history, addItem, updateItem, clearItems, loadHistory, truncateToItem]);
}
//# sourceMappingURL=useHistoryManager.js.map