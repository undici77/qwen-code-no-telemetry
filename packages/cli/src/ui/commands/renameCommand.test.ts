/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renameCommand } from './renameCommand.js';
import { CommandKind } from './types.js';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';

vi.mock('@qwen-code/qwen-code-core', async () => {
  const actual = await vi.importActual<
    typeof import('@qwen-code/qwen-code-core')
  >('@qwen-code/qwen-code-core');
  return {
    ...actual,
    tryGenerateSessionTitle: vi.fn(),
  };
});

describe('renameCommand', () => {
  const mockConfig = {
    getChatRecordingService: vi.fn(),
    getSessionService: vi.fn(),
    getSessionId: vi.fn().mockReturnValue('session-123'),
    getFastModel: vi.fn(),
    getModel: vi.fn().mockReturnValue('main-model'),
    getContentGenerator: vi.fn(),
    getGeminiClient: vi.fn().mockReturnValue({
      getHistory: vi.fn().mockReturnValue([]),
    }),
    getBaseLlmClient: vi.fn(),
  };

  const mockUi = {
    setPendingItem: vi.fn(),
    setSessionName: vi.fn(),
  };

  let mockContext = createMockCommandContext({
    services: { config: mockConfig as any },
    ui: mockUi as any,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockCommandContext({
      services: { config: mockConfig as any },
      ui: mockUi as any,
    });
  });

  it('has correct metadata', () => {
    expect(renameCommand.name).toBe('rename');
    expect(renameCommand.kind).toBe(CommandKind.BUILT_IN);
    expect(renameCommand.altNames).toContain('tag');
  });

  it('renames session with explicit name', async () => {
    const mockRecordingService = {
      recordCustomTitle: vi.fn().mockReturnValue(true),
    };
    mockConfig.getChatRecordingService.mockReturnValue(mockRecordingService);

    const result = (await renameCommand.action!(
      mockContext,
      'my-new-name',
    )) as any;

    expect(mockRecordingService.recordCustomTitle).toHaveBeenCalledWith(
      'my-new-name',
      'manual',
    );
    expect(mockUi.setSessionName).toHaveBeenCalledWith('my-new-name');
    expect(result.type).toBe('message');
    expect(result.messageType).toBe('info');
  });

  it('fails if name is too long', async () => {
    const longName = 'a'.repeat(300);
    const result = (await renameCommand.action!(mockContext, longName)) as any;

    expect(result.messageType).toBe('error');
    expect(result.content).toContain('too long');
  });

  it('supports --auto flag for fast-model title generation', async () => {
    const { tryGenerateSessionTitle } = await import(
      '@qwen-code/qwen-code-core'
    );
    vi.mocked(tryGenerateSessionTitle).mockResolvedValue({
      ok: true,
      title: 'Auto Generated Title',
      modelUsed: 'fast-model',
    });
    mockConfig.getFastModel.mockReturnValue('fast-model');
    const mockRecordingService = {
      recordCustomTitle: vi.fn().mockReturnValue(true),
    };
    mockConfig.getChatRecordingService.mockReturnValue(mockRecordingService);

    const result = (await renameCommand.action!(mockContext, '--auto')) as any;

    expect(tryGenerateSessionTitle).toHaveBeenCalled();
    expect(mockRecordingService.recordCustomTitle).toHaveBeenCalledWith(
      'Auto Generated Title',
      'auto',
    );
    expect(mockUi.setSessionName).toHaveBeenCalledWith('Auto Generated Title');
    expect(result.messageType).toBe('info');
    expect(result.content).toContain('Auto Generated Title');
  });

  it('fails --auto if no fast model is configured', async () => {
    mockConfig.getFastModel.mockReturnValue(undefined);

    const result = (await renameCommand.action!(mockContext, '--auto')) as any;

    expect(result.messageType).toBe('error');
    expect(result.content).toContain('requires a fast model');
  });

  describe('bare /rename model selection', () => {
    // Pins the kebab-case path's model choice: bare `/rename` (no args)
    // prefers fastModel when one is configured, falls back to the main
    // model otherwise. Previous tests mocked `getHistory: []` which bailed
    // before the model selection ran, leaving this regression-prone.
    function mockConfigForKebab(opts: { fastModel?: string; model?: string }): {
      config: unknown;
      generateText: ReturnType<typeof vi.fn>;
    } {
      const generateText = vi.fn().mockResolvedValue({
        text: 'fix-login-bug',
        usage: undefined,
      });
      const config = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: vi.fn().mockReturnValue(true),
        }),
        getFastModel: vi.fn().mockReturnValue(opts.fastModel),
        getModel: vi.fn().mockReturnValue(opts.model ?? 'main-model'),
        getGeminiClient: vi.fn().mockReturnValue({
          getHistory: vi.fn().mockReturnValue([
            { role: 'user', parts: [{ text: 'fix the login bug' }] },
            {
              role: 'model',
              parts: [{ text: 'Looking at the handler now.' }],
            },
          ]),
        }),
        getBaseLlmClient: vi.fn().mockReturnValue({ generateText }),
      };
      return { config, generateText };
    }

    it('uses fastModel when configured', async () => {
      const { config, generateText } = mockConfigForKebab({
        fastModel: 'qwen-turbo',
        model: 'main-model',
      });
      const kebabContext = createMockCommandContext({
        services: { config: config as any },
      });

      await renameCommand.action!(kebabContext, '');

      expect(generateText).toHaveBeenCalledOnce();
      expect(generateText.mock.calls[0][0].model).toBe('qwen-turbo');
    });

    it('falls back to main model when fastModel is unset', async () => {
      const { config, generateText } = mockConfigForKebab({
        fastModel: undefined,
        model: 'main-model',
      });
      const kebabContext = createMockCommandContext({
        services: { config: config as any },
      });

      await renameCommand.action!(kebabContext, '');

      expect(generateText).toHaveBeenCalledOnce();
      expect(generateText.mock.calls[0][0].model).toBe('main-model');
    });
  });

  it('supports -- separator for literal names starting with dashes', async () => {
    const mockRecordingService = {
      recordCustomTitle: vi.fn().mockReturnValue(true),
    };
    mockConfig.getChatRecordingService.mockReturnValue(mockRecordingService);

    // Should NOT treat --auto as a flag here
    const result = (await renameCommand.action!(
      mockContext,
      '-- --auto',
    )) as any;

    expect(mockRecordingService.recordCustomTitle).toHaveBeenCalledWith(
      '--auto',
      'manual',
    );
    expect(mockUi.setSessionName).toHaveBeenCalledWith('--auto');
    expect(result.messageType).toBe('info');
  });
});
