/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { StreamingState } from '../types.js';
import type { LoadedSettings } from '../../config/settings.js';
import type { Config } from '@qwen-code/qwen-code-core';
import type { TerminalNotification } from './useTerminalNotification.js';
import type { TrackedToolCall } from './useReactToolScheduler.js';
export declare const LONG_TASK_NOTIFICATION_THRESHOLD_SECONDS = 20;
export type NotificationMode = 'all' | 'task-complete';
interface UseAttentionNotificationsOptions {
  isFocused: boolean;
  streamingState: StreamingState;
  elapsedTime: number;
  settings: LoadedSettings;
  config?: Config;
  terminal: TerminalNotification;
  pendingToolCalls?: TrackedToolCall[];
}
export declare const useAttentionNotifications: ({
  isFocused,
  streamingState,
  elapsedTime,
  settings,
  config,
  terminal,
  pendingToolCalls,
}: UseAttentionNotificationsOptions) => void;
export {};
