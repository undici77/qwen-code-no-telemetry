import path from 'node:path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  resolve: {
    alias: {
      '@qwen-code/qwen-code/export': path.resolve(
        __dirname,
        '../cli/src/export/index.ts',
      ),
      '@opentelemetry/api': path.resolve(
        __dirname,
        '../core/src/telemetry/dummy-otel.ts',
      ),
      '@opentelemetry/sdk-logs': path.resolve(
        __dirname,
        '../core/src/telemetry/log-to-span-processor.ts',
      ),
      '@opentelemetry/sdk-trace-base': path.resolve(
        __dirname,
        '../core/src/telemetry/log-to-span-processor.ts',
      ),
      '@opentelemetry/resources': path.resolve(
        __dirname,
        '../core/src/telemetry/log-to-span-processor.ts',
      ),
      '@opentelemetry/sdk-node': path.resolve(
        __dirname,
        '../core/src/telemetry/sdk.ts',
      ),
      '@opentelemetry/instrumentation-http': path.resolve(
        __dirname,
        '../core/src/telemetry/sdk.ts',
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'clover'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
    },
  },
});
//# sourceMappingURL=vitest.config.js.map
