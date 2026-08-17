/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as vscode from 'vscode';
export declare const LOG_LEVELS: readonly [
  'debug',
  'error',
  'info',
  'log',
  'warn',
];
export type LogLevel = (typeof LOG_LEVELS)[number];
export declare function formatLogArgs(args: unknown[]): string;
export declare function isLogLevel(value: unknown): value is LogLevel;
export declare function resetLoggerSink(): void;
export declare const logger: {
  debug: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};
export declare function createLogger(
  outputChannel: vscode.OutputChannel,
  sanitize?: (message: string) => string,
): void;
