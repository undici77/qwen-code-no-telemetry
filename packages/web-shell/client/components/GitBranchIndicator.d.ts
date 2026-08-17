/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonWorkspaceGitStatus } from '@qwen-code/sdk/daemon';
import { useI18n } from '../i18n';
type TranslateFn = ReturnType<typeof useI18n>['t'];
/**
 * Composed accessible label for a git branch chip, e.g.
 * "Current branch: main — 3 staged, 2 ahead". Shared by the indicator and any
 * wrapper button so the accessible name never drifts from the tooltip phrases.
 */
export declare function gitBranchAriaLabel(
  branch: string,
  status: DaemonWorkspaceGitStatus | undefined,
  t: TranslateFn,
): string;
/**
 * The chip's inner content (icon + branch + status indicators), shared by the
 * interactive {@link GitBranchIndicator} and the toolbar's hidden measurement
 * replica. The replica must render the same indicators or it under-measures the
 * expanded chip, which makes the responsive compact/expanded toggle oscillate.
 */
export declare function GitBranchChipContent({
  branch,
  status,
  compact,
  worktree,
}: {
  branch: string;
  status?: DaemonWorkspaceGitStatus;
  compact: boolean;
  worktree?: boolean;
}): import('react/jsx-runtime').JSX.Element;
export declare function GitBranchIndicator({
  branch,
  status,
  compact,
  onOpenDiff,
  worktree,
}: {
  branch: string;
  status?: DaemonWorkspaceGitStatus;
  compact?: boolean;
  onOpenDiff?: () => void;
  worktree?: boolean;
}): import('react/jsx-runtime').JSX.Element;
export {};
