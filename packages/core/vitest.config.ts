/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@opentelemetry/api': path.resolve(
        __dirname,
        './src/telemetry/dummy-otel.ts',
      ),
      '@opentelemetry/sdk-logs': path.resolve(
        __dirname,
        './src/telemetry/log-to-span-processor.ts',
      ),
      '@opentelemetry/sdk-trace-base': path.resolve(
        __dirname,
        './src/telemetry/log-to-span-processor.ts',
      ),
      '@opentelemetry/resources': path.resolve(
        __dirname,
        './src/telemetry/log-to-span-processor.ts',
      ),
      '@opentelemetry/sdk-node': path.resolve(
        __dirname,
        './src/telemetry/sdk.ts',
      ),
      '@opentelemetry/instrumentation-http': path.resolve(
        __dirname,
        './src/telemetry/sdk.ts',
      ),
    },
  },
  test: {
    reporters: ['default', 'junit'],
    silent: true,
    setupFiles: ['./test-setup.ts'],
    outputFile: {
      junit: 'junit.xml',
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*'],
      reporter: [
        ['text', { file: 'full-text-summary.txt' }],
        'html',
        'json',
        'lcov',
        'cobertura',
        ['json-summary', { outputFile: 'coverage-summary.json' }],
      ],
    },
    poolOptions: {
      threads: {
        minThreads: 8,
        maxThreads: 16,
      },
    },
  },
});
