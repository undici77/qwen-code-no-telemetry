/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Write text to clipboard via OSC 52 escape sequence (works over SSH).
 * @param text - Text to copy to clipboard
 * @returns true if sequence was written, false if no TTY available or text too large
 */
export declare function writeOsc52(text: string): boolean;
/**
 * Reset the cached Linux clipboard tool. Used for testing.
 */
export declare function resetLinuxClipboardTool(): void;
export declare function isWaylandSession(): boolean;
/**
 * Checks if the system clipboard contains an image.
 * Uses platform-native tools (wl-paste/xclip) on Linux.
 * @param onUnavailable Called when the macOS/Windows native module cannot load.
 * @returns true if clipboard contains an image
 */
export declare function clipboardHasImage(
  onUnavailable?: () => void,
): Promise<boolean>;
/**
 * Saves the image from clipboard to a temporary file.
 * Uses platform-native tools (wl-paste/xclip) on Linux.
 * @param targetDir The target directory to create temp files within
 * @returns The path to the saved image file, or null if no image or error
 */
export declare function saveClipboardImage(
  targetDir?: string,
): Promise<string | null>;
/**
 * Cleans up old temporary clipboard image files using LRU strategy.
 * Keeps maximum 100 images, when exceeding removes 50 oldest files.
 * @param targetDir The target directory where temp files are stored
 */
export declare function cleanupOldClipboardImages(
  targetDir?: string,
): Promise<void>;
