/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// No-op implementations for no-telemetry policy.
// The upstream session-events.ts uses @opentelemetry/api-logs which is removed.
// These functions are called from sdk.ts initializeTelemetry/shutdownTelemetry
// which are themselves no-ops in this fork.

export function emitSessionStart(
  _sessionId: string,
  _previousSessionId?: string,
): void {}

export function emitSessionEnd(_sessionId: string): void {}
