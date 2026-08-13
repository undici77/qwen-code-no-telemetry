/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { getEffectiveTerminalBackground } from './theme-background.js';
import { themeManager } from '../themes/theme-manager.js';
// Force the terminal background detection result without probing the real
// terminal: cachedAutoDetection takes precedence in getTerminalBackgroundType.
function setDetectedTerminal(value) {
    themeManager.cachedAutoDetection = value;
}
describe('theme-background', () => {
    beforeEach(() => {
        // themeManager is a module-level singleton; reset state so ordering is not
        // load-bearing across tests.
        themeManager.loadCustomThemes({});
        themeManager.cachedAutoDetection = undefined;
        themeManager.terminalBackground = undefined;
    });
    describe('getEffectiveTerminalBackground', () => {
        it('returns a light stand-in for a light terminal', () => {
            setDetectedTerminal('light');
            expect(getEffectiveTerminalBackground()).toBe('#ffffff');
        });
        it('returns a dark stand-in for a dark terminal', () => {
            setDetectedTerminal('dark');
            expect(getEffectiveTerminalBackground()).toBe('#000000');
        });
        it('does not depend on the active theme (no background is painted)', () => {
            // Forcing a light theme onto a dark terminal must still report the
            // terminal's own (dark) background, since the theme background is never
            // painted.
            themeManager.setActiveTheme('Qwen Light');
            setDetectedTerminal('dark');
            expect(getEffectiveTerminalBackground()).toBe('#000000');
        });
    });
});
//# sourceMappingURL=theme-background.test.js.map