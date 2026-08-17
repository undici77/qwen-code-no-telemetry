/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config, type SessionListItem } from '@qwen-code/qwen-code-core';
import type { UseHistoryManagerReturn } from './useHistoryManager.js';
import type { LoadedSettings } from '../../config/settings.js';
export interface UseResumeCommandOptions {
  config: Config | null;
  settings: LoadedSettings;
  historyManager: Pick<
    UseHistoryManagerReturn,
    'addItem' | 'clearItems' | 'loadHistory'
  >;
  startNewSession: (sessionId: string) => void;
  clearPendingState?: () => void;
  setSessionName?: (name: string | null) => void;
  remount?: () => void;
}
export interface UseResumeCommandResult {
  isResumeDialogOpen: boolean;
  /** Pre-filtered sessions for the picker (when multiple title matches). */
  resumeMatchedSessions: SessionListItem[] | undefined;
  openResumeDialog: (matchedSessions?: SessionListItem[]) => void;
  closeResumeDialog: () => void;
  /**
   * Async — the implementation awaits SessionService and SessionStart hooks.
   * Callers that need to chain post-resume work should `await` it; pure
   * fire-and-forget callers (the resume dialog's `onSelect`) can ignore the
   * promise.
   */
  handleResume: (sessionId: string) => Promise<void>;
}
declare const BACKGROUND_WORK_SWITCH_BLOCKED_MESSAGE =
  "Stop the current session's running background tasks before resuming another session.";
export declare function useResumeCommand(
  options: UseResumeCommandOptions,
): UseResumeCommandResult;
export { BACKGROUND_WORK_SWITCH_BLOCKED_MESSAGE };
