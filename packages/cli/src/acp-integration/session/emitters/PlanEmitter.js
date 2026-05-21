/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseEmitter } from './BaseEmitter.js';
/**
 * Handles emission of plan/todo updates.
 *
 * This emitter is responsible for converting todo items to ACP plan entries
 * and sending plan updates to the client. It also provides utilities for
 * extracting todos from various sources (tool result displays, args, etc.).
 */
export class PlanEmitter extends BaseEmitter {
    /**
     * Emits a plan update with the given todo items.
     *
     * @param todos - Array of todo items to send as plan entries
     */
    async emitPlan(todos) {
        const entries = todos.map((todo) => ({
            content: todo.content,
            priority: 'medium', // Default priority since todos don't have priority
            status: todo.status,
        }));
        await this.sendUpdate({
            sessionUpdate: 'plan',
            entries,
        });
    }
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
    extractTodos(resultDisplay, args) {
        // Try resultDisplay first (final state from tool execution)
        const fromDisplay = this.extractFromResultDisplay(resultDisplay);
        if (fromDisplay)
            return fromDisplay;
        // Fallback to args (initial state)
        if (args && Array.isArray(args['todos'])) {
            return args['todos'];
        }
        return null;
    }
    /**
     * Extracts todos from a result display value.
     * Handles both object and JSON string formats.
     */
    extractFromResultDisplay(resultDisplay) {
        if (!resultDisplay)
            return null;
        // Handle direct object with type 'todo_list'
        if (typeof resultDisplay === 'object') {
            const obj = resultDisplay;
            if (obj['type'] === 'todo_list' && Array.isArray(obj['todos'])) {
                return obj['todos'];
            }
        }
        // Handle JSON string (from subagent events)
        if (typeof resultDisplay === 'string') {
            try {
                const parsed = JSON.parse(resultDisplay);
                if (parsed?.['type'] === 'todo_list' &&
                    Array.isArray(parsed['todos'])) {
                    return parsed['todos'];
                }
            }
            catch {
                // Not JSON, ignore
            }
        }
        return null;
    }
}
//# sourceMappingURL=PlanEmitter.js.map