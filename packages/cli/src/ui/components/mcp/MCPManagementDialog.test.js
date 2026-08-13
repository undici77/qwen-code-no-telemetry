import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import { MCPManagementDialog } from './MCPManagementDialog.js';
import { renderWithProviders } from '../../../test-utils/render.js';
vi.mock('../../../config/mcpApprovals.js', () => ({
    loadMcpApprovals: vi.fn(() => ({
        getState: vi.fn(() => 'approved'),
    })),
}));
const createConfig = () => ({
    getMcpServers: () => ({}),
    getToolRegistry: () => undefined,
    getPromptRegistry: () => undefined,
    getResourceRegistry: () => undefined,
    getWorkingDir: () => process.cwd(),
    isMcpServerDisabled: () => false,
});
describe('MCPManagementDialog', () => {
    it('uses the same rounded outer border as other dialogs', () => {
        const { lastFrame } = renderWithProviders(_jsx(MCPManagementDialog, { onClose: vi.fn() }), { config: createConfig() });
        expect(lastFrame()).toContain('╭');
        expect(lastFrame()).toContain('╮');
    });
});
//# sourceMappingURL=MCPManagementDialog.test.js.map