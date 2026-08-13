/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * WebviewView host for placing the chat UI in the Activity Bar sidebar.
 *
 * Accepts a factory function instead of a pre-built WebViewProvider so the
 * heavyweight provider (QwenAgentManager, ConversationStore, etc.) is only
 * created when VS Code actually opens the view, not at extension startup.
 */
export class ChatWebviewViewProvider {
    createWebViewProvider;
    webViewProvider = null;
    /**
     * @param createWebViewProvider - Factory that creates a WebViewProvider on demand
     */
    constructor(createWebViewProvider) {
        this.createWebViewProvider = createWebViewProvider;
    }
    /**
     * Called by VS Code when the webview view becomes visible for the first time.
     * Creates the WebViewProvider lazily and attaches the webview.
     *
     * @param webviewView - The webview view created by VS Code
     */
    async resolveWebviewView(webviewView) {
        // Lazily create the provider on first resolve
        if (!this.webViewProvider) {
            this.webViewProvider = this.createWebViewProvider();
        }
        // Webview options (enableScripts, localResourceRoots) are configured
        // inside WebViewProvider.attachToView — no duplication needed here.
        await this.webViewProvider.attachToView(webviewView, webviewView.viewType);
    }
}
//# sourceMappingURL=ChatWebviewViewProvider.js.map