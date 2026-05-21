/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKeypress } from './useKeypress.js';
import { useSessionPicker } from './useSessionPicker.js';
vi.mock('./useKeypress.js');
let activeKeypressHandler = null;
const session = (sessionId, overrides = {}) => ({
    sessionId,
    cwd: '/repo',
    startTime: '2026-01-01T00:00:00.000Z',
    mtime: Date.now(),
    prompt: `prompt ${sessionId}`,
    filePath: `/repo/${sessionId}.jsonl`,
    ...overrides,
});
describe('useSessionPicker', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    const sessions = [
        session('one', { prompt: 'alpha task' }),
        session('two', { prompt: 'beta task' }),
        session('three', { prompt: 'gamma task' }),
    ];
    beforeEach(() => {
        activeKeypressHandler = null;
        vi.mocked(useKeypress).mockImplementation((handler, options) => {
            activeKeypressHandler = options?.isActive ? handler : null;
        });
        onSelect.mockClear();
        onCancel.mockClear();
    });
    const pressKey = (name, sequence = name, overrides = {}) => {
        act(() => {
            if (!activeKeypressHandler) {
                throw new Error(`No active keypress handler for ${name}`);
            }
            activeKeypressHandler({
                name,
                sequence,
                ctrl: false,
                meta: false,
                shift: false,
                paste: false,
                ...overrides,
            });
        });
    };
    const renderPicker = (initialSessions = sessions, options = {}) => renderHook(() => useSessionPicker({
        sessionService: null,
        initialSessions,
        maxVisibleItems: 5,
        onSelect,
        onCancel,
        ...options,
    }));
    it('uses Ctrl+N and Ctrl+P as readline aliases for list navigation', () => {
        const { result } = renderPicker();
        expect(result.current.selectedIndex).toBe(0);
        pressKey('n', '\u000E', { ctrl: true });
        expect(result.current.selectedIndex).toBe(1);
        pressKey('p', '\u0010', { ctrl: true });
        expect(result.current.selectedIndex).toBe(0);
    });
    it('uses Ctrl+P at the top of the list to enter search mode', () => {
        const { result } = renderPicker();
        expect(result.current.viewMode).toBe('list');
        pressKey('p', '\u0010', { ctrl: true });
        expect(result.current.viewMode).toBe('search');
        expect(result.current.selectedIndex).toBe(0);
    });
    it('uses Ctrl+N to leave search mode when matches exist', () => {
        const { result } = renderPicker();
        pressKey('/', '/');
        expect(result.current.viewMode).toBe('search');
        pressKey('n', '\u000E', { ctrl: true });
        expect(result.current.viewMode).toBe('list');
        expect(result.current.filteredSessions).toHaveLength(3);
    });
    it('keeps search mode on Ctrl+N when the query has no matches', () => {
        const { result } = renderPicker();
        pressKey('z', 'z');
        expect(result.current.viewMode).toBe('search');
        expect(result.current.filteredSessions).toHaveLength(0);
        pressKey('n', '\u000E', { ctrl: true });
        expect(result.current.viewMode).toBe('search');
        expect(result.current.filteredSessions).toHaveLength(0);
    });
});
//# sourceMappingURL=useSessionPicker.test.js.map