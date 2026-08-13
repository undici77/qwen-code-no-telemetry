/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function savePromptStash(targetDir: string, text: string): boolean;
export declare function loadPromptStash(targetDir: string): string | null;
export declare function restorePromptStash(targetDir: string, currentText: string, onRestore: (text: string) => void): boolean;
export declare function clearPromptStash(targetDir: string): boolean;
