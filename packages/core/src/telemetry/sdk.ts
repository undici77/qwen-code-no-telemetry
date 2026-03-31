/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';

let telemetryInitialized = false;

export function isTelemetrySdkInitialized(): boolean {
  return telemetryInitialized;
}

export function initializeTelemetry(_config: Config): void {
  // No-op for no-telemetry version
  telemetryInitialized = false;
}

export async function shutdownTelemetry(): Promise<void> {
  // No-op for no-telemetry version
  telemetryInitialized = false;
  return Promise.resolve();
}
