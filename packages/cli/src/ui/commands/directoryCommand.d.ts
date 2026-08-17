/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SlashCommand, CommandCompletionItem } from './types.js';
/**
 * Returns directory path completions for the given partial argument.
 * Supports comma-separated paths by completing only the last segment.
 */
export declare function getDirPathCompletions(
  partialArg: string,
): CommandCompletionItem[];
export declare function getSingleDirPathCompletions(
  partialArg: string,
): CommandCompletionItem[];
export declare const directoryCommand: SlashCommand;
