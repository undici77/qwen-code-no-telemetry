/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ReadonlyFrame } from 'ink';
import type { NormalizedSelection } from './selection-state.js';
/**
 * Extracts the visual text of a selection from a composited frame.
 *
 * Wide-character spacer cells carry an empty value and contribute nothing, so
 * a wide glyph appears once. Non-selectable layout cells are skipped. An
 * unambiguous soft boundary contributes its source joiner instead of a visual
 * newline; hard or ambiguous boundaries retain the newline.
 */
export declare function getSelectedText(
  frame: ReadonlyFrame | null,
  selection: NormalizedSelection,
): string;
