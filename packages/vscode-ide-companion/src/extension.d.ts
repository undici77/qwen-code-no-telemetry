/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
export { createSdkDaemonSessionFactory as __daemonIdeSessionFactoryForBundle } from './services/daemonIdeConnection.js';
export declare const DIFF_SCHEME = "qwen-diff";
export declare function activate(context: vscode.ExtensionContext): Promise<void>;
export declare function deactivate(): Promise<void>;
