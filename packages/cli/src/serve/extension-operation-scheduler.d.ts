/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface FifoTaskQueue {
  run<T>(
    task: () => Promise<T>,
    options?: {
      signal?: AbortSignal;
      onStart?: () => void;
    },
  ): Promise<T>;
  runUntilReleased<T>(
    task: (release: () => void) => Promise<T>,
    options?: {
      signal?: AbortSignal;
      onStart?: () => void;
    },
  ): Promise<T>;
}
export declare function createFifoTaskQueue(limit: number): FifoTaskQueue;
