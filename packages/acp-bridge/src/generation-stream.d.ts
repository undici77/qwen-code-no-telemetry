/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Single-consumer bounded queue for request-scoped generation events.
 * Unlike EventBus, it has no replay or fan-out because generated side content
 * belongs only to the HTTP request that initiated it.
 */
export declare class GenerationStreamQueue<T> implements AsyncIterable<T> {
  private readonly capacity;
  private readonly values;
  private waiter;
  private closed;
  private failure;
  constructor(capacity: number);
  push(value: T): boolean;
  close(): void;
  fail(error: unknown): void;
  private settleWaiter;
  private next;
  [Symbol.asyncIterator](): AsyncIterator<T>;
}
