/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { Config } from '../config/config.js';
import {
  ChatRecordingService,
  type ChatRecord,
} from './chatRecordingService.js';
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
    // writeLine is async; mockResolvedValue lets the writeChain settle on flush.
    vi.mocked(jsonl.writeLine).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should record custom title with manual source by default', async () => {
    recordingService = new ChatRecordingService(config);
    const ok = recordingService.recordCustomTitle('my-title');
    await recordingService.flush();

    expect(ok).toBe(true);
    expect(jsonl.writeLine).toHaveBeenCalledOnce();
    const record = vi.mocked(jsonl.writeLine).mock.calls[0][1] as any;
    expect(record.subtype).toBe('custom_title');
    expect(record.systemPayload).toEqual({
      customTitle: 'my-title',
      titleSource: 'manual',
    });
  });

  it('should allow recording custom title with auto source', async () => {
    recordingService = new ChatRecordingService(config);
    const ok = recordingService.recordCustomTitle('auto-title', 'auto');
    await recordingService.flush();

    expect(ok).toBe(true);
    const record = vi.mocked(jsonl.writeLine).mock.calls[0][1] as any;
    expect(record.systemPayload).toEqual({
      customTitle: 'auto-title',
      titleSource: 'auto',
    });
  });

  it('should maintain parent chain when recording title after other records', async () => {
    recordingService = new ChatRecordingService(config);
    recordingService.recordUserMessage([{ text: 'hello' } as any]);
    recordingService.recordCustomTitle('my-feature');
    await recordingService.flush();

    expect(jsonl.writeLine).toHaveBeenCalledTimes(2);

    const userRecord = vi.mocked(jsonl.writeLine).mock
      .calls[0][1] as ChatRecord;
    const titleRecord = vi.mocked(jsonl.writeLine).mock
      .calls[1][1] as ChatRecord;

    expect(titleRecord.parentUuid).toBe(userRecord.uuid);
  });

  it('should include correct metadata in the record', async () => {
    recordingService = new ChatRecordingService(config);
    recordingService.recordCustomTitle('test-title');
    await recordingService.flush();

    const writtenRecord = vi.mocked(jsonl.writeLine).mock
      .calls[0][1] as ChatRecord;

    expect(writtenRecord.cwd).toBe('/test/project');
    expect(writtenRecord.version).toBeDefined();
    expect(writtenRecord.uuid).toBeDefined();
    expect(writtenRecord.timestamp).toBeDefined();
  });

  it('should load persisted title and source on resume', async () => {
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
    await recordingService.flush();

    expect(recordingService.getCurrentCustomTitle()).toBe('Resumed Title');
    expect(recordingService.getCurrentTitleSource()).toBe('auto');

    // Verify it re-appends to EOF on resume (via finalize call in constructor)
    expect(jsonl.writeLine).toHaveBeenCalledOnce();
    const record = vi.mocked(jsonl.writeLine).mock.calls[0][1] as any;
    expect(record.systemPayload).toEqual({
      customTitle: 'Resumed Title',
      titleSource: 'auto',
    });
  });

  describe('finalize', () => {
    it('should re-append cached custom title to EOF', async () => {
      recordingService = new ChatRecordingService(config);
      recordingService.recordCustomTitle('my-feature');
      await recordingService.flush();
      vi.mocked(jsonl.writeLine).mockClear();

      recordingService.finalize();
      await recordingService.flush();

      expect(jsonl.writeLine).toHaveBeenCalledOnce();
      const record = vi.mocked(jsonl.writeLine).mock.calls[0][1] as ChatRecord;
      expect(record.type).toBe('system');
      expect(record.subtype).toBe('custom_title');
      expect(record.systemPayload).toEqual({
        customTitle: 'my-feature',
        titleSource: 'manual',
      });
    });

    it('should not write anything when no custom title was set', async () => {
      recordingService = new ChatRecordingService(config);
      recordingService.finalize();
      await recordingService.flush();

      expect(jsonl.writeLine).not.toHaveBeenCalled();
    });

    it('should re-append the latest title after multiple renames', async () => {
      recordingService = new ChatRecordingService(config);
      recordingService.recordCustomTitle('first-name');
      recordingService.recordCustomTitle('second-name');
      await recordingService.flush();
      vi.mocked(jsonl.writeLine).mockClear();

      recordingService.finalize();
      await recordingService.flush();

      expect(jsonl.writeLine).toHaveBeenCalledOnce();
      const record = vi.mocked(jsonl.writeLine).mock.calls[0][1] as ChatRecord;
      expect(record.systemPayload).toEqual({
        customTitle: 'second-name',
        titleSource: 'manual',
      });
    });
  });
});
