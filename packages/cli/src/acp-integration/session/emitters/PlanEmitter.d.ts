/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseEmitter } from './BaseEmitter.js';
import type { TodoItem } from '../types.js';
/**
 * Handles emission of plan/todo updates.
 *
 * This emitter is responsible for converting todo items to ACP plan entries
 * and sending plan updates to the client. It also provides utilities for
 * extracting todos from various sources (tool result displays, args, etc.).
 */
export declare class PlanEmitter extends BaseEmitter {
    /**
     * Emits a plan update with the given todo items.
     *
     * @param todos - Array of todo items to send as plan entries
     */
    emitPlan(todos: TodoItem[]): Promise<void>;
    /**
     * Extracts todos from tool result display or args.
     * Tries multiple sources in priority order:
     * 1. Result display object with type 'todo_list'
     * 2. Result display as JSON string
     * 3. Args with 'todos' array
     *
     * @param resultDisplay - The tool result display (object, string, or undefined)
     * @param args - The tool call arguments (fallback source)
     * @returns Array of todos if found, null otherwise
     */
    extractTodos(resultDisplay: unknown, args?: Record<string, unknown>): TodoItem[] | null;
    /**
     * Extracts todos from a result display value.
     * Handles both object and JSON string formats.
     */
    private extractFromResultDisplay;
}
