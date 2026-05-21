/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Generates a filename with timestamp for export files.
 */
export function generateExportFilename(extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `qwen-code-export-${timestamp}.${extension}`;
}
//# sourceMappingURL=utils.js.map