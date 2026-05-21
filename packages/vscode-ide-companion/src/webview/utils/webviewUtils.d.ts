/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Extract filename from full path
 * @param fsPath Full path of the file
 * @returns Filename (without path)
 */
export declare function getFileName(fsPath: string): string;
/**
 * HTML escape function to prevent XSS attacks
 * Convert special characters to HTML entities
 * @param text Text to escape
 * @returns Escaped text
 */
export declare function escapeHtml(text: string): string;
