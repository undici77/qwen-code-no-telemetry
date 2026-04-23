/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'node:fs';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  extractJsonStringField,
  extractLastJsonStringField,
  readLastJsonStringFieldSync,
  readLastJsonStringFieldsSync,
  LITE_READ_BUF_SIZE,
} from './sessionStorageUtils.js';

vi.mock('node:fs');

describe('sessionStorageUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractJsonStringField', () => {
    it('extracts simple string values', () => {
      const json = '{"foo":"bar","baz":"qux"}';
      expect(extractJsonStringField(json, 'foo')).toBe('bar');
      expect(extractJsonStringField(json, 'baz')).toBe('qux');
    });

    it('handles spaces after colon', () => {
      const json = '{"foo": "bar"}';
      expect(extractJsonStringField(json, 'foo')).toBe('bar');
    });

    it('handles escaped quotes', () => {
      const json = '{"foo":"bar\\"baz"}';
      expect(extractJsonStringField(json, 'foo')).toBe('bar"baz');
    });

    it('returns undefined for missing keys', () => {
      const json = '{"foo":"bar"}';
      expect(extractJsonStringField(json, 'missing')).toBeUndefined();
    });
  });

  describe('extractLastJsonStringField', () => {
    it('finds the latest occurrence in multi-line text', () => {
      const text = '{"title":"first"}\n{"title":"second"}';
      expect(extractLastJsonStringField(text, 'title')).toBe('second');
    });

    it('honors lineContains filter', () => {
      const text =
        '{"title":"user title"}\n{"subtype":"custom_title","title":"system title"}';
      // Without filter, both match and second wins
      expect(extractLastJsonStringField(text, 'title')).toBe('system title');
      // With filter, only second one matches
      expect(extractLastJsonStringField(text, 'title', 'custom_title')).toBe(
        'system title',
      );
      // Filter that doesn't match any line
      expect(
        extractLastJsonStringField(text, 'title', 'nonexistent'),
      ).toBeUndefined();
    });
  });

  describe('readLastJsonStringFieldSync', () => {
    it('returns undefined for empty files', () => {
      vi.mocked(fs.statSync).mockReturnValue({ size: 0 } as fs.Stats);
      expect(readLastJsonStringFieldSync('test.jsonl', 'foo')).toBeUndefined();
    });

    it('reads from tail window (Phase 1 fast path)', () => {
      const content = '{"foo":"tail-match"}';
      vi.mocked(fs.statSync).mockReturnValue({
        size: content.length,
      } as fs.Stats);
      vi.mocked(fs.openSync).mockReturnValue(1);
      vi.mocked(fs.readSync as any).mockImplementation(
        (
          _fd: number,
          buffer: any,
          _offset: number,
          length: number,
          _position: any,
        ) => {
          const data = Buffer.from(content);
          data.copy(buffer, 0, 0, Math.min(data.length, length));
          return Math.min(data.length, length);
        },
      );

      expect(readLastJsonStringFieldSync('test.jsonl', 'foo')).toBe(
        'tail-match',
      );
      // Verify it only did Phase 1 (one readSync)
      expect(fs.readSync).toHaveBeenCalledTimes(1);
    });

    it('falls back to full file scan (Phase 2) when tail misses', () => {
      // Create a file larger than LITE_READ_BUF_SIZE
      const head = '{"foo":"head-match"}\n';
      const padding = 'x'.repeat(LITE_READ_BUF_SIZE);
      const fileSize = head.length + padding.length;

      vi.mocked(fs.statSync).mockReturnValue({ size: fileSize } as fs.Stats);
      vi.mocked(fs.openSync).mockReturnValue(1);

      // Phase 1 (tail) returns padding (no match)
      // Phase 2 (full) returns head then padding
      let callCount = 0;
      vi.mocked(fs.readSync as any).mockImplementation(
        (
          _fd: number,
          buffer: any,
          _offset: number,
          length: number,
          position: any,
        ) => {
          callCount++;
          if (position >= head.length) {
            // Tail or Phase 2 padding
            const data = Buffer.from(padding.slice(0, length));
            data.copy(buffer);
            return data.length;
          } else {
            // Phase 2 head
            const data = Buffer.from(head);
            data.copy(buffer);
            return data.length;
          }
        },
      );

      expect(readLastJsonStringFieldSync('test.jsonl', 'foo')).toBe(
        'head-match',
      );
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('readLastJsonStringFieldsSync', () => {
    it('extracts multiple fields from the same line', () => {
      const content =
        '{"subtype":"custom_title","customTitle":"Title","titleSource":"auto"}\n';
      vi.mocked(fs.statSync).mockReturnValue({
        size: content.length,
      } as fs.Stats);
      vi.mocked(fs.openSync).mockReturnValue(1);
      vi.mocked(fs.readSync as any).mockImplementation(
        (
          _fd: number,
          buffer: any,
          _offset: number,
          length: number,
          _position: any,
        ) => {
          const data = Buffer.from(content);
          data.copy(buffer, 0, 0, Math.min(data.length, length));
          return Math.min(data.length, length);
        },
      );

      const result = readLastJsonStringFieldsSync(
        'test.jsonl',
        'customTitle',
        ['titleSource'],
        'custom_title',
      );
      expect(result).toEqual({
        customTitle: 'Title',
        titleSource: 'auto',
      });
    });

    it('guarantees atomicity (fields come from the same record)', () => {
      // Two records:
      // 1. Has both fields
      // 2. Has only the primary field (e.g. legacy write)
      // The function should return only the fields from the LATEST matching
      // record, even if some fields are missing there but were present
      // in an earlier record.
      const content =
        '{"subtype":"custom_title","customTitle":"Old","titleSource":"auto"}\n' +
        '{"subtype":"custom_title","customTitle":"New"}\n';

      vi.mocked(fs.statSync).mockReturnValue({
        size: content.length,
      } as fs.Stats);
      vi.mocked(fs.openSync).mockReturnValue(1);
      vi.mocked(fs.readSync as any).mockImplementation(
        (
          _fd: number,
          buffer: any,
          _offset: number,
          length: number,
          _position: any,
        ) => {
          const data = Buffer.from(content);
          data.copy(buffer, 0, 0, Math.min(data.length, length));
          return Math.min(data.length, length);
        },
      );

      const result = readLastJsonStringFieldsSync(
        'test.jsonl',
        'customTitle',
        ['titleSource'],
        'custom_title',
      );

      // Primary key matches the second line. 'titleSource' is missing on
      // that line, so it MUST be undefined, not 'auto' from the first line.
      expect(result).toEqual({
        customTitle: 'New',
        titleSource: undefined,
      });
    });
  });
});
