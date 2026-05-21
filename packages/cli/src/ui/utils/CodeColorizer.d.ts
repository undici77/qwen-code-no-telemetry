/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import type { Theme } from '../themes/theme.js';
import type { LoadedSettings } from '../../config/settings.js';
export declare function colorizeLine(line: string, language: string | null, theme?: Theme): React.ReactNode;
/**
 * Renders syntax-highlighted code for Ink applications using a selected theme.
 *
 * @param code The code string to highlight.
 * @param language The language identifier (e.g., 'javascript', 'css', 'html')
 * @param tabWidth The number of spaces to replace each tab character with, default is 4
 * @returns A React.ReactNode containing Ink <Text> elements for the highlighted code.
 */
export declare function colorizeCode(code: string, language: string | null, availableHeight?: number, maxWidth?: number, theme?: Theme, settings?: LoadedSettings, tabWidth?: number): React.ReactNode;
