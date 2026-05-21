/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
/** Anything that exposes a `.webview` property (WebviewPanel, WebviewView, etc.) */
type WebviewHost = vscode.Webview | {
    webview: vscode.Webview;
};
/**
 * WebView HTML Content Generator
 * Responsible for generating the HTML content of the WebView
 */
export declare class WebViewContent {
    /**
     * Extract the underlying Webview from various host types.
     * Accepts a raw Webview, a WebviewPanel, or a WebviewView — so callers
     * never have to worry about passing the wrong wrapper.
     */
    private static getWebview;
    /**
     * Generate HTML content for the WebView
     * @param host - A Webview, WebviewPanel, or WebviewView
     * @param extensionUri Extension URI
     * @returns HTML string
     */
    static generate(host: WebviewHost, extensionUri: vscode.Uri): string;
}
export {};
