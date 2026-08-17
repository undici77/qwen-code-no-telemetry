/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionStartSource } from '../hooks/types.js';
export declare const SESSION_START_PROFILE_ENV =
  'QWEN_CODE_PROFILE_SESSION_START';
export interface SessionStartProfileRecord {
  timestamp: string;
  source: SessionStartSource;
  ok: boolean;
  sessionId?: string;
  /**
   * Wall-clock session start duration. The sum of `stages` can differ from
   * `totalMs` because some stages overlap and unmeasured code runs between
   * stages.
   */
  totalMs: number;
  stages: Record<string, number>;
  extraHistoryLength?: number;
  historyLength?: number;
  snapshotEntryCount?: number;
  deferredReminderCount?: number;
  failedStage?: string;
}
export interface SessionStartProfileFinishAttrs {
  ok: boolean;
  extraHistoryLength?: number;
  historyLength?: number;
  snapshotEntryCount?: number;
  deferredReminderCount?: number;
}
export interface SessionStartProfiler {
  readonly enabled: boolean;
  time<T>(stage: string, fn: () => T | Promise<T>): Promise<T>;
  timeSync<T>(stage: string, fn: () => T): T;
  finish(attrs: SessionStartProfileFinishAttrs): void;
}
interface SessionStartProfilerOptions {
  enabled?: boolean;
  sessionId?: string;
  now?: () => number;
  getTimestamp?: () => Date;
  writeRecord?: (record: SessionStartProfileRecord) => void;
}
export declare function createSessionStartProfiler(
  source: SessionStartSource,
  options?: SessionStartProfilerOptions,
): SessionStartProfiler;
export {};
