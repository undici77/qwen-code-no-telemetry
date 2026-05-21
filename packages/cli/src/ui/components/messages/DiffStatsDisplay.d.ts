/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { DiffRenderModel } from '../../types.js';
interface DiffStatsDisplayProps {
    model: DiffRenderModel;
}
/**
 * Colored rendering of `/diff` output for interactive mode. Mirrors the
 * layout of the plain-text fallback (see `renderDiffModelText`) so the two
 * modes stay visually aligned, but uses Ink primitives with `theme.status.*`
 * tokens instead of baking ANSI into the text.
 */
export declare const DiffStatsDisplay: React.FC<DiffStatsDisplayProps>;
export {};
