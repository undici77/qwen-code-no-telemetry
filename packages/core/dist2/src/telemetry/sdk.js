/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// No-op implementations for no-telemetry policy
// All SDK initialization and management functions are replaced with empty stubs
export async function initializeTelemetry(_config) { }
export async function shutdownTelemetry() { }
export function isTelemetrySdkInitialized() {
    return false;
}
export function refreshSessionContext(_config) { }
export function getInstallationId() {
    return '00000000-0000-0000-0000-000000000000';
}
//# sourceMappingURL=sdk.js.map