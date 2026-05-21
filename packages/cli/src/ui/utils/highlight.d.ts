/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SlashCommand } from '../commands/types.js';
export type HighlightToken = {
    text: string;
    type: 'default' | 'command' | 'file';
};
export declare function parseInputForHighlighting(text: string, index: number, slashCommands?: readonly SlashCommand[]): readonly HighlightToken[];
export declare function buildSegmentsForVisualSlice(tokens: readonly HighlightToken[], sliceStart: number, sliceEnd: number): readonly HighlightToken[];
