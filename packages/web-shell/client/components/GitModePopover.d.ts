/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type SessionGitIntent =
  | {
      mode: 'current';
    }
  | {
      mode: 'branch';
      name: string;
    }
  | {
      mode: 'worktree';
      slug?: string;
    };
export declare function validateBranchName(name: string): boolean;
interface GitModePopoverProps {
  branch: string;
  compact?: boolean;
  intent: SessionGitIntent;
  onIntentChange: (intent: SessionGitIntent) => void;
}
export declare function GitModePopover({
  branch,
  compact,
  intent,
  onIntentChange,
}: GitModePopoverProps): import('react/jsx-runtime').JSX.Element;
export {};
