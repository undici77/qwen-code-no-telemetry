/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renameCommand } from './renameCommand.js';
import { CommandKind } from './types.js';

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
  };

  const mockUi = {
    setPendingItem: vi.fn(),
    setSessionName: vi.fn(),
  };

  const mockContext = {
    services: { config: mockConfig },
    ui: mockUi,
    abortSignal: new AbortController().signal,
  };

  beforeEach(() => {
    vi.clearAllMocks();
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
      mockContext as any,
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
    const result = (await renameCommand.action!(
      mockContext as any,
      longName,
    )) as any;

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

    const result = (await renameCommand.action!(
      mockContext as any,
      '--auto',
    )) as any;

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

    const result = (await renameCommand.action!(
      mockContext as any,
      '--auto',
    )) as any;

    expect(result.messageType).toBe('error');
    expect(result.content).toContain('requires a fast model');
  });

  it('supports -- separator for literal names starting with dashes', async () => {
    const mockRecordingService = {
      recordCustomTitle: vi.fn().mockReturnValue(true),
    };
    mockConfig.getChatRecordingService.mockReturnValue(mockRecordingService);

    // Should NOT treat --auto as a flag here
    const result = (await renameCommand.action!(
      mockContext as any,
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
