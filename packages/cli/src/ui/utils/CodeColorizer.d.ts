/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import type { Theme } from '../themes/theme.js';
import type { LoadedSettings } from '../../config/settings.js';
/**
 * Heuristic: detect lines that are unlikely to be real code and would confuse
 * `lowlight.highlightAuto()`. Box-drawing characters in unlabeled code blocks
 * (e.g., ASCII art timelines, diagrams) can trigger unexpected language
 * grammars and produce anomalous HAST trees that crash the renderer.
 *
 * Detection strategy:
 * 1. Any structural box-drawing char (│ ├ └ ┌ etc.) → almost certainly a diagram
 * 2. High CJK ratio (>30%) → Chinese text block that confuses auto-detection
 *
 * Returns `true` if the line should skip `highlightAuto` and render as plain text.
 */
export declare function looksLikeDiagramOrArt(line: string): boolean;
export declare function colorizeLine(line: string, language: string | null, theme?: Theme): React.ReactNode;
/**
 * Renders syntax-highlighted code for Ink applications using a selected theme.
 *
 * @param code The code string to highlight.
 * @param language The language identifier (e.g., 'javascript', 'css', 'html')
 * @param availableHeight Optional cap on rendered rows (older lines are clipped).
 * @param maxWidth Optional cap on rendered width.
 * @param options Presentation overrides:
 *   - `theme` — theme to use (defaults to the active theme)
 *   - `settings` — loaded settings (drives showLineNumbers)
 *   - `tabWidth` — spaces per tab, default 4
 *   - `startLineNumber` — the number shown for the first line, default 1. Lets a
 *     code block that was split across streaming commits (see splitFencedMarkdown)
 *     continue its gutter numbering instead of restarting at 1.
 * @returns A React.ReactNode containing Ink <Text> elements for the highlighted code.
 */
export interface ColorizeCodeOptions {
    theme?: Theme;
    settings?: LoadedSettings;
    tabWidth?: number;
    startLineNumber?: number;
}
export declare function colorizeCode(code: string, language: string | null, availableHeight?: number, maxWidth?: number, options?: ColorizeCodeOptions): React.ReactNode;
