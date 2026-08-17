/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonLiveMuteUpdate, DaemonLiveStatus } from '@qwen-code/sdk';
export interface UseLiveVoiceResult {
  supported: boolean;
  status: DaemonLiveStatus | undefined;
  loading: boolean;
  mutating: boolean;
  refresh: () => Promise<void>;
  start: (mode?: 'resume' | 'new') => Promise<void>;
  stop: () => Promise<void>;
  setMute: (update: DaemonLiveMuteUpdate) => Promise<void>;
}
export declare function useLiveVoice(): UseLiveVoiceResult;
