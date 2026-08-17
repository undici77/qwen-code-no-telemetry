/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const REDACTED_URL_CREDENTIAL = '***REDACTED***';
/**
 * Redacts userinfo credentials and opaque upload identity tokens from
 * extension sources for logs, telemetry, and display. This also handles
 * diagnostic messages that contain sensitive sources. The original source
 * should still be preserved for installation and update operations.
 */
export declare function redactUrlCredentials(source: string): string;
