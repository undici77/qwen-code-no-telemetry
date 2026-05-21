import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import { MemoryDialog } from './MemoryDialog.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { useLaunchEditor } from '../hooks/useLaunchEditor.js';
import { useKeypress } from '../hooks/useKeypress.js';
vi.mock('../contexts/ConfigContext.js', () => ({
    useConfig: vi.fn(),
}));
vi.mock('../contexts/SettingsContext.js', () => ({
    useSettings: vi.fn(),
}));
vi.mock('../hooks/useLaunchEditor.js', () => ({
    useLaunchEditor: vi.fn(),
}));
vi.mock('../hooks/useKeypress.js', () => ({
    useKeypress: vi.fn(),
}));
const mockedUseConfig = vi.mocked(useConfig);
const mockedUseSettings = vi.mocked(useSettings);
const mockedUseLaunchEditor = vi.mocked(useLaunchEditor);
const mockedUseKeypress = vi.mocked(useKeypress);
describe('MemoryDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseConfig.mockReturnValue({
            getWorkingDir: vi.fn(() => '/tmp/project'),
            getProjectRoot: vi.fn(() => '/tmp/project'),
            getManagedAutoMemoryEnabled: vi.fn(() => false),
            getManagedAutoDreamEnabled: vi.fn(() => false),
        });
        mockedUseSettings.mockReturnValue({ setValue: vi.fn() });
        mockedUseLaunchEditor.mockReturnValue(vi.fn());
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('moves selection with down arrow key events', () => {
        const { lastFrame } = render(_jsx(MemoryDialog, { onClose: vi.fn() }));
        expect(lastFrame()).toContain('› 1. User memory');
        const keypressHandler = mockedUseKeypress.mock.calls[0][0];
        act(() => {
            keypressHandler({ name: 'down' });
        });
        expect(lastFrame()).toContain('› 2. Project memory');
    });
    it('moves selection with Ctrl+N/P readline aliases', () => {
        const { lastFrame } = render(_jsx(MemoryDialog, { onClose: vi.fn() }));
        expect(lastFrame()).toContain('› 1. User memory');
        const pressKey = (key) => {
            const keypressHandler = mockedUseKeypress.mock.calls[mockedUseKeypress.mock.calls.length - 1][0];
            act(() => {
                keypressHandler(key);
            });
        };
        pressKey({ name: 'n', ctrl: true });
        expect(lastFrame()).toContain('› 2. Project memory');
        pressKey({ name: 'p', ctrl: true });
        expect(lastFrame()).toContain('› 1. User memory');
    });
});
//# sourceMappingURL=MemoryDialog.test.js.map