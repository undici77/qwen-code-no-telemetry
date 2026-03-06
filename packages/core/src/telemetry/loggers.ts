/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Telemetry logging functions - stub implementations for no-telemetry mode
// These are kept as no-ops to maintain compatibility with code that was
// designed with telemetry support but is now running without it.

import type { Config } from '../config/config.js';
import type {
  ContentRetryEvent,
  ContentRetryFailureEvent,
} from './types.js';

/**
 * Logs a content retry event. In no-telemetry mode, this is a no-op.
 */
export function logContentRetry(
  _config: Config,
  _event: ContentRetryEvent,
): void {
  // No-op: telemetry is disabled
}

/**
 * Logs a content retry failure event. In no-telemetry mode, this is a no-op.
 */
export function logContentRetryFailure(
  _config: Config,
  _event: ContentRetryFailureEvent,
): void {
  // No-op: telemetry is disabled
}
