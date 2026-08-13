/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { isAskUserPermission } from './askUserPermission';
const req = (r) => r;
describe('isAskUserPermission', () => {
    it('is false without a questions array', () => {
        expect(isAskUserPermission(null)).toBe(false);
        expect(isAskUserPermission(req({}))).toBe(false);
        expect(isAskUserPermission(req({ rawInput: {} }))).toBe(false);
        expect(isAskUserPermission(req({ rawInput: { questions: 'nope' } }))).toBe(false);
    });
    it('is true when questions are present and no tool name is given', () => {
        expect(isAskUserPermission(req({ rawInput: { questions: [{ question: 'q' }] } }))).toBe(true);
    });
    it('defers to the tool name when one is present', () => {
        // A normal tool that happens to carry a questions array is NOT ask-user.
        expect(isAskUserPermission(req({ toolName: 'write_file', rawInput: { questions: [{}] } }))).toBe(false);
    });
});
//# sourceMappingURL=askUserPermission.test.js.map