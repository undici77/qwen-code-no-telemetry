/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { HistoryItem } from '../types.js';
import { type MarkdownSourceCopyIndexOffsets } from '../utils/MarkdownDisplay.js';
import type { SlashCommand } from '../commands/types.js';
interface HistoryItemDisplayProps {
    item: HistoryItem;
    availableTerminalHeight?: number;
    terminalWidth: number;
    mainAreaWidth?: number;
    isPending: boolean;
    isFocused?: boolean;
    commands?: readonly SlashCommand[];
    activeShellPtyId?: number | null;
    embeddedShellFocused?: boolean;
    availableTerminalHeightGemini?: number;
    /**
     * When the item is a `tool_group`, an optional short LLM-generated label
     * summarizing the batch. Replaces the generic "Tool × N" line in compact
     * mode. Computed by the parent from `tool_use_summary` history items.
     */
    compactLabel?: string;
    /**
     * When the item is a `tool_use_summary`, true if a sibling tool_group has
     * absorbed this label via its compact-mode header. The standalone `● <label>`
     * line is suppressed in that case. False for force-expanded groups in
     * compact mode (they render through the full ToolGroupMessage path and
     * don't consume compactLabel, so the standalone line is the label's only
     * path to the screen) and for all tool_use_summary items in full mode.
     */
    summaryAbsorbed?: boolean;
    sourceCopyIndexOffsets?: MarkdownSourceCopyIndexOffsets;
}
declare const HistoryItemDisplayComponent: React.FC<HistoryItemDisplayProps>;
export { HistoryItemDisplayComponent as HistoryItemDisplay };
