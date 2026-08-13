import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { SettingsCorruptedDialog } from './SettingsCorruptedDialog.js';
import { KeypressProvider } from '../contexts/KeypressContext.js';
const wait = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
const lastFrameText = (lastFrame) => {
    const text = lastFrame();
    if (text == null) {
        throw new Error('lastFrame returned undefined');
    }
    return text;
};
const waitFor = async (predicate, options = {}) => {
    const { timeout = 1000, interval = 10 } = options;
    const start = Date.now();
    let lastError;
    while (Date.now() - start < timeout) {
        try {
            predicate();
            return;
        }
        catch (e) {
            lastError = e;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
    if (lastError) {
        throw lastError;
    }
    throw new Error('waitFor timed out');
};
var TerminalKeys;
(function (TerminalKeys) {
    TerminalKeys["ENTER"] = "\r";
    TerminalKeys["UP_ARROW"] = "\u001B[A";
    TerminalKeys["DOWN_ARROW"] = "\u001B[B";
    TerminalKeys["ESCAPE"] = "\u001B";
})(TerminalKeys || (TerminalKeys = {}));
describe('SettingsCorruptedDialog', () => {
    const mockCorruptedPath = '/home/user/.qwen/settings.json.corrupted';
    const mockOnExit = vi.fn();
    const mockOnContinue = vi.fn();
    beforeEach(() => {
        mockOnExit.mockClear();
        mockOnContinue.mockClear();
    });
    it('should show recovered settings label when wasRecovered=true', async () => {
        const { lastFrame, unmount } = render(_jsx(KeypressProvider, { kittyProtocolEnabled: false, children: _jsx(SettingsCorruptedDialog, { corruptedPath: mockCorruptedPath, wasRecovered: true, onExit: mockOnExit, onContinue: mockOnContinue }) }));
        await wait();
        await waitFor(() => {
            expect(lastFrame()).toContain('Continue with recovered settings (esc)');
        });
        unmount();
    });
    it('should show empty settings label when wasRecovered=false', async () => {
        const { lastFrame, unmount } = render(_jsx(KeypressProvider, { kittyProtocolEnabled: false, children: _jsx(SettingsCorruptedDialog, { corruptedPath: mockCorruptedPath, wasRecovered: false, onExit: mockOnExit, onContinue: mockOnContinue }) }));
        await wait();
        await waitFor(() => {
            expect(lastFrame()).toContain('Continue with empty settings (esc)');
        });
        unmount();
    });
    it('should move selection with up/down arrows', async () => {
        const { stdin, lastFrame, unmount } = render(_jsx(KeypressProvider, { kittyProtocolEnabled: false, children: _jsx(SettingsCorruptedDialog, { corruptedPath: mockCorruptedPath, wasRecovered: false, onExit: mockOnExit, onContinue: mockOnContinue }) }));
        // Initially EXIT is selected — the line containing "Exit and restore"
        // must have '>' in it
        await wait();
        await waitFor(() => {
            const lines = lastFrameText(lastFrame).split('\n');
            const exitLine = lines.find((l) => l.includes('Exit and restore'));
            expect(exitLine).toBeTruthy();
            expect(exitLine).toContain('>');
        });
        // Press down — CONTINUE line gets '>'
        stdin.write(TerminalKeys.DOWN_ARROW);
        await wait();
        await waitFor(() => {
            const lines = lastFrameText(lastFrame).split('\n');
            const continueLine = lines.find((l) => l.includes('Continue with'));
            expect(continueLine).toBeTruthy();
            expect(continueLine).toContain('>');
        });
        // Press up — EXIT line gets '>' back
        stdin.write(TerminalKeys.UP_ARROW);
        await wait();
        await waitFor(() => {
            const lines = lastFrameText(lastFrame).split('\n');
            const exitLine = lines.find((l) => l.includes('Exit and restore'));
            expect(exitLine).toBeTruthy();
            expect(exitLine).toContain('>');
        });
        unmount();
    });
    it('should call onExit when pressing Enter on EXIT option', async () => {
        const { stdin, unmount } = render(_jsx(KeypressProvider, { kittyProtocolEnabled: false, children: _jsx(SettingsCorruptedDialog, { corruptedPath: mockCorruptedPath, wasRecovered: false, onExit: mockOnExit, onContinue: mockOnContinue }) }));
        await wait();
        stdin.write(TerminalKeys.ENTER);
        await wait();
        await waitFor(() => {
            expect(mockOnExit).toHaveBeenCalled();
            expect(mockOnContinue).not.toHaveBeenCalled();
        });
        unmount();
    });
    it('should call onContinue when pressing Enter on CONTINUE option', async () => {
        const { stdin, lastFrame, unmount } = render(_jsx(KeypressProvider, { kittyProtocolEnabled: false, children: _jsx(SettingsCorruptedDialog, { corruptedPath: mockCorruptedPath, wasRecovered: false, onExit: mockOnExit, onContinue: mockOnContinue }) }));
        await wait();
        stdin.write(TerminalKeys.DOWN_ARROW);
        await wait();
        await waitFor(() => {
            const lines = lastFrameText(lastFrame).split('\n');
            const continueLine = lines.find((l) => l.includes('Continue with'));
            expect(continueLine).toBeTruthy();
            expect(continueLine).toContain('>');
        });
        await wait();
        stdin.write(TerminalKeys.ENTER);
        await wait();
        await waitFor(() => {
            expect(mockOnContinue).toHaveBeenCalled();
            expect(mockOnExit).not.toHaveBeenCalled();
        });
        unmount();
    });
    it('should call onContinue when pressing escape', async () => {
        const { stdin, unmount } = render(_jsx(KeypressProvider, { kittyProtocolEnabled: false, children: _jsx(SettingsCorruptedDialog, { corruptedPath: mockCorruptedPath, wasRecovered: false, onExit: mockOnExit, onContinue: mockOnContinue }) }));
        await wait();
        stdin.write(TerminalKeys.ESCAPE);
        await wait();
        await waitFor(() => {
            expect(mockOnContinue).toHaveBeenCalled();
            expect(mockOnExit).not.toHaveBeenCalled();
        });
        unmount();
    });
    it('should call onExit when pressing Ctrl+C', async () => {
        const { stdin, unmount } = render(_jsx(KeypressProvider, { kittyProtocolEnabled: false, children: _jsx(SettingsCorruptedDialog, { corruptedPath: mockCorruptedPath, wasRecovered: false, onExit: mockOnExit, onContinue: mockOnContinue }) }));
        await wait();
        stdin.write('\x03');
        await wait();
        await waitFor(() => {
            expect(mockOnExit).toHaveBeenCalled();
            expect(mockOnContinue).not.toHaveBeenCalled();
        });
        unmount();
    });
    it('should display the corrupted file path', async () => {
        const { lastFrame, unmount } = render(_jsx(KeypressProvider, { kittyProtocolEnabled: false, children: _jsx(SettingsCorruptedDialog, { corruptedPath: mockCorruptedPath, wasRecovered: false, onExit: mockOnExit, onContinue: mockOnContinue }) }));
        await wait();
        await waitFor(() => {
            expect(lastFrame()).toContain(mockCorruptedPath);
        });
        unmount();
    });
});
//# sourceMappingURL=SettingsCorruptedDialog.test.js.map