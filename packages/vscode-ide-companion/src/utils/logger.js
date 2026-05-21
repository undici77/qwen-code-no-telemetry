/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
export function createLogger(context, logger) {
    return (message) => {
        if (context.extensionMode === vscode.ExtensionMode.Development) {
            logger.appendLine(message);
        }
    };
}
//# sourceMappingURL=logger.js.map