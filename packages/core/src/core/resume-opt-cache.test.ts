/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import type { Content } from '@google/genai';
import { reuseResumedPreludeIfUnchanged } from './resume-opt-cache.js';

const wrap = (body: string) => `<system-reminder>\n${body}\n</system-reminder>`;

const TOLERATES = { toleratesTrailingDeferredToolsPart: true };
const NO_TOLERANCE = { toleratesTrailingDeferredToolsPart: false };

describe('reuseResumedPreludeIfUnchanged', () => {
  it('returns null when there is no extraHistory', () => {
    const getStartupContextLength = vi.fn();
    const result = reuseResumedPreludeIfUnchanged(
      undefined,
      [wrap('mcp')],
      TOLERATES,
      { getStartupContextLength },
    );
    expect(result).toBeNull();
    expect(getStartupContextLength).not.toHaveBeenCalled();
  });

  it('returns null when there are no fresh stable texts to compare', () => {
    const getStartupContextLength = vi.fn();
    const extraHistory: Content[] = [
      { role: 'user', parts: [{ text: wrap('old env') }] },
    ];
    const result = reuseResumedPreludeIfUnchanged(extraHistory, [], TOLERATES, {
      getStartupContextLength,
    });
    expect(result).toBeNull();
    expect(getStartupContextLength).not.toHaveBeenCalled();
  });

  it('returns null when extraHistory does not start with a delivered prelude', () => {
    const getStartupContextLength = vi.fn().mockReturnValue(0);
    const extraHistory: Content[] = [{ role: 'user', parts: [{ text: 'hi' }] }];
    const result = reuseResumedPreludeIfUnchanged(
      extraHistory,
      [wrap('env')],
      TOLERATES,
      { getStartupContextLength },
    );
    expect(result).toBeNull();
  });

  it('returns null for a legacy ack-pair prelude (length 2)', () => {
    const getStartupContextLength = vi.fn().mockReturnValue(2);
    const extraHistory: Content[] = [
      { role: 'user', parts: [{ text: 'env text' }] },
      { role: 'model', parts: [{ text: 'Got it. Thanks for the context!' }] },
    ];
    const result = reuseResumedPreludeIfUnchanged(
      extraHistory,
      [wrap('env text')],
      TOLERATES,
      { getStartupContextLength },
    );
    expect(result).toBeNull();
  });

  it('returns null when a stable text differs (a real change)', () => {
    const getStartupContextLength = vi.fn().mockReturnValue(1);
    const extraHistory: Content[] = [
      { role: 'user', parts: [{ text: wrap('old env') }] },
      { role: 'model', parts: [{ text: 'hi' }] },
    ];
    const result = reuseResumedPreludeIfUnchanged(
      extraHistory,
      [wrap('new env — something changed')],
      TOLERATES,
      { getStartupContextLength },
    );
    expect(result).toBeNull();
  });

  it('reuses extraHistory verbatim when stable texts match exactly (no deferred-tools part on either side)', () => {
    const getStartupContextLength = vi.fn().mockReturnValue(1);
    const existing: Content = {
      role: 'user',
      parts: [{ text: wrap('mcp') }, { text: wrap('skills') }],
    };
    const extraHistory: Content[] = [existing];
    const result = reuseResumedPreludeIfUnchanged(
      extraHistory,
      [wrap('mcp'), wrap('skills')],
      TOLERATES,
      { getStartupContextLength },
    );
    expect(result).toBe(extraHistory);
  });

  // This is the core regression this design fixes: a session that called
  // any deferred tool causes revealDeferredToolsReferencedInHistory to
  // shrink the deferred-tools reminder on every resume, so the ORIGINAL
  // session-start prelude (built before any reveal) always carries a
  // longer/different deferred-tools tail than a fresh rebuild would. That
  // must not block reuse of the stable parts.
  it('reuses extraHistory verbatim when only a trailing deferred-tools part differs (tolerated)', () => {
    const getStartupContextLength = vi.fn().mockReturnValue(1);
    const existing: Content = {
      role: 'user',
      parts: [
        { text: wrap('mcp') },
        { text: wrap('skills') },
        { text: wrap('full deferred-tools list from session start') },
      ],
    };
    const extraHistory: Content[] = [existing];
    const result = reuseResumedPreludeIfUnchanged(
      extraHistory,
      [wrap('mcp'), wrap('skills')],
      TOLERATES,
      { getStartupContextLength },
    );
    expect(result).toBe(extraHistory);
  });

  it('reuses extraHistory verbatim when the existing entry has no deferred-tools tail at all', () => {
    const getStartupContextLength = vi.fn().mockReturnValue(1);
    const existing: Content = {
      role: 'user',
      parts: [{ text: wrap('mcp') }, { text: wrap('skills') }],
    };
    const extraHistory: Content[] = [existing];
    const result = reuseResumedPreludeIfUnchanged(
      extraHistory,
      [wrap('mcp'), wrap('skills')],
      TOLERATES,
      { getStartupContextLength },
    );
    expect(result).toBe(extraHistory);
  });

  it('does NOT tolerate a trailing extra part when the caller never builds deferred-tools reminders', () => {
    const getStartupContextLength = vi.fn().mockReturnValue(1);
    const existing: Content = {
      role: 'user',
      parts: [
        { text: wrap('mcp') },
        { text: wrap('skills') },
        { text: wrap('unexpected extra part') },
      ],
    };
    const extraHistory: Content[] = [existing];
    const result = reuseResumedPreludeIfUnchanged(
      extraHistory,
      [wrap('mcp'), wrap('skills')],
      NO_TOLERANCE,
      { getStartupContextLength },
    );
    expect(result).toBeNull();
  });

  it('returns null when a stable text differs even though a trailing deferred-tools part is tolerated', () => {
    const getStartupContextLength = vi.fn().mockReturnValue(1);
    const existing: Content = {
      role: 'user',
      parts: [
        { text: wrap('old mcp') },
        { text: wrap('skills') },
        { text: wrap('deferred tools') },
      ],
    };
    const extraHistory: Content[] = [existing];
    const result = reuseResumedPreludeIfUnchanged(
      extraHistory,
      [wrap('new mcp — changed'), wrap('skills')],
      TOLERATES,
      { getStartupContextLength },
    );
    expect(result).toBeNull();
  });

  it('returns null when existing has two or more extra trailing parts', () => {
    const getStartupContextLength = vi.fn().mockReturnValue(1);
    const existing: Content = {
      role: 'user',
      parts: [
        { text: wrap('mcp') },
        { text: wrap('deferred tools') },
        { text: wrap('something else entirely') },
      ],
    };
    const extraHistory: Content[] = [existing];
    const result = reuseResumedPreludeIfUnchanged(
      extraHistory,
      [wrap('mcp')],
      TOLERATES,
      { getStartupContextLength },
    );
    expect(result).toBeNull();
  });
});
