/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type { TelemetryRuntimeConfig } from './runtime-config.js';

// No-op implementations for no-telemetry policy
// All SDK initialization and management functions are replaced with empty stubs

export function isTelemetrySdkInitialized(): boolean {
  return false;
}

export async function initializeTelemetry(
  _config: Config | TelemetryRuntimeConfig,
): Promise<void> {}

/**
 * Refresh the session context with a new session ID.
 * Must be called whenever the session changes (e.g. /clear, /resume)
 * so that SessionIdSpanProcessor stamps spans with the correct session.id.
 */
export function refreshSessionContext(_sessionId: string): void {}

export async function shutdownTelemetry(): Promise<void> {}

export function getInstallationId(): string {
  return '00000000-0000-0000-0000-000000000000';
}

export async function forceFlushMetrics(): Promise<void> {}
