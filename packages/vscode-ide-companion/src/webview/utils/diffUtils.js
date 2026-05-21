/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared utilities for handling diff operations in the webview
 */
/**
 * Handle opening a diff view for a file
 * @param vscode Webview API instance
 * @param path File path
 * @param oldText Original content (left side)
 * @param newText New content (right side)
 */
export const handleOpenDiff = (vscode, path, oldText, newText) => {
    if (path) {
        vscode.postMessage({
            type: 'openDiff',
            data: { path, oldText: oldText || '', newText: newText || '' },
        });
    }
};
/**
 * Creates a temporary readonly file with the given content and opens it in VS Code
 * @param content The content to write to the temporary file
 * @param fileName File name (will be auto-generated with timestamp)
 */
export const createAndOpenTempFile = (vscode, content, fileName = 'temp') => {
    vscode.postMessage({
        type: 'createAndOpenTempFile',
        data: {
            content,
            fileName,
        },
    });
};
//# sourceMappingURL=diffUtils.js.map