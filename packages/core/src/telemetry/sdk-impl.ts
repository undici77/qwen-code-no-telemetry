/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// No-op stub for no-telemetry policy.
// The upstream sdk-impl.ts imports @opentelemetry/* packages that are removed
// in this fork. Since sdk.ts never dynamically imports this module, it is safe
// to replace with an empty stub.

export function startTelemetrySdk(_config: unknown): Promise<{
  sdk: unknown;
  metricReader: unknown;
}> {
  return Promise.resolve({ sdk: undefined, metricReader: undefined });
}
