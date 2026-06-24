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

const { tryGenerateSessionTitleMock } = vi.hoisted(() => ({
  tryGenerateSessionTitleMock: vi.fn(),
}));

vi.mock('@qwen-code/qwen-code-core', async () => {
  const actual = await vi.importActual<
    typeof import('@qwen-code/qwen-code-core')
  >('@qwen-code/qwen-code-core');
  return {
    ...actual,
    tryGenerateSessionTitle: tryGenerateSessionTitleMock,
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

  it('exposes an argumentHint covering --auto and <name>', () => {
    expect(renameCommand.argumentHint).toBe('[--auto] [<name>]');
  });

  describe('completion', () => {
    const run = (partial: string) =>
      renameCommand.completion!(mockContext, partial);

    it('returns null when the partial argument is empty', async () => {
      expect(await run('')).toBeNull();
      expect(await run('   ')).toBeNull();
    });

    it('suggests --auto when the partial argument is a prefix of it', async () => {
      for (const partial of ['-', '--', '--a', '--au', '--auto']) {
        const result = await run(partial);
        expect(result).toEqual([
          {
            value: '--auto',
            description: expect.stringContaining('fast model'),
          },
        ]);
      }
    });

    it('returns null when the partial argument is a free-text name', async () => {
      expect(await run('my-feature')).toBeNull();
      expect(await run('fix bug')).toBeNull();
      expect(await run('-x')).toBeNull();
    });
  });

  it('should return error when config is not available', async () => {
    mockContext.services.config = null;

    const result = await renameCommand.action!(mockContext, 'my-feature');

    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content: 'Config is not available.',
    });
  });

  it('should return error when no name is provided and auto-generate fails', async () => {
    tryGenerateSessionTitleMock.mockResolvedValue({
      ok: false,
      reason: 'empty_history',
    });
    const mockConfig = {
      getChatRecordingService: vi.fn().mockReturnValue(undefined),
      getSessionId: vi.fn().mockReturnValue('test-session-id'),
      getSessionService: vi.fn().mockReturnValue({
        renameSession: vi.fn().mockResolvedValue(true),
      }),
    };
    mockContext = createMockCommandContext({
      services: { config: mockConfig as never },
    });

    const result = await renameCommand.action!(mockContext, '');

    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content:
        'No conversation to title yet — send at least one message first.',
    });
    expect(tryGenerateSessionTitleMock).toHaveBeenCalledOnce();
  });

  it('should return error when only whitespace is provided and auto-generate fails', async () => {
    tryGenerateSessionTitleMock.mockResolvedValue({
      ok: false,
      reason: 'empty_history',
    });
    const mockConfig = {
      getChatRecordingService: vi.fn().mockReturnValue(undefined),
      getSessionId: vi.fn().mockReturnValue('test-session-id'),
      getSessionService: vi.fn().mockReturnValue({
        renameSession: vi.fn().mockResolvedValue(true),
      }),
    };
    mockContext = createMockCommandContext({
      services: { config: mockConfig as never },
    });

    const result = await renameCommand.action!(mockContext, '   ');

    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content:
        'No conversation to title yet — send at least one message first.',
    });
  });

  it('should rename via ChatRecordingService when available', async () => {
    const mockRecordCustomTitle = vi.fn().mockReturnValue(true);
    const mockConfig = {
      getChatRecordingService: vi.fn().mockReturnValue({
        recordCustomTitle: mockRecordCustomTitle,
      }),
      getSessionId: vi.fn().mockReturnValue('test-session-id'),
      getSessionService: vi.fn().mockReturnValue({
        renameSession: vi.fn().mockResolvedValue(true),
      }),
    };

    mockContext = createMockCommandContext({
      services: { config: mockConfig as never },
      ui: mockUi as any,
    });

    const result = await renameCommand.action!(mockContext, 'my-feature');

    expect(mockRecordCustomTitle).toHaveBeenCalledWith('my-feature', 'manual');
    expect(result).toEqual({
      type: 'message',
      messageType: 'info',
      content: 'Session renamed to "my-feature"',
    });
  });

  it('should fall back to SessionService when ChatRecordingService is unavailable', async () => {
    const mockRenameSession = vi.fn().mockResolvedValue(true);
    const mockConfig = {
      getChatRecordingService: vi.fn().mockReturnValue(undefined),
      getSessionId: vi.fn().mockReturnValue('test-session-id'),
      getSessionService: vi.fn().mockReturnValue({
        renameSession: mockRenameSession,
      }),
    };

    mockContext = createMockCommandContext({
      services: { config: mockConfig as never },
      ui: mockUi as any,
    });

    await renameCommand.action!(mockContext, 'my-feature');

    expect(mockRenameSession).toHaveBeenCalledWith(
      'test-session-id',
      'my-feature',
      'manual',
    );
  });

  describe('bare /rename pipeline', () => {
    it('routes through tryGenerateSessionTitle on bare /rename', async () => {
      tryGenerateSessionTitleMock.mockResolvedValue({
        ok: true,
        title: 'Fix login bug',
        modelUsed: 'qwen-turbo',
      });
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: vi.fn().mockReturnValue(true),
        }),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
        ui: mockUi as any,
      });

      await renameCommand.action!(mockContext, '');

      expect(tryGenerateSessionTitleMock).toHaveBeenCalledOnce();
    });

    it('records bare /rename success as auto-sourced', async () => {
      tryGenerateSessionTitleMock.mockResolvedValue({
        ok: true,
        title: 'Refactor auth middleware',
        modelUsed: 'qwen-turbo',
      });
      const mockRecordCustomTitle = vi.fn().mockReturnValue(true);
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: mockRecordCustomTitle,
        }),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
        ui: mockUi as any,
      });

      await renameCommand.action!(mockContext, '');

      expect(mockRecordCustomTitle).toHaveBeenCalledWith(
        'Refactor auth middleware',
        'auto',
      );
    });

    it('surfaces no_fast_model on bare /rename when fast model is unset', async () => {
      tryGenerateSessionTitleMock.mockResolvedValue({
        ok: false,
        reason: 'no_fast_model',
      });
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: vi.fn(),
        }),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
      });

      const result = await renameCommand.action!(mockContext, '');

      expect(result).toMatchObject({ messageType: 'error' });
      expect((result as { content: string }).content).toMatch(
        /requires a fast model/,
      );
    });
  });

  describe('--auto flag', () => {
    it('surfaces no_fast_model on --auto via the shared pipeline', async () => {
      tryGenerateSessionTitleMock.mockResolvedValue({
        ok: false,
        reason: 'no_fast_model',
      });
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: vi.fn(),
        }),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
      });

      const result = await renameCommand.action!(mockContext, '--auto');

      expect(result).toMatchObject({ messageType: 'error' });
      expect((result as { content: string }).content).toMatch(
        /requires a fast model/,
      );
    });

    it('refuses --auto combined with a positional name', async () => {
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: vi.fn(),
        }),
        getFastModel: vi.fn().mockReturnValue('qwen-turbo'),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
      });

      const result = await renameCommand.action!(mockContext, '--auto my-name');

      expect(result).toEqual({
        type: 'message',
        messageType: 'error',
        content:
          '/rename --auto does not take a name. Use `/rename <name>` to set a name yourself.',
      });
      expect(tryGenerateSessionTitleMock).not.toHaveBeenCalled();
    });

    it('writes an auto-sourced title on --auto success', async () => {
      tryGenerateSessionTitleMock.mockResolvedValue({
        ok: true,
        title: 'Fix login button on mobile',
        modelUsed: 'qwen-turbo',
      });
      const mockRecordCustomTitle = vi.fn().mockReturnValue(true);
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: mockRecordCustomTitle,
        }),
        getFastModel: vi.fn().mockReturnValue('qwen-turbo'),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
        ui: mockUi as any,
      });

      const result = await renameCommand.action!(mockContext, '--auto');

      expect(tryGenerateSessionTitleMock).toHaveBeenCalledOnce();
      expect(mockRecordCustomTitle).toHaveBeenCalledWith(
        'Fix login button on mobile',
        'auto',
      );
      expect(result).toEqual({
        type: 'message',
        messageType: 'info',
        content: 'Session renamed to "Fix login button on mobile"',
      });
    });

    it('surfaces empty_history reason with actionable hint', async () => {
      tryGenerateSessionTitleMock.mockResolvedValue({
        ok: false,
        reason: 'empty_history',
      });
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: vi.fn(),
        }),
        getFastModel: vi.fn().mockReturnValue('qwen-turbo'),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
      });

      const result = await renameCommand.action!(mockContext, '--auto');

      expect(result).toEqual({
        type: 'message',
        messageType: 'error',
        content:
          'No conversation to title yet — send at least one message first.',
      });
    });

    it('surfaces model_error reason distinctly', async () => {
      tryGenerateSessionTitleMock.mockResolvedValue({
        ok: false,
        reason: 'model_error',
      });
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: vi.fn(),
        }),
        getFastModel: vi.fn().mockReturnValue('qwen-turbo'),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
      });

      const result = await renameCommand.action!(mockContext, '--auto');

      expect(result).toMatchObject({
        messageType: 'error',
      });
      expect((result as { content: string }).content).toMatch(
        /rate limit, auth, network error, or unexpected response format/,
      );
    });

    it('rejects unknown flag with sentinel hint', async () => {
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: vi.fn(),
        }),
        getFastModel: vi.fn().mockReturnValue('qwen-turbo'),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
      });

      const result = await renameCommand.action!(
        mockContext,
        '--my-label-with-dashes',
      );

      expect(result).toMatchObject({ messageType: 'error' });
      const content = (result as { content: string }).content;
      expect(content).toMatch(/Unknown flag "--my-label-with-dashes"/);
      expect(content).toMatch(/\/rename -- --my-label-with-dashes/);
      expect(tryGenerateSessionTitleMock).not.toHaveBeenCalled();
    });

    it('surfaces aborted reason when user cancels', async () => {
      tryGenerateSessionTitleMock.mockResolvedValue({
        ok: false,
        reason: 'aborted',
      });
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue({
          recordCustomTitle: vi.fn(),
        }),
        getFastModel: vi.fn().mockReturnValue('qwen-turbo'),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
      });

      const result = await renameCommand.action!(mockContext, '--auto');

      expect(result).toEqual({
        type: 'message',
        messageType: 'error',
        content: 'Title generation was cancelled.',
      });
    });

    it('falls back to SessionService.renameSession with auto source', async () => {
      tryGenerateSessionTitleMock.mockResolvedValue({
        ok: true,
        title: 'Audit auth middleware',
        modelUsed: 'qwen-turbo',
      });
      const mockRenameSession = vi.fn().mockResolvedValue(true);
      const mockConfig = {
        getChatRecordingService: vi.fn().mockReturnValue(undefined),
        getSessionId: vi.fn().mockReturnValue('test-session-id'),
        getSessionService: vi.fn().mockReturnValue({
          renameSession: mockRenameSession,
        }),
        getFastModel: vi.fn().mockReturnValue('qwen-turbo'),
      };
      mockContext = createMockCommandContext({
        services: { config: mockConfig as never },
        ui: mockUi as any,
      });

      await renameCommand.action!(mockContext, '--auto');

      expect(mockRenameSession).toHaveBeenCalledWith(
        'test-session-id',
        'Audit auth middleware',
        'auto',
      );
    });
  });
});
