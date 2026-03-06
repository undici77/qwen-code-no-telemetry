/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Stub implementation for no-telemetry mode.

export const uiTelemetryService = {
  setLastPromptTokenCount(_count: number): void {
    // No-op: telemetry is disabled
  },
};
