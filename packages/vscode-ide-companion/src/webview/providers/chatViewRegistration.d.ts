/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import { type WebViewProviderFactory } from './ChatWebviewViewProvider.js';
export declare function detectSecondarySidebarSupport(vscodeVersion: string): boolean;
export declare function registerChatViewProviders(params: {
    context: vscode.ExtensionContext;
    createViewProvider: WebViewProviderFactory;
    vscodeVersion?: string;
}): boolean;
