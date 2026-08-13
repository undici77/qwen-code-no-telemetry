/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performInitialAuth } from './auth.js';
const mockLogAuth = vi.fn();
vi.mock('@qwen-code/qwen-code-core', () => ({
    getErrorMessage: (e) => (e instanceof Error ? e.message : String(e)),
    logAuth: (...args) => mockLogAuth(...args),
    AuthEvent: vi.fn().mockImplementation((type, method, status, message) => ({
        type,
        method,
        status,
        message,
    })),
}));
describe('performInitialAuth', () => {
    let mockConfig;
    beforeEach(() => {
        vi.clearAllMocks();
        mockConfig = {
            refreshAuth: vi.fn(),
        };
    });
    it('should return null when authType is undefined', async () => {
        const result = await performInitialAuth(mockConfig, undefined);
        expect(result).toBeNull();
        expect(mockConfig.refreshAuth).not.toHaveBeenCalled();
        expect(mockLogAuth).not.toHaveBeenCalled();
    });
    it('should return null on successful authentication', async () => {
        mockConfig.refreshAuth.mockResolvedValue(undefined);
        const result = await performInitialAuth(mockConfig, 'api_key');
        expect(result).toBeNull();
        expect(mockConfig.refreshAuth).toHaveBeenCalledWith('api_key', true);
        expect(mockLogAuth).toHaveBeenCalledTimes(1);
    });
    it('should return error message on authentication failure', async () => {
        mockConfig.refreshAuth.mockRejectedValue(new Error('Invalid API key'));
        const result = await performInitialAuth(mockConfig, 'api_key');
        expect(result).toBe('Failed to login. Message: Invalid API key');
        expect(mockLogAuth).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=auth.test.js.map