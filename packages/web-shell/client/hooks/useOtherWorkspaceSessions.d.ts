/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonSessionSummary } from '@qwen-code/sdk/daemon';
export interface OtherWorkspaceSessionsResult {
  sessions: DaemonSessionSummary[];
  reload: () => Promise<void>;
}
export declare function useOtherWorkspaceSessions(
  enabled?: boolean,
  pollIntervalMs?: number,
): OtherWorkspaceSessionsResult;
