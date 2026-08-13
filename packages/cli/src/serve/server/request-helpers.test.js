/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import { requireSessionId } from './request-helpers.js';
function mockRes() {
    const status = vi.fn().mockReturnValue({ json: vi.fn() });
    return { res: { status }, status };
}
describe('requireSessionId', () => {
    it('normalizes caller-visible UUID route parameters', () => {
        const { res, status } = mockRes();
        const req = {
            params: { id: '550E8400-E29B-41D4-A716-446655440000' },
        };
        expect(requireSessionId(req, res)).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(status).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=request-helpers.test.js.map