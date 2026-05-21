/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { TodoItem } from './TodoDisplay.js';
interface StickyTodoListProps {
    todos: TodoItem[];
    width: number;
    maxVisibleItems?: number;
}
export declare const StickyTodoList: React.NamedExoticComponent<StickyTodoListProps>;
export {};
