/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import { CHAT_VIEW_ID_SIDEBAR } from '../../constants/viewIds.js';
import { ChatWebviewViewProvider, } from './ChatWebviewViewProvider.js';
export function registerChatViewProviders(params) {
    const { context, createViewProvider } = params;
    const sidebarViewProvider = new ChatWebviewViewProvider(createViewProvider);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(CHAT_VIEW_ID_SIDEBAR, sidebarViewProvider, { webviewOptions: { retainContextWhenHidden: true } }));
}
//# sourceMappingURL=chatViewRegistration.js.map