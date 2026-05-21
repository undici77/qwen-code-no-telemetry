/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Shared layout calculation utilities for the terminal UI.
 */
/**
 * Calculate the widths for the input prompt area based on terminal width.
 *
 * Returns the content width (for the text buffer), the total container width
 * (including border + padding + prefix), the suggestions dropdown width,
 * and the frame overhead constant.
 */
export declare const calculatePromptWidths: (terminalWidth: number) => {
    readonly inputWidth: number;
    readonly containerWidth: number;
    readonly suggestionsWidth: number;
    readonly frameOverhead: number;
};
