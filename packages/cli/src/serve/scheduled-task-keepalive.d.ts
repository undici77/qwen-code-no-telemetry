/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type DurableCronTask } from '@qwen-code/qwen-code-core';
/** The slice of the bridge the keepalive needs — narrowed for testability.
 * `recordHeartbeat` keeps a live session resident; `loadSession` revives one
 * the reaper already let go (a re-enabled task's session). `spawnOrAttach`
 * and `updateSessionMetadata` bind unbound durable tasks to dedicated
 * sessions — the same flow the POST /scheduled-tasks route uses for
 * UI-created tasks, applied retroactively to cron_create tool tasks. */
export interface KeepaliveBridge {
  recordHeartbeat(sessionId: string): unknown;
  loadSession(req: {
    sessionId: string;
    workspaceCwd: string;
    historyReplay?: 'stream' | 'response';
    sourceType?: string;
    sourceId?: string;
  }): Promise<unknown>;
  spawnOrAttach(req: {
    workspaceCwd: string;
    sessionScope?: 'single' | 'thread';
    sourceType?: string;
    sourceId?: string;
  }): Promise<{
    sessionId: string;
  }>;
  closeSession(sessionId: string): Promise<unknown>;
  updateSessionMetadata(
    sessionId: string,
    metadata: {
      displayName?: string;
    },
  ): unknown;
}
export interface ScheduledTaskKeepalive {
  /** Stops the periodic heartbeat. Idempotent. */
  stop(): void;
  /** Runs one heartbeat pass immediately. Exposed for tests / eager warm-up. */
  tick(): Promise<void>;
}
export interface StartScheduledTaskKeepaliveOptions {
  bridge: KeepaliveBridge;
  boundWorkspace: string;
  runtimeBaseDir?: string;
  cleanupSession?: (sessionId: string) => Promise<unknown>;
  /** How often to heartbeat; must be comfortably under the reaper timeout. */
  intervalMs: number;
  /** Per-session revive timeout; values above the JS timer limit disable it. */
  reviveTimeoutMs?: number;
  /** Per-task spawn timeout; defaults to KEEPALIVE_SPAWN_TIMEOUT_MS. */
  spawnTimeoutMs?: number;
  onTasksRead?: (tasks: readonly DurableCronTask[]) => void;
}
export declare function startScheduledTaskKeepalive(
  opts: StartScheduledTaskKeepaliveOptions,
): ScheduledTaskKeepalive;
/** The slice of the bridge rehydration needs — narrowed for testability. */
export interface RehydrateBridge {
  loadSession(req: {
    sessionId: string;
    workspaceCwd: string;
    historyReplay?: 'stream' | 'response';
    sourceType?: string;
    sourceId?: string;
  }): Promise<unknown>;
}
export interface RehydrateResult {
  loaded: string[];
  failed: string[];
}
export declare function rehydrateScheduledTaskSessions(deps: {
  bridge: RehydrateBridge;
  boundWorkspace: string;
  onError?: (sessionId: string, err: unknown) => void;
  /** Values above the JS timer limit disable the caller-side watchdog. */
  loadTimeoutMs?: number;
  onTasksRead?: (tasks: readonly DurableCronTask[]) => void;
}): Promise<RehydrateResult>;
