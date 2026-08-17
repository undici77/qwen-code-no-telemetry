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
  sourceCopyIndexOffsets?: MarkdownSourceCopyIndexOffsets;
  /** Force thinking blocks expanded (e.g. in SessionPreview). */
  thoughtExpanded?: boolean;
  /**
   * Full-detail mode (Ctrl+O). When true, collapse is lifted:
   * thinking blocks render expanded and tool groups force `forceExpandAll`
   * + `forceShowResult` (every tool with its full, untruncated result).
   * Default false (main view stays at the #5661 partition baseline).
   */
  fullDetail?: boolean;
  /**
   * Head id of the thought group this item belongs to (the `gemini_thought`
   * head id for both the head and its `gemini_thought_content` continuations).
   * Used to expand/collapse the whole group as a unit on click.
   */
  thoughtHeadId?: number;
}
declare const HistoryItemDisplay: React.NamedExoticComponent<HistoryItemDisplayProps>;
export { HistoryItemDisplay };
