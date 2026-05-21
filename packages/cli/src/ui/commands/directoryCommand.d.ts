/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SlashCommand } from './types.js';
export declare function expandHomeDir(p: string): string;
/**
 * Returns directory path completions for the given partial argument.
 * Supports comma-separated paths by completing only the last segment.
 */
export declare function getDirPathCompletions(partialArg: string): string[];
export declare const directoryCommand: SlashCommand;
