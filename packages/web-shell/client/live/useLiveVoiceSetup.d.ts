/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  DaemonLiveSetupStatus,
  DaemonLiveSetupUpdate,
} from '@qwen-code/sdk';
export interface UseLiveVoiceSetupResult {
  supported: boolean;
  status: DaemonLiveSetupStatus | undefined;
  loading: boolean;
  mutating: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
  update: (update: DaemonLiveSetupUpdate) => Promise<void>;
  retryInstall: () => Promise<void>;
  launchHost: () => Promise<void>;
}
export declare function useLiveVoiceSetup(
  supported: boolean,
): UseLiveVoiceSetupResult;
