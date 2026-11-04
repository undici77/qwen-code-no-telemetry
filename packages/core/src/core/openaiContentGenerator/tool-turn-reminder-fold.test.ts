/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Content, Part } from '@google/genai';
import type OpenAI from 'openai';
import type { Config } from '../../config/config.js';
import { OpenAIContentConverter } from './converter.js';
import type { RequestContext } from './types.js';
import { wrapSystemReminder } from '../environmentContext.js';
import { getAutoMemorySnapshot } from '../../memory/request-context.js';
import {
  buildAutoMemoryReminder,
  drainAutoMemoryDelta,
} from '../../memory/append-only-prompt-cache.js';

const ctx = (overrides: Partial<RequestContext> = {}): RequestContext => ({
  model: 'test-model',
  modalities: { image: true, pdf: true, audio: true, video: true },
  startTime: 0,
  ...overrides,
});

const convert = (contents: Content[], overrides?: Partial<RequestContext>) =>
  OpenAIContentConverter.convertLlmRequestToOpenAI(
    { model: 'models/test', contents },
    ctx(overrides),
  );

const call = (id: string): Part => ({
  functionCall: { id, name: 'write_file', args: { file_path: `${id}.md` } },
});
const result = (id: string): Part => ({
  functionResponse: {
    id,
    name: 'write_file',
    response: { output: `ok ${id}` },
  },
});
const modelStep = (id: string): Content => ({
  role: 'model',
  parts: [{ text: `thinking ${id}`, thought: true }, call(id)],
});

const snapshot = (catalog: string): Part => {
  const part = getAutoMemorySnapshot([], catalog);
  if (!part) throw new Error('expected a catalog snapshot part');
  return part;
};
const reminder: Part = { text: wrapSystemReminder('todo items remain') };

const toolText = (message: OpenAI.Chat.ChatCompletionMessageParam) =>
  typeof message.content === 'string'
    ? message.content
    : (message.content ?? [])
        .map((part) => ('text' in part ? part.text : ''))
        .join('\n\n');

const roles = (messages: OpenAI.Chat.ChatCompletionMessageParam[]) =>
  messages.map((m) => m.role);

describe('prefix-stable tool turns (§14)', () => {
  beforeEach(() => {
    process.env['QWEN_MEMORY_APPEND_ONLY'] = '1';
  });
  afterEach(() => {
    delete process.env['QWEN_MEMORY_APPEND_ONLY'];
  });

  it('leaves the wire unchanged when the mode is off', () => {
    delete process.env['QWEN_MEMORY_APPEND_ONLY'];
    const messages = convert([
      { role: 'user', parts: [{ text: 'q' }] },
      modelStep('a'),
      { role: 'user', parts: [result('a'), snapshot('- [A](a.md)')] },
    ]);
    expect(roles(messages)).toEqual(['user', 'assistant', 'tool', 'user']);
  });

  it('folds a catalog snapshot into the tool message', () => {
    const snap = snapshot('- [A](a.md)');
    const messages = convert([
      { role: 'user', parts: [{ text: 'q' }] },
      modelStep('a'),
      { role: 'user', parts: [result('a'), snap] },
    ]);
    expect(roles(messages)).toEqual(['user', 'assistant', 'tool']);
    expect(toolText(messages[2])).toBe(`ok a\n\n${snap.text}`);
  });

  it('folds system reminders into the last of several tool messages', () => {
    const messages = convert([
      { role: 'user', parts: [{ text: 'q' }] },
      { role: 'model', parts: [call('a'), call('b')] },
      { role: 'user', parts: [result('a'), result('b'), reminder] },
    ]);
    expect(roles(messages)).toEqual(['user', 'assistant', 'tool', 'tool']);
    expect(toolText(messages[2])).toBe('ok a');
    expect(toolText(messages[3])).toBe(`ok b\n\n${reminder.text}`);
  });

  it.each([
    [
      'parts',
      [
        { type: 'text', text: 'ok a' },
        { type: 'text', text: reminder.text },
      ],
    ],
    ['string', `ok a\n\n${reminder.text}`],
  ] as const)('folds into %s tool content', (format, expected) => {
    const messages = convert(
      [
        { role: 'user', parts: [{ text: 'q' }] },
        modelStep('a'),
        { role: 'user', parts: [result('a'), reminder] },
      ],
      { toolResultContentFormat: format },
    );
    expect(messages.at(-1)).toMatchObject({ role: 'tool', content: expected });
  });

  it('never folds a real user prompt merged into the tool turn', () => {
    const messages = convert([
      { role: 'user', parts: [{ text: 'q' }] },
      modelStep('a'),
      {
        role: 'user',
        parts: [result('a'), reminder, { text: 'actually stop' }],
      },
    ]);
    expect(roles(messages)).toEqual(['user', 'assistant', 'tool', 'user']);
    expect(toolText(messages[2])).toBe('ok a');
  });

  it('does not fold a user turn without tool results', () => {
    const messages = convert([
      { role: 'user', parts: [{ text: 'q' }, reminder] },
    ]);
    expect(roles(messages)).toEqual(['user']);
  });

  it('does not fold when tool media is split into a user message', () => {
    const messages = convert(
      [
        { role: 'user', parts: [{ text: 'q' }] },
        {
          role: 'model',
          parts: [{ functionCall: { id: 'img', name: 'read_file', args: {} } }],
        },
        {
          role: 'user',
          parts: [
            {
              functionResponse: {
                id: 'img',
                name: 'read_file',
                response: { output: 'image' },
                parts: [
                  { inlineData: { mimeType: 'image/png', data: 'AAAA' } },
                ],
              },
            },
            reminder,
          ],
        },
      ],
      { splitToolMedia: true },
    );
    expect(roles(messages).at(-1)).toBe('user');
    expect(JSON.stringify(messages.at(-1))).toContain('todo items remain');
  });

  it('keeps request N as an exact prefix of request N+1 across a memory write', () => {
    const history: Content[] = [
      { role: 'user', parts: [{ text: 'release and record findings' }] },
      modelStep('a'),
      { role: 'user', parts: [result('a'), snapshot('- [A](a.md)')] },
    ];
    const before = convert(history);
    const after = convert([
      ...history,
      modelStep('b'),
      {
        role: 'user',
        parts: [result('b'), snapshot('- [A](a.md)\n- [B](b.md)')],
      },
    ]);
    expect(after.slice(0, before.length)).toEqual(before);
    expect(roles(after).filter((r) => r === 'user')).toHaveLength(1);
    expect(convert(history)).toEqual(before);
  });

  it('accepts the §14 delta reminder as injected context', () => {
    let prompt = 'policy v1';
    const config = { getAutoMemoryPrompt: () => prompt } as unknown as Config;
    const delivered: Content[] = [];
    buildAutoMemoryReminder(config);
    prompt = 'policy v2';
    drainAutoMemoryDelta(config, { addHistory: (c) => delivered.push(c) });
    expect(delivered).toHaveLength(1);

    const messages = convert([
      { role: 'user', parts: [{ text: 'q' }] },
      modelStep('a'),
      { role: 'user', parts: [...delivered[0].parts!, result('a')] },
    ]);
    expect(roles(messages)).toEqual(['user', 'assistant', 'tool']);
  });
});
