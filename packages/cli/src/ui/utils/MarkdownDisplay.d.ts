/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
interface MarkdownDisplayProps {
    text: string;
    isPending: boolean;
    availableTerminalHeight?: number;
    contentWidth: number;
    textColor?: string;
    sourceCopyIndexOffsets?: MarkdownSourceCopyIndexOffsets;
    /**
     * When true, enforce the rendered-height budget from `availableTerminalHeight`
     * even for non-pending content. Normally the height-aware pre-slice
     * (`fitPendingSlice`) only engages while streaming (`isPending`), because
     * committed content is rendered by `<Static>` and does not risk the
     * scroll-to-top lock. However, MainContent wraps the live pending region in
     * `maxHeight` + `overflow="hidden"` as an Ink backstop, and Ink clips the
     * BOTTOM (newest content) — so a non-pending item that renders inside that
     * wrapper (e.g. the `exit_plan_mode` confirmation dialog's plan body) gets
     * silently clipped without the pre-slice's clamp/indicator. Callers that
     * render inside such a bounded container should pass `true` so the plan body
     * respects the same viewport budget the outer wrapper enforces. See #6867.
     */
    enforceHeightBudget?: boolean;
}
export interface MarkdownSourceCopyIndexOffsets {
    codeBlockLanguageCounts: Map<string, number>;
    mathBlockCount: number;
}
export interface MarkdownSourceBlockCounts {
    codeBlockLanguageCounts: Map<string, number>;
    mathBlockCount: number;
}
export declare function countMarkdownSourceBlocks(text: string): MarkdownSourceBlockCounts;
export declare const MarkdownDisplay: React.NamedExoticComponent<MarkdownDisplayProps>;
export {};
