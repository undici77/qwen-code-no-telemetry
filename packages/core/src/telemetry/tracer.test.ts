/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  withSpan,
  startSpanWithContext,
  createSessionRootContext,
} from './tracer.js';

describe('tracer (no-telemetry)', () => {
  it('withSpan executes the callback and returns its result', async () => {
    const result = await withSpan('test.op', { key: 'value' }, async () => 42);
    expect(result).toBe(42);
  });

  it('startSpanWithContext returns a span and runInContext function', () => {
    const { span, runInContext } = startSpanWithContext('test.manual', {
      key: 'val',
    });
    expect(span).toBeDefined();
    expect(typeof runInContext).toBe('function');
    expect(runInContext(() => 'hello')).toBe('hello');
  });

  describe('createSessionRootContext', () => {
    it('derives a dummy context', () => {
      const ctx = createSessionRootContext('session-123');
      expect(ctx).toBeDefined();
    });

    it('produces an object', () => {
      const ctx = createSessionRootContext('session-123');
      expect(typeof ctx).toBe('object');
    });
  });
});
