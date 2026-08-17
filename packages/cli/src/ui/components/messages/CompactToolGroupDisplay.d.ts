/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { IndividualToolCallDisplay } from '../../types.js';
import { ToolCallStatus } from '../../types.js';
interface CompactToolGroupDisplayProps {
  toolCalls: IndividualToolCallDisplay[];
  contentWidth: number;
}
export declare function getOverallStatus(
  toolCalls: IndividualToolCallDisplay[],
): ToolCallStatus;
/**
 * Whether a tool is information-gathering (read/search/list) vs mutation/action.
 *
 * Used at two decision points:
 * 1. ToolGroupMessage — partitions collapsible tools into a summary line
 * 2. ToolMessage.shouldCollapseResult — hides completed text/ANSI output
 *
 * Adding a category here suppresses individual rendering AND result output
 * for completed tools of that type. Only add categories whose results are
 * disposable (file contents, search hits) — never agent/command results.
 */
export declare function isCollapsibleTool(toolName: string): boolean;
/**
 * Build a semantic summary line from a batch of tool calls.
 *
 * Single tool (with description) → "Read a.ts" / "Ran ls -la"
 * Single tool (no description)   → "Read 1 file" / "Ran 1 command"
 * Multi ≤ 3 (with descriptions)  → "Read a.ts, b.ts, c.ts"
 * Multi ≤ 3 (no descriptions)    → "Read 3 files"
 * Multi > 3                      → "Read a.ts, b.ts, ... and 3 more"
 * Multi mixed                    → "Read 2 files, ran npm test"
 *
 * Uses past tense when all tools are done, present progressive when active.
 * Falls back to count format when description is missing, cleans to empty,
 * or parses as a JSON object or array (e.g. error args).
 */
export declare function buildToolSummary(
  toolCalls: IndividualToolCallDisplay[],
  isActive: boolean,
): string;
export declare function estimateCompactToolGroupHeight(
  toolCalls: IndividualToolCallDisplay[],
  contentWidth: number,
): number;
export declare const CompactToolGroupDisplay: React.FC<CompactToolGroupDisplayProps>;
export {};
