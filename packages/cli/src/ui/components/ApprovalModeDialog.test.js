import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import { ApprovalMode } from '@qwen-code/qwen-code-core';
import { LoadedSettings } from '../../config/settings.js';
import { renderWithProviders } from '../../test-utils/render.js';
import { ApprovalModeDialog } from './ApprovalModeDialog.js';
function createSettings(workspaceSettings = {}) {
    return new LoadedSettings({ path: '', settings: {}, originalSettings: {} }, { path: '', settings: {}, originalSettings: {} }, { path: '', settings: {}, originalSettings: {} }, {
        path: '',
        settings: workspaceSettings,
        originalSettings: workspaceSettings,
    }, true, new Set());
}
function frameHeight(frame) {
    return frame.length === 0 ? 0 : frame.split('\n').length;
}
describe('ApprovalModeDialog', () => {
    it.each([6, 8, 10, 12])('keeps the mode picker within %i rows', (availableTerminalHeight) => {
        const { lastFrame } = renderWithProviders(_jsx(ApprovalModeDialog, { settings: createSettings(), currentMode: ApprovalMode.DEFAULT, availableTerminalHeight: availableTerminalHeight, onSelect: vi.fn() }));
        expect(frameHeight(lastFrame() ?? '')).toBeLessThanOrEqual(availableTerminalHeight);
    });
    it('keeps the current mode visible when the constrained picker scrolls', () => {
        const { lastFrame } = renderWithProviders(_jsx(ApprovalModeDialog, { settings: createSettings(), currentMode: ApprovalMode.YOLO, availableTerminalHeight: 8, onSelect: vi.fn() }));
        expect(lastFrame() ?? '').toContain('Automatically approve all tools');
    });
    it('shows scroll arrows when constrained height hides approval modes', () => {
        const { lastFrame } = renderWithProviders(_jsx(ApprovalModeDialog, { settings: createSettings(), currentMode: ApprovalMode.DEFAULT, availableTerminalHeight: 8, onSelect: vi.fn() }));
        const frame = lastFrame() ?? '';
        expect(frameHeight(frame)).toBeLessThanOrEqual(8);
        expect(frame).toContain('▼');
    });
    it('hides the footer hint when needed to show mode scroll arrows', () => {
        const { lastFrame } = renderWithProviders(_jsx(ApprovalModeDialog, { settings: createSettings(), currentMode: ApprovalMode.DEFAULT, availableTerminalHeight: 10, onSelect: vi.fn() }));
        const frame = lastFrame() ?? '';
        expect(frameHeight(frame)).toBeLessThanOrEqual(10);
        expect(frame).toContain('▼');
        expect(frame).not.toContain('Use Enter to select');
    });
    it('keeps the workspace priority warning visible when constrained', () => {
        const { lastFrame } = renderWithProviders(_jsx(ApprovalModeDialog, { settings: createSettings({
                tools: { approvalMode: ApprovalMode.YOLO },
            }), currentMode: ApprovalMode.DEFAULT, availableTerminalHeight: 12, onSelect: vi.fn() }));
        const frame = lastFrame() ?? '';
        expect(frameHeight(frame)).toBeLessThanOrEqual(12);
        expect(frame).toContain('Workspace approval mode exists');
        expect(frame).toContain('Use Enter to select');
    });
    it('hides the footer hint to make room for the workspace warning', () => {
        const { lastFrame } = renderWithProviders(_jsx(ApprovalModeDialog, { settings: createSettings({
                tools: { approvalMode: ApprovalMode.YOLO },
            }), currentMode: ApprovalMode.DEFAULT, availableTerminalHeight: 10, onSelect: vi.fn() }));
        const frame = lastFrame() ?? '';
        expect(frameHeight(frame)).toBeLessThanOrEqual(10);
        expect(frame).toContain('Workspace approval mode exists');
        expect(frame).not.toContain('Use Enter to select');
    });
});
//# sourceMappingURL=ApprovalModeDialog.test.js.map