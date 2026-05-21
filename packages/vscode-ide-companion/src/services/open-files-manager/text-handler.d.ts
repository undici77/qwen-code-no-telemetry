/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as vscode from 'vscode';
import type { File } from '@qwen-code/qwen-code-core';
export declare function addOrMoveToFront(openFiles: File[], editor: vscode.TextEditor): void;
export declare function updateActiveContext(openFiles: File[], editor: vscode.TextEditor): void;
