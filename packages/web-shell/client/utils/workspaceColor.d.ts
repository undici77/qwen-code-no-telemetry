/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  DaemonCapabilities,
  DaemonSessionGroupPresetColor,
} from '@qwen-code/sdk/daemon';
/**
 * A stable accent color for a workspace, so split-view panes in the same
 * workspace share a color and different workspaces read apart at a glance.
 * Keyed by the workspace's position in the daemon's `workspaces[]` (stable per
 * daemon), so the primary workspace always gets the first color; falls back to
 * a deterministic hash of the cwd when the list doesn't include it. Returns
 * `undefined` for a missing cwd so callers can skip the accent entirely.
 */
export declare function workspaceAccentColor(
  cwd: string | undefined,
  capabilities: DaemonCapabilities | undefined,
): DaemonSessionGroupPresetColor | undefined;
