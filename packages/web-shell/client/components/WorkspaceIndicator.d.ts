/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonSessionGroupPresetColor } from '@qwen-code/sdk/daemon';
/**
 * A compact, non-interactive chip naming the workspace a split-view pane's
 * session belongs to. Mirrors {@link GitBranchIndicator}; both sit in the
 * composer toolbar. Shown only on a multi-workspace daemon (the pane composer
 * opts into the `workspace` toolbar action) so it's clear which workspace a
 * message goes to. The full cwd stays in a hover tooltip — matching the git
 * branch chip — so it's still discoverable once the name ellipsizes or
 * collapses to an icon on a narrow (split-screen / mobile) composer.
 *
 * A stable per-workspace `color` (same palette as the pane header and the
 * sidebar session-group dots) tints the folder icon and the chip background, so
 * the chip stays distinguishable from other panes' chips even in the icon-only
 * compact state — where every workspace would otherwise show the same folder.
 */
export declare function WorkspaceIndicator({
  name,
  title,
  ariaLabel,
  color,
  compact,
}: {
  name: string;
  title: string;
  ariaLabel: string;
  color?: DaemonSessionGroupPresetColor;
  compact?: boolean;
}): import('react/jsx-runtime').JSX.Element;
