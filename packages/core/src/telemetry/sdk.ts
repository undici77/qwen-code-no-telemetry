import { type Config } from '../config/config.js';

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
}

/**
 * Refresh the session context with a new session ID.
 */
export function refreshSessionContext(_sessionId: string): void {
  // No-op for no-telemetry version
}

/**
 * Refresh the session root context with a new session ID.
 * Legacy alias for refreshSessionContext.
 */
export function refreshSessionRootContext(sessionId: string): void {
  refreshSessionContext(sessionId);
}
