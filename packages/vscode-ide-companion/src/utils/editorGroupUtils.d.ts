/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
/**
 * Find the editor group immediately to the left of the Qwen chat webview.
 * - If the chat webview group is the leftmost group, returns undefined.
 * - If no chat webview is found in any editor group, returns undefined.
 */
export declare function findLeftGroupOfChatWebview(): vscode.ViewColumn | undefined;
/**
 * Find the editor group immediately to the right of the Qwen chat webview.
 * - If the chat webview group is the rightmost group, returns undefined.
 * - If no chat webview is found in any editor group, returns undefined.
 */
export declare function findRightGroupOfChatWebview(): vscode.ViewColumn | undefined;
