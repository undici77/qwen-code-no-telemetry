/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeJsonStringify } from '../utils/safeJsonStringify.js';

// No-op implementations for no-telemetry policy
// These classes are stubs to maintain compatibility without opentelemetry dependencies

class FileExporter {
  constructor(_filePath: string) {}
  protected serialize(data: unknown): string {
    return safeJsonStringify(data, 2) + '\n';
  }
  async shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

export class FileSpanExporter extends FileExporter {
  export(
    _spans: unknown[],
    resultCallback: (result: { code: number }) => void,
  ): void {
    resultCallback({ code: 0 }); // SUCCESS
  }
}

export class FileLogExporter extends FileExporter {
  export(
    _logs: unknown[],
    resultCallback: (result: { code: number }) => void,
  ): void {
    resultCallback({ code: 0 }); // SUCCESS
  }
}

export class FileMetricExporter extends FileExporter {
  export(
    _metrics: unknown,
    resultCallback: (result: { code: number }) => void,
  ): void {
    resultCallback({ code: 0 }); // SUCCESS
  }
  getPreferredAggregationTemporality(): number {
    return 1; // CUMULATIVE
  }
  async forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}
