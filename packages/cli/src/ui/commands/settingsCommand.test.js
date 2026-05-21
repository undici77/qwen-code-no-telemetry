/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { settingsCommand } from './settingsCommand.js';
import {} from './types.js';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
describe('settingsCommand', () => {
    let mockContext;
    beforeEach(() => {
        mockContext = createMockCommandContext();
    });
    it('should return a dialog action to open the settings dialog', () => {
        if (!settingsCommand.action) {
            throw new Error('The settings command must have an action.');
        }
        const result = settingsCommand.action(mockContext, '');
        expect(result).toEqual({
            type: 'dialog',
            dialog: 'settings',
        });
    });
    it('should have the correct name and description', () => {
        expect(settingsCommand.name).toBe('settings');
        expect(settingsCommand.description).toBe('View and edit Qwen Code settings');
    });
});
//# sourceMappingURL=settingsCommand.test.js.map