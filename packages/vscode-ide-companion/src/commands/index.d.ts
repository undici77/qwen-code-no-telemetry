/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import type { DiffManager } from '../diff-manager.js';
import type { WebViewProvider } from '../webview/providers/WebViewProvider.js';
type Logger = (message: string) => void;
export declare const runQwenCodeCommand = "qwen-code.runQwenCode";
export declare const showDiffCommand = "qwenCode.showDiff";
export declare const openChatCommand = "qwen-code.openChat";
export declare const openNewChatTabCommand = "qwenCode.openNewChatTab";
export declare const authCommand = "qwen-code.auth";
export declare const focusChatCommand = "qwen-code.focusChat";
export declare const newConversationCommand = "qwen-code.newConversation";
export declare const showLogsCommand = "qwen-code.showLogs";
/**
 * Register all Qwen Code chat-related commands.
 *
 * `openChat` and `newConversation` always open an editor tab, while
 * `focusChat` focuses the secondary sidebar (preferred) or primary sidebar.
 *
 * @param context - VS Code extension context for subscription management
 * @param log - Logger function for debug output
 * @param diffManager - Diff manager for showing file diffs
 * @param getWebViewProviders - Returns all active editor-tab WebView providers
 * @param createWebViewProvider - Factory to create a new editor-tab WebView provider
 * @param outputChannel - Optional output channel for the showLogs command
 * @param supportsSecondarySidebar - Whether the running VS Code supports secondary sidebar
 */
export declare function registerNewCommands(context: vscode.ExtensionContext, log: Logger, diffManager: DiffManager, getWebViewProviders: () => WebViewProvider[], createWebViewProvider: () => WebViewProvider, outputChannel?: vscode.OutputChannel, supportsSecondarySidebar?: boolean): void;
export {};
