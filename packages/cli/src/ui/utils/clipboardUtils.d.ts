/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Checks if the system clipboard contains an image
 * @returns true if clipboard contains an image
 */
export declare function clipboardHasImage(): Promise<boolean>;
/**
 * Saves the image from clipboard to a temporary file
 * @param targetDir The target directory to create temp files within
 * @returns The path to the saved image file, or null if no image or error
 */
export declare function saveClipboardImage(targetDir?: string): Promise<string | null>;
/**
 * Cleans up old temporary clipboard image files using LRU strategy
 * Keeps maximum 100 images, when exceeding removes 50 oldest files to reduce cleanup frequency
 * @param targetDir The target directory where temp files are stored
 */
export declare function cleanupOldClipboardImages(targetDir?: string): Promise<void>;
