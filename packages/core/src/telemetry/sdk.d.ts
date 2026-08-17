/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { TelemetryRuntimeConfig } from './runtime-config.js';
export declare function isTelemetrySdkInitialized(): boolean;
export declare function initializeTelemetry(
  _config: Config | TelemetryRuntimeConfig,
): Promise<void>;
/**
 * Refresh the session context with a new session ID.
 * Must be called whenever the session changes (e.g. /clear, /resume)
 * so that SessionIdSpanProcessor stamps spans with the correct session.id.
 */
export declare function refreshSessionContext(_sessionId: string): void;
export declare function shutdownTelemetry(): Promise<void>;
export declare function getInstallationId(): string;
export declare function forceFlushMetrics(): Promise<void>;
