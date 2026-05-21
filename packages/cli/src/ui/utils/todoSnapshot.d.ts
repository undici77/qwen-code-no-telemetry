/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TodoItem } from '../components/TodoDisplay.js';
import type { HistoryItem, HistoryItemWithoutId } from '../types.js';
export declare const STICKY_TODO_MAX_VISIBLE_ITEMS = 5;
export declare function getStickyTodos(history: readonly HistoryItem[], pendingHistoryItems: readonly HistoryItemWithoutId[]): TodoItem[] | null;
export declare function getOrderedStickyTodos(todos: readonly TodoItem[]): TodoItem[];
export declare function getStickyTodosRenderKey(todos: readonly TodoItem[] | null): string;
export declare function getStickyTodosLayoutKey(todos: readonly TodoItem[] | null, width: number, maxVisibleItems: number): string;
export declare function getStickyTodoMaxVisibleItems(terminalHeight: number): number;
