/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import { ChatWebviewViewProvider } from './ChatWebviewViewProvider.js';
vi.mock('vscode', () => ({}));
describe('ChatWebviewViewProvider', () => {
    it('lazily creates the WebViewProvider on first resolveWebviewView call', async () => {
        const mockProvider = {
            attachToView: vi.fn().mockResolvedValue(undefined),
        };
        const factory = vi.fn(() => mockProvider);
        const viewProvider = new ChatWebviewViewProvider(factory);
        const mockWebviewView = {
            webview: {},
            viewType: 'qwen-code.chatView.sidebar',
        };
        await viewProvider.resolveWebviewView(mockWebviewView);
        expect(factory).toHaveBeenCalledTimes(1);
        expect(mockProvider.attachToView).toHaveBeenCalledWith(mockWebviewView, 'qwen-code.chatView.sidebar');
    });
    it('reuses the same WebViewProvider on subsequent calls', async () => {
        const mockProvider = {
            attachToView: vi.fn().mockResolvedValue(undefined),
        };
        const factory = vi.fn(() => mockProvider);
        const viewProvider = new ChatWebviewViewProvider(factory);
        const mockView1 = { webview: {}, viewType: 'sidebar' };
        const mockView2 = { webview: {}, viewType: 'sidebar' };
        await viewProvider.resolveWebviewView(mockView1);
        await viewProvider.resolveWebviewView(mockView2);
        // Factory should only be called once (lazy creation)
        expect(factory).toHaveBeenCalledTimes(1);
        // But attachToView should be called for each resolve
        expect(mockProvider.attachToView).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=ChatWebviewViewProvider.test.js.map