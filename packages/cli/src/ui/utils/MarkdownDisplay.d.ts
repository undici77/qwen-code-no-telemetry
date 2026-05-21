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
