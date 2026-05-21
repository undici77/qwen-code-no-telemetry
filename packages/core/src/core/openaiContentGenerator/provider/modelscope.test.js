/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelScopeOpenAICompatibleProvider } from './modelscope.js';
vi.mock('openai');
describe('ModelScopeOpenAICompatibleProvider', () => {
    let provider;
    let mockContentGeneratorConfig;
    let mockCliConfig;
    beforeEach(() => {
        mockContentGeneratorConfig = {
            apiKey: 'test-api-key',
            baseUrl: 'https://api.modelscope.cn/v1',
            model: 'qwen-max',
        };
        mockCliConfig = {
            getCliVersion: vi.fn().mockReturnValue('1.0.0'),
        };
        provider = new ModelScopeOpenAICompatibleProvider(mockContentGeneratorConfig, mockCliConfig);
    });
    describe('isModelScopeProvider', () => {
        it('should return true if baseUrl includes "modelscope"', () => {
            const config = { baseUrl: 'https://api.modelscope.cn/v1' };
            expect(ModelScopeOpenAICompatibleProvider.isModelScopeProvider(config)).toBe(true);
        });
        it('should return false if baseUrl does not include "modelscope"', () => {
            const config = { baseUrl: 'https://api.openai.com/v1' };
            expect(ModelScopeOpenAICompatibleProvider.isModelScopeProvider(config)).toBe(false);
        });
    });
    describe('buildRequest', () => {
        it('should remove stream_options when stream is false', () => {
            const originalRequest = {
                model: 'qwen-max',
                messages: [{ role: 'user', content: 'Hello!' }],
                stream: false,
                stream_options: { include_usage: true },
            };
            const result = provider.buildRequest(originalRequest, 'prompt-id');
            expect(result).not.toHaveProperty('stream_options');
        });
        it('should keep stream_options when stream is true', () => {
            const originalRequest = {
                model: 'qwen-max',
                messages: [{ role: 'user', content: 'Hello!' }],
                stream: true,
                stream_options: { include_usage: true },
            };
            const result = provider.buildRequest(originalRequest, 'prompt-id');
            expect(result).toHaveProperty('stream_options');
        });
        it('should handle requests without stream_options', () => {
            const originalRequest = {
                model: 'qwen-max',
                messages: [{ role: 'user', content: 'Hello!' }],
                stream: false,
            };
            const result = provider.buildRequest(originalRequest, 'prompt-id');
            expect(result).not.toHaveProperty('stream_options');
        });
    });
});
//# sourceMappingURL=modelscope.test.js.map