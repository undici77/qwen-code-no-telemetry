/**
 * @license
 * Copyright 2025 Google LLC
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
