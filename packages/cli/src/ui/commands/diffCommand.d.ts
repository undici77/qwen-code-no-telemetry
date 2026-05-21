/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type GitDiffResult } from '@qwen-code/qwen-code-core';
import { type SlashCommand } from './types.js';
import { type DiffRenderModel, type DiffRenderRow } from '../types.js';
/**
 * Convert the raw `fetchGitDiff` result into a display-ready structure that
 * both the Ink component and the plain-text renderer consume.
 *
 * Row order is the iteration order of `result.perFileStats`, which is a
 * `Map` and therefore preserves insertion order: tracked numstat entries
 * first (alphabetical, as git emits them), then untracked entries appended
 * by `fetchGitDiff` in their `ls-files --others` order. Renderers depend on
 * this — if `perFileStats` ever switches to a different container, the row
 * sequence must continue to be stable across runs.
 */
export declare function buildDiffRenderModel(result: GitDiffResult): DiffRenderModel;
/**
 * Single source of truth for the per-row column layout. Used by both the
 * Ink component and the plain-text renderer so the two paths can never
 * silently disagree on alignment.
 */
export interface DiffColumnWidths {
    /** Digits in the widest non-binary `added` value (min 1). */
    addWidth: number;
    /** Digits in the widest non-binary `removed` value (min 1). */
    remWidth: number;
    /** Visual width of the `+X -Y` stat column, used to pad the binary `~`
     *  marker so it lines up with the numeric rows. */
    statColumnWidth: number;
}
export declare function computeDiffColumnWidths(rows: readonly DiffRenderRow[]): DiffColumnWidths;
/**
 * Plain-text rendering of a `DiffRenderModel`. Used in non-interactive / ACP
 * modes where no Ink renderer is available, and as the source of truth for
 * the text column layout the Ink component mirrors.
 */
export declare function renderDiffModelText(model: DiffRenderModel): string;
export declare const diffCommand: SlashCommand;
