/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Per-row rendering plan for the slash command panel's section grouping. */
export interface SlashSectionRowPlan {
  /** Render the category header above this row (group boundary). */
  showHeader: boolean;
  /** Render the divider above the header (every boundary except the first row). */
  showDivider: boolean;
  /** Number of rows in this row's section; 0 when no header is shown. */
  count: number;
}
/**
 * Decide, for each item, whether it starts a new section (and so needs a header,
 * a divider, and the group count). Extracted as a pure function so the section
 * boundary logic — headers at group boundaries, a header but no divider on the
 * first row, and no redundant headers for adjacent duplicate sections — is unit
 * testable without rendering the panel.
 *
 * Only 'command' menus are grouped; subcommand menus render flat (no headers).
 */
export declare function planSlashSectionRows(
  items: ReadonlyArray<{
    section?: string;
  }>,
  kind: 'command' | 'subcommand',
): SlashSectionRowPlan[];
