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
      'mime/lite': path.resolve(
        __dirname,
        '../../node_modules/mime/dist/src/index_lite.js',
      ),
      fdir: path.resolve(__dirname, '../../node_modules/fdir/dist/index.mjs'),
    },
  },
  test: {
    // Raise the per-test ceiling above vitest's 5s default: the self-hosted
    // CI runners are heavily oversubscribed, and I/O-
    // or WASM-load-bound tests (e.g. the web-tree-sitter lazy runtime, tar
    // extraction) blow 5s purely under contention, not from any logic fault.
    // Assertions still fail instantly; only the timeout ceiling grows.
    testTimeout: 15000,
    // ECS hosts run several jobs at once; leave capacity for neighboring jobs.
    maxWorkers: process.env['RUNNER_NAME']?.startsWith('ecs-qwen-')
      ? '25%'
      : undefined,
    reporters: ['default', 'junit'],
    silent: true,
    // Fail fast with an actionable message when the workspace dist/ output
    // core tests import through the package entry is missing (fresh clone,
    // new worktree, deep clean). See scripts/vitest-global-setup.js and
    // issue #9149.
    // Resolved against this config file (not vitest's root/cwd) so the guard
    // also loads when vitest is launched from elsewhere with --config.
    globalSetup: path.resolve(
      __dirname,
      '../../scripts/vitest-global-setup.js',
    ),
    setupFiles: ['./test-setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      'src/telemetry/detailed-span-attributes.test.ts',
      'src/telemetry/file-exporters.test.ts',
      'src/telemetry/log-to-span-processor.test.ts',
      'src/telemetry/loggers.test.ts',
      'src/telemetry/resource-attributes.test.ts',
      'src/telemetry/sanitize.test.ts',
      'src/telemetry/session-context.test.ts',
      'src/telemetry/session-tracing.test.ts',
      'src/telemetry/telemetry-utils.test.ts',
      'src/telemetry/trace-id-utils.test.ts',
      'src/telemetry/tracer.test.ts',
      'src/telemetry/daemon-metrics.test.ts',
      'src/telemetry/daemon-tracing.test.ts',
      'src/telemetry/sdk.test.ts',
      'src/telemetry/trace-context.test.ts',
      'src/telemetry/qwen-logger/qwen-logger.test.ts',
      'src/telemetry/event-loop-lag-metrics.test.ts',
      'src/tools/web-search.test.ts',
      'src/telemetry/session-events.test.ts',
    ],
    outputFile: {
      junit: 'junit.xml',
    },
    // The worker->main `onTaskUpdate` RPC runs on a 60s budget; under the
    // resource pressure of the Windows/macOS runners a stall longer than that
    // surfaces as an unhandled error and exits an all-green run red (same
    // failure class the cli and scripts suites hit on these lanes). Test
    // failures still fail the run; only unhandled errors stop being fatal,
    // and only off Linux — the ubuntu lane and Linux local runs keep the
    // unhandled-error signal.
    dangerouslyIgnoreUnhandledErrors: process.platform !== 'linux',
    coverage: {
      // CI consumes coverage only from the ubuntu lane (the upload and the
      // coverage comment both pin coverage-reports-*-ubuntu-latest), and the
      // report generation adds end-of-run main-thread work on the smaller
      // Windows/macOS runners; skip it there. Local runs keep coverage.
      enabled: !process.env.CI || process.platform === 'linux',
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
  },
});
