/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';

// No-op implementations for no-telemetry policy
// All SDK initialization and management functions are replaced with empty stubs

export async function initTelemetrySdk(_config: Config): Promise<void> {}

export async function shutdownTelemetrySdk(): Promise<void> {}

export function isTelemetrySdkInitialized(): boolean {
  return false;
}

export function getInstallationId(): string {
  return '00000000-0000-0000-0000-000000000000';
}
