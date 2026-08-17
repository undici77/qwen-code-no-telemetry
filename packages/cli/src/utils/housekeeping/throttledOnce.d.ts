/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ThrottledOnceOptions {
  markerPath: string;
  lockPath: string;
  minIntervalMs?: number;
  staleLockMs?: number;
  name: string;
}
export type ThrottledOnceResult =
  | {
      status: 'completed';
    }
  | {
      status: 'fresh';
      retryAfterMs: number;
    }
  | {
      status: 'locked';
    }
  | {
      status: 'incomplete';
    };
export declare function runThrottledOnce(
  opts: ThrottledOnceOptions,
  task: () => Promise<void | false>,
): Promise<ThrottledOnceResult>;
