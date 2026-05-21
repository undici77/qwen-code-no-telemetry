/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
// This threshold is item-count based, not line-count based. A single long
// response can fill the viewport while still counting as one item, so the
// sticky panel may stay hidden longer than strictly necessary. That is
// preferable to duplicating a recently committed inline TodoWrite result.
// On tall terminals, TodoWrite -> short text -> small tool call can still
// leave the inline result visible when the sticky panel appears.
const MIN_HISTORY_ITEMS_AFTER_TODO_BEFORE_STICKY = 2;
export const STICKY_TODO_MAX_VISIBLE_ITEMS = 5;
const STICKY_TODO_ROWS_PER_VISIBLE_ITEM = 5;
const STICKY_TODO_STATUS_PRIORITY = {
    in_progress: 0,
    pending: 1,
    completed: 2,
};
function clampStickyTodoVisibleItems(value) {
    if (!Number.isFinite(value)) {
        return STICKY_TODO_MAX_VISIBLE_ITEMS;
    }
    return Math.max(1, Math.min(STICKY_TODO_MAX_VISIBLE_ITEMS, Math.floor(value)));
}
function extractTodosFromResultDisplay(resultDisplay) {
    if (!resultDisplay) {
        return null;
    }
    if (typeof resultDisplay === 'object') {
        const candidate = resultDisplay;
        if (candidate['type'] === 'todo_list' &&
            Array.isArray(candidate['todos'])) {
            return candidate['todos'];
        }
    }
    if (typeof resultDisplay === 'string') {
        try {
            const parsed = JSON.parse(resultDisplay);
            if (parsed['type'] === 'todo_list' && Array.isArray(parsed['todos'])) {
                return parsed['todos'];
            }
        }
        catch {
            return null;
        }
    }
    return null;
}
function findLatestTodoSnapshot(items) {
    for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
        const item = items[itemIndex];
        if (item.type !== 'tool_group') {
            continue;
        }
        for (let toolIndex = item.tools.length - 1; toolIndex >= 0; toolIndex -= 1) {
            const tool = item.tools[toolIndex];
            const todos = extractTodosFromResultDisplay(tool.resultDisplay);
            if (todos) {
                return {
                    itemIndex,
                    todos: todos.length > 0 ? todos : null,
                };
            }
        }
    }
    return undefined;
}
function areAllTodosCompleted(todos) {
    return todos.length > 0 && todos.every((todo) => todo.status === 'completed');
}
function isRecentHistoryTodoSnapshot(snapshotItemIndex, historyLength) {
    const historyItemsAfterSnapshot = historyLength - snapshotItemIndex - 1;
    return historyItemsAfterSnapshot < MIN_HISTORY_ITEMS_AFTER_TODO_BEFORE_STICKY;
}
export function getStickyTodos(history, pendingHistoryItems) {
    const pendingSnapshot = findLatestTodoSnapshot(pendingHistoryItems);
    if (pendingSnapshot !== undefined) {
        // The pending TodoWrite result is already rendered inline above the
        // composer, so defer the sticky panel until the turn commits to history.
        return null;
    }
    const historySnapshot = findLatestTodoSnapshot(history);
    if (historySnapshot === undefined || historySnapshot.todos === null) {
        return null;
    }
    // Ink Static writes committed history to scrollback, and does not expose a
    // reliable per-item viewport API. Treat very recent TodoWrite snapshots as
    // still visible so the footer does not duplicate the inline result.
    if (isRecentHistoryTodoSnapshot(historySnapshot.itemIndex, history.length)) {
        return null;
    }
    if (areAllTodosCompleted(historySnapshot.todos)) {
        return null;
    }
    return historySnapshot.todos;
}
export function getOrderedStickyTodos(todos) {
    return todos
        .map((todo, index) => ({ todo, index }))
        .sort((left, right) => STICKY_TODO_STATUS_PRIORITY[left.todo.status] -
        STICKY_TODO_STATUS_PRIORITY[right.todo.status] ||
        left.index - right.index)
        .map(({ todo }) => todo);
}
export function getStickyTodosRenderKey(todos) {
    if (!todos) {
        return 'null';
    }
    return JSON.stringify(todos.map((todo) => [todo.id, todo.content, todo.status]));
}
export function getStickyTodosLayoutKey(todos, width, maxVisibleItems) {
    if (!todos) {
        return 'null';
    }
    const visibleTodoCount = clampStickyTodoVisibleItems(maxVisibleItems);
    const visibleTodos = todos.slice(0, visibleTodoCount);
    const hasHiddenTodos = todos.length > visibleTodos.length;
    return JSON.stringify({
        width,
        maxVisibleItems: visibleTodoCount,
        hasHiddenTodos,
        todos: visibleTodos.map((todo) => [todo.id, todo.content]),
    });
}
export function getStickyTodoMaxVisibleItems(terminalHeight) {
    if (!Number.isFinite(terminalHeight) || terminalHeight <= 0) {
        return STICKY_TODO_MAX_VISIBLE_ITEMS;
    }
    return clampStickyTodoVisibleItems(terminalHeight / STICKY_TODO_ROWS_PER_VISIBLE_ITEM);
}
//# sourceMappingURL=todoSnapshot.js.map