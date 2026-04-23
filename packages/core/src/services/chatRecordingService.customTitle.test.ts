/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Config } from '../config/config.js';
import { ChatRecordingService } from './chatRecordingService.js';
import { SessionService } from './sessionService.js';
import * as jsonl from '../utils/jsonl-utils.js';

vi.mock('node:fs');
vi.mock('../utils/jsonl-utils.js');

describe('ChatRecordingService - custom title', () => {
  let config: Config;
  let recordingService: ChatRecordingService;
  let sessionService: SessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    config = new Config({
      targetDir: '/test/project',
      cwd: '/test/project',
      debugMode: false,
    });
     
    (config as any).sessionId = 'test-session-id';
     
    (config as any).projectRoot = '/test/project';

    sessionService = new SessionService('/test/project');
    vi.spyOn(config, 'getSessionService').mockReturnValue(sessionService);

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(jsonl.writeLineSync).mockImplementation(() => undefined);
  });

  it('should record custom title with manual source by default', () => {
    recordingService = new ChatRecordingService(config);
    const ok = recordingService.recordCustomTitle('my-title');

    expect(ok).toBe(true);
    expect(jsonl.writeLineSync).toHaveBeenCalledOnce();
    const record = vi.mocked(jsonl.writeLineSync).mock.calls[0][1] as any;
    expect(record.subtype).toBe('custom_title');
    expect(record.systemPayload).toEqual({
      customTitle: 'my-title',
      titleSource: 'manual',
    });
  });

  it('should allow recording custom title with auto source', () => {
    recordingService = new ChatRecordingService(config);
    const ok = recordingService.recordCustomTitle('auto-title', 'auto');

    expect(ok).toBe(true);
    const record = vi.mocked(jsonl.writeLineSync).mock.calls[0][1] as any;
    expect(record.systemPayload).toEqual({
      customTitle: 'auto-title',
      titleSource: 'auto',
    });
  });

  it('should load persisted title and source on resume', () => {
    vi.spyOn(config, 'getResumedSessionData').mockReturnValue({
      conversation: {
        sessionId: 'test-session-id',
        projectHash: 'hash',
        startTime: '2024-01-01',
        lastUpdated: '2024-01-01',
        messages: [],
      },
      filePath: '/path/to/chat.jsonl',
      lastCompletedUuid: 'last-uuid',
    });

    vi.spyOn(sessionService, 'getSessionTitleInfo').mockReturnValue({
      title: 'Resumed Title',
      source: 'auto',
    });

    recordingService = new ChatRecordingService(config);

    expect(recordingService.getCurrentCustomTitle()).toBe('Resumed Title');
    expect(recordingService.getCurrentTitleSource()).toBe('auto');

    // Verify it re-appends to EOF on resume (via finalize call in constructor)
    expect(jsonl.writeLineSync).toHaveBeenCalledOnce();
    const record = vi.mocked(jsonl.writeLineSync).mock.calls[0][1] as any;
    expect(record.systemPayload).toEqual({
      customTitle: 'Resumed Title',
      titleSource: 'auto',
    });
  });

  it('finalizes session by re-appending latest title and source', () => {
    recordingService = new ChatRecordingService(config);
    recordingService.recordCustomTitle('Final Title', 'manual');
    vi.mocked(jsonl.writeLineSync).mockClear();

    recordingService.finalize();

    expect(jsonl.writeLineSync).toHaveBeenCalledOnce();
    const record = vi.mocked(jsonl.writeLineSync).mock.calls[0][1] as any;
    expect(record.systemPayload).toEqual({
      customTitle: 'Final Title',
      titleSource: 'manual',
    });
  });
});
