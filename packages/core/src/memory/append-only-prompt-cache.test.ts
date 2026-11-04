/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Config } from '../config/config.js';
import {
  appendAutoMemoryDelta,
  buildAutoMemoryReminder,
  drainAutoMemoryDelta,
  isAppendOnlyMemoryEnabled,
  resetAppendOnlyMemoryStateForTests,
} from './append-only-prompt-cache.js';

const INDEX_V1 = [
  '# Managed memory',
  '',
  '- [Auth uses JWT](auth-jwt.md) — tokens expire in 15m',
].join('\n');

const INDEX_V2 = [
  INDEX_V1,
  '- [Build is esbuild](build.md) — bundle step',
].join('\n');

interface FakeConfig {
  config: Config;
  chat: { addHistory: ReturnType<typeof vi.fn> };
  setPrompt: (prompt: string) => void;
}

function createFakeConfig(initialPrompt: string): FakeConfig {
  let prompt = initialPrompt;
  const config = {
    getAutoMemoryPrompt: () => prompt,
    refreshHierarchicalMemory: vi.fn().mockResolvedValue(undefined),
  } as unknown as Config;
  return {
    config,
    chat: { addHistory: vi.fn() },
    setPrompt: (next: string) => {
      prompt = next;
    },
  };
}

describe('append-only auto-memory delivery', () => {
  beforeEach(() => {
    process.env['QWEN_MEMORY_APPEND_ONLY'] = '1';
  });

  afterEach(() => {
    delete process.env['QWEN_MEMORY_APPEND_ONLY'];
  });

  describe('isAppendOnlyMemoryEnabled', () => {
    it.each(['1', 'true', 'on', 'TRUE'])('is enabled for %s', (value) => {
      process.env['QWEN_MEMORY_APPEND_ONLY'] = value;
      expect(isAppendOnlyMemoryEnabled()).toBe(true);
    });

    it.each(['0', 'false', '', 'yes'])('is disabled for %s', (value) => {
      process.env['QWEN_MEMORY_APPEND_ONLY'] = value;
      expect(isAppendOnlyMemoryEnabled()).toBe(false);
    });

    it('is disabled when unset', () => {
      delete process.env['QWEN_MEMORY_APPEND_ONLY'];
      expect(isAppendOnlyMemoryEnabled()).toBe(false);
    });
  });

  describe('buildAutoMemoryReminder', () => {
    it('returns null when the mode is off', () => {
      delete process.env['QWEN_MEMORY_APPEND_ONLY'];
      const { config } = createFakeConfig(INDEX_V1);
      expect(buildAutoMemoryReminder(config)).toBeNull();
    });

    it('wraps the memory prompt in a system reminder', () => {
      const { config } = createFakeConfig(INDEX_V1);
      const reminder = buildAutoMemoryReminder(config);
      expect(reminder).toContain('<system-reminder>');
      expect(reminder).toContain('[Auth uses JWT](auth-jwt.md)');
    });

    it('returns null when there is no memory section', () => {
      const { config } = createFakeConfig('   ');
      expect(buildAutoMemoryReminder(config)).toBeNull();
    });
  });

  describe('appendAutoMemoryDelta', () => {
    it('reloads memory from disk but never appends', async () => {
      const { config, chat, setPrompt } = createFakeConfig(INDEX_V1);
      buildAutoMemoryReminder(config);

      setPrompt(INDEX_V2);
      await appendAutoMemoryDelta(config);

      expect(config.refreshHierarchicalMemory).toHaveBeenCalledTimes(1);
      expect(chat.addHistory).not.toHaveBeenCalled();
    });
  });

  describe('drainAutoMemoryDelta', () => {
    it('appends only the added lines', () => {
      const { config, chat, setPrompt } = createFakeConfig(INDEX_V1);
      buildAutoMemoryReminder(config);

      setPrompt(INDEX_V2);
      drainAutoMemoryDelta(config, chat);

      expect(chat.addHistory).toHaveBeenCalledTimes(1);
      const text = chat.addHistory.mock.calls[0][0].parts[0].text as string;
      expect(text).toContain('<system-reminder>');
      expect(text).toContain('Added:');
      expect(text).toContain('[Build is esbuild](build.md)');
      expect(text).not.toContain('[Auth uses JWT](auth-jwt.md)');
    });

    it('reports removed entries', () => {
      const { config, chat, setPrompt } = createFakeConfig(INDEX_V2);
      buildAutoMemoryReminder(config);

      setPrompt(INDEX_V1);
      drainAutoMemoryDelta(config, chat);

      const text = chat.addHistory.mock.calls[0][0].parts[0].text as string;
      expect(text).toContain('Removed:');
      expect(text).toContain('[Build is esbuild](build.md)');
    });

    it('appends nothing when the prompt is unchanged', () => {
      const { config, chat } = createFakeConfig(INDEX_V1);
      buildAutoMemoryReminder(config);

      drainAutoMemoryDelta(config, chat);

      expect(chat.addHistory).not.toHaveBeenCalled();
    });

    it('appends nothing before the prelude has delivered a prompt', () => {
      const { config, chat, setPrompt } = createFakeConfig(INDEX_V1);
      resetAppendOnlyMemoryStateForTests(config);

      setPrompt(INDEX_V2);
      drainAutoMemoryDelta(config, chat);

      expect(chat.addHistory).not.toHaveBeenCalled();
    });

    it('appends nothing when the mode is off', () => {
      const { config, chat, setPrompt } = createFakeConfig(INDEX_V1);
      buildAutoMemoryReminder(config);
      delete process.env['QWEN_MEMORY_APPEND_ONLY'];

      setPrompt(INDEX_V2);
      drainAutoMemoryDelta(config, chat);

      expect(chat.addHistory).not.toHaveBeenCalled();
    });

    it('emits one cumulative delta for several saves between drains', async () => {
      const { config, chat, setPrompt } = createFakeConfig(INDEX_V1);
      buildAutoMemoryReminder(config);

      setPrompt(INDEX_V2);
      await appendAutoMemoryDelta(config);
      await appendAutoMemoryDelta(config);
      drainAutoMemoryDelta(config, chat);
      drainAutoMemoryDelta(config, chat);

      expect(chat.addHistory).toHaveBeenCalledTimes(1);
    });
  });
});
