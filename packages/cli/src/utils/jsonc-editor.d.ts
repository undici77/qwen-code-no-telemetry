/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Updates a JSON file while preserving comments and formatting.
 *
 * In merge mode (default), updates are deep-merged into the existing file,
 * preserving keys not mentioned in the updates object.
 * A replacePath can be provided for a single updated subtree that should be
 * replaced exactly instead of deep-merged.
 *
 * In sync mode (sync=true), the file is synchronized to match the updates
 * object exactly — keys present in the original but not in updates are
 * removed, preventing zombie keys after migrations.
 *
 * Uses writeWithBackupSync internally for atomic temp-file + rename writes,
 * preventing file corruption if the process crashes mid-write.
 *
 * @returns true if the file was successfully written, false if the write
 * was refused (e.g. the result would not be valid JSON or file not parseable).
 */
export declare function updateSettingsFilePreservingFormat(filePath: string, updates: Record<string, unknown>, sync?: boolean, replacePath?: readonly string[]): boolean;
export declare function parseJsoncObject(content: string): Record<string, unknown>;
export declare function updateJsoncContent(content: string, updates: Record<string, unknown>, sync?: boolean, replacePath?: readonly string[]): string;
export declare function applyUpdates(current: Record<string, unknown>, updates: Record<string, unknown>, sync?: boolean, replacePath?: readonly string[], currentPath?: readonly string[]): Record<string, unknown>;
