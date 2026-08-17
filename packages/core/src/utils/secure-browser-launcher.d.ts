/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
type BrowserLaunchOptions = {
  allowFile?: boolean;
  allowedFilePaths?: string[];
};
/**
 * Opens a URL in the user's default browser securely.
 *
 * On failure (e.g., missing browser binary or command), this function does NOT throw an error.
 * Instead, it logs the URL to the console error stream so the user can open it manually,
 * and resolves successfully to prevent application crashes.
 *
 * @param url - The URL to open.
 * @param browserOptions.allowFile - Allow file:// URLs for locally generated reports.
 * @returns A promise that resolves when the attempt is made (whether successful or logged).
 */
export declare function openBrowserSecurely(
  url: string,
  browserOptions?: BrowserLaunchOptions,
): Promise<void>;
/**
 * Checks if the current environment should attempt to launch a browser.
 * This is the same logic as in browser.ts for consistency.
 *
 * @returns True if the tool should attempt to launch a browser
 */
export declare function shouldLaunchBrowser(): boolean;
export {};
