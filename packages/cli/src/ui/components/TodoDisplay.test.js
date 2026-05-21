import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { TodoDisplay } from './TodoDisplay.js';
describe('TodoDisplay', () => {
    const mockTodos = [
        {
            id: '1',
            content: 'Complete feature implementation',
            status: 'completed',
        },
        {
            id: '2',
            content: 'Write unit tests',
            status: 'in_progress',
        },
        {
            id: '3',
            content: 'Update documentation',
            status: 'pending',
        },
    ];
    it('should render todo list', () => {
        const { lastFrame } = render(_jsx(TodoDisplay, { todos: mockTodos }));
        const output = lastFrame();
        // Check all todo items are displayed
        expect(output).toContain('Complete feature implementation');
        expect(output).toContain('Write unit tests');
        expect(output).toContain('Update documentation');
    });
    it('should display correct status icons', () => {
        const { lastFrame } = render(_jsx(TodoDisplay, { todos: mockTodos }));
        const output = lastFrame();
        // Check status icons are present
        expect(output).toContain('●'); // completed
        expect(output).toContain('◐'); // in_progress
        expect(output).toContain('○'); // pending
    });
    it('should handle empty todo list', () => {
        const { lastFrame } = render(_jsx(TodoDisplay, { todos: [] }));
        const output = lastFrame();
        // Should render nothing for empty todos
        expect(output).toBe('');
    });
    it('should handle undefined todos', () => {
        const { lastFrame } = render(_jsx(TodoDisplay, { todos: undefined }));
        const output = lastFrame();
        // Should render nothing for undefined todos
        expect(output).toBe('');
    });
    it('should render tasks with different statuses', () => {
        const allCompleted = [
            { id: '1', content: 'Task 1', status: 'completed' },
            { id: '2', content: 'Task 2', status: 'completed' },
        ];
        const { lastFrame } = render(_jsx(TodoDisplay, { todos: allCompleted }));
        const output = lastFrame();
        expect(output).toContain('Task 1');
        expect(output).toContain('Task 2');
    });
    it('should render tasks with mixed statuses', () => {
        const mixedTodos = [
            { id: '1', content: 'Task 1', status: 'pending' },
            { id: '2', content: 'Task 2', status: 'in_progress' },
        ];
        const { lastFrame } = render(_jsx(TodoDisplay, { todos: mixedTodos }));
        const output = lastFrame();
        expect(output).toContain('Task 1');
        expect(output).toContain('Task 2');
    });
});
//# sourceMappingURL=TodoDisplay.test.js.map