/*
 * Copyright (c) Alibaba Group Holding Ltd.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// No-op implementation for no-telemetry policy
export class LogToSpanProcessor {
  constructor() {}
  onEmit() {}
  shutdown() {
    return Promise.resolve();
  }
  forceFlush() {
    return Promise.resolve();
  }
}

export type LogRecordProcessor = unknown;
export type ReadableLogRecord = unknown;
export type SpanExporter = unknown;
export type ReadableSpan = unknown;
export type Resource = unknown;
export function resourceFromAttributes() {
  return {};
}
