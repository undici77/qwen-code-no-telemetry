/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import { WebViewContent } from './WebViewContent.js';
vi.mock('vscode', () => ({
    Uri: {
        joinPath: vi.fn((_base, ...parts) => ({
            fsPath: `/ext/${parts.join('/')}`,
        })),
    },
}));
/**
 * Helper: create a minimal mock vscode.Webview
 */
function createMockWebview() {
    return {
        asWebviewUri: vi.fn((uri) => ({
            toString: () => `https://webview/${uri.fsPath}`,
        })),
        cspSource: 'https://csp.source',
    };
}
describe('WebViewContent', () => {
    const fakeExtensionUri = { fsPath: '/ext' };
    it('generates HTML when given a raw Webview', () => {
        const webview = createMockWebview();
        const html = WebViewContent.generate(webview, fakeExtensionUri);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('Qwen Code');
        expect(html).toContain(webview.cspSource);
        expect(webview.asWebviewUri).toHaveBeenCalled();
    });
    it('generates HTML when given a WebviewPanel (has .webview property)', () => {
        const webview = createMockWebview();
        const panel = { webview };
        const html = WebViewContent.generate(panel, fakeExtensionUri);
        expect(html).toContain('<!DOCTYPE html>');
        expect(webview.asWebviewUri).toHaveBeenCalled();
    });
    it('generates HTML when given a WebviewView (has .webview property)', () => {
        const webview = createMockWebview();
        const view = { webview, viewType: 'sidebar' };
        const html = WebViewContent.generate(view, fakeExtensionUri);
        expect(html).toContain('<!DOCTYPE html>');
        expect(webview.asWebviewUri).toHaveBeenCalled();
    });
    it('includes the script tag with the correct URI', () => {
        const webview = createMockWebview();
        const html = WebViewContent.generate(webview, fakeExtensionUri);
        expect(html).toContain('<script src=');
        expect(html).toContain('webview.js');
    });
    it('sets extension-uri data attribute on the body', () => {
        const webview = createMockWebview();
        const html = WebViewContent.generate(webview, fakeExtensionUri);
        expect(html).toContain('data-extension-uri=');
    });
});
//# sourceMappingURL=WebViewContent.test.js.map