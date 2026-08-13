/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Context } from './dummy-otel.js';

let sessionRootContext: Context | undefined;
let currentSessionId: string | undefined;

export function setSessionContext(
  ctx: Context | undefined,
  sessionId?: string,
): void {
  sessionRootContext = ctx;
  currentSessionId = sessionId;
}

export function getSessionContext(): Context | undefined {
  return sessionRootContext;
}

/**
 * Returns the most recent session ID passed to setSessionContext.
 * Used by LogToSpanProcessor as a fallback to derive the correct traceId
 * when a log record has no session.id attribute (e.g. after /clear or /resume).
 */
export function getCurrentSessionId(): string | undefined {
  return currentSessionId;
}

// No-op stubs for no-telemetry policy.
// Upstream uses these to extract session IDs from OTel contexts.
export function setSessionIdOnContext(_ctx: Context, _sessionId: string | undefined): Context {
  return _ctx;
}

export function getSessionIdFromContext(_ctx: Context): string | undefined {
  return currentSessionId;
}
