/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
declare global {
    interface Window {
        __EXTENSION_URI__?: string;
    }
}
/**
 * Generate a resource URL for webview access
 * Similar to the pattern used in other VSCode extensions
 *
 * @param relativePath - Relative path from extension root (e.g., 'assets/icon.png')
 * @returns Full webview-accessible URL (empty string if validation fails)
 *
 * @example
 * ```tsx
 * <img src={generateResourceUrl('assets/icon.png')} />
 * ```
 */
export declare function generateResourceUrl(relativePath: string): string;
/**
 * Shorthand for generating icon URLs
 * @param iconPath - Path relative to assets directory
 */
export declare function generateIconUrl(iconPath: string): string;
