/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as nodeFs from 'node:fs';
import lockfile from 'proper-lockfile';
export type DaemonLogLevel = 'INFO' | 'WARN' | 'ERROR';
export type DaemonLogMode = 'stable' | 'fallback' | 'stderr-only';
export type DaemonLogHealth = 'ok' | 'degraded';
export type DaemonLogIssue =
  | 'init_failed'
  | 'rotation_failed'
  | 'retention_failed'
  | 'queue_overflow'
  | 'write_failed'
  | 'lease_compromised';
export interface DaemonLoggerStatus {
  runId: string;
  mode: DaemonLogMode;
  health: DaemonLogHealth;
  issues: readonly DaemonLogIssue[];
  droppedRecords: number;
  droppedBytes: number;
}
export interface DaemonLogContext {
  route?: string;
  sessionId?: string;
  clientId?: string;
  childPid?: number;
  channelId?: string;
  [key: string]: unknown;
}
export interface BuildDaemonLogLineArgs {
  level: DaemonLogLevel;
  message: string;
  now: Date;
  ctx?: DaemonLogContext;
  err?: Error;
}
export declare function buildDaemonLogLine(
  args: BuildDaemonLogLineArgs,
): string;
export interface DaemonLogger {
  info(message: string, ctx?: DaemonLogContext): void;
  warn(message: string, ctx?: DaemonLogContext): void;
  error(message: string, err?: Error | null, ctx?: DaemonLogContext): void;
  raw(line: string, level?: 'info' | 'warn' | 'error'): void;
  getLogPath(): string;
  getDaemonId(): string;
  getStatus(): DaemonLoggerStatus;
  flush(): Promise<void>;
  close(): Promise<void>;
}
export interface DaemonLoggerPolicy {
  maxBytes: number;
  maxArchives: number;
  maxRecordBytes: number;
  maxPendingBytes: number;
  stableAcquireBudgetMs: number;
  maintenanceAcquireBudgetMs: number;
  lockStaleMs: number;
  lockUpdateMs: number;
  rotationRetryIntervalMs: number;
  closeDrainBudgetMs: number;
}
type DaemonLoggerFs = Pick<
  typeof nodeFs.promises,
  | 'appendFile'
  | 'chmod'
  | 'lstat'
  | 'mkdir'
  | 'open'
  | 'readFile'
  | 'readdir'
  | 'rename'
  | 'rm'
  | 'stat'
  | 'symlink'
  | 'unlink'
  | 'writeFile'
>;
type AcquireLock = typeof lockfile.lock;
export interface InitDaemonLoggerOptions {
  boundWorkspace: string;
  pid?: number;
  now?: () => Date;
  monotonicNow?: () => number;
  stderr?: (line: string) => void;
  baseDir?: string;
  runId?: string;
  policy?: Partial<DaemonLoggerPolicy>;
  fs?: DaemonLoggerFs;
  acquireLock?: AcquireLock;
}
export declare function resolveDaemonLogBaseDir(
  runtimeOutputDir?: string,
  cwd?: string,
): string;
export declare function initDaemonLogger(
  opts: InitDaemonLoggerOptions,
): Promise<DaemonLogger>;
export {};
