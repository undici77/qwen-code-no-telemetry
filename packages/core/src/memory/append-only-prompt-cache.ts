/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// No-telemetry fork patch — see NO_TELEMETRY_GUIDELINES.md §14 for why this
// exists and which upstream files it hooks into.

import type { Content } from '@google/genai';
import type { Config } from '../config/config.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { escapeSystemReminderTags } from '../utils/xml.js';

const debugLogger = createDebugLogger('APPEND_ONLY_MEMORY');

const APPEND_ONLY_ENV_VAR = 'QWEN_MEMORY_APPEND_ONLY';

/**
 * The auto-memory prompt already delivered to the model, per Config. Keyed
 * weakly so nothing here extends a session's lifetime, and kept out of
 * `Config` itself to keep this patch off upstream-owned state.
 */
const deliveredMemoryPrompt = new WeakMap<Config, string>();

/** Whether append-only memory delivery is active for this process. */
export function isAppendOnlyMemoryEnabled(): boolean {
  const raw = process.env[APPEND_ONLY_ENV_VAR]?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on';
}

function wrapReminder(body: string): string {
  return `<system-reminder>\n${escapeSystemReminderTags(body)}\n</system-reminder>`;
}

function significantLines(prompt: string): string[] {
  return prompt
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Line-level diff of two auto-memory prompts. The instructional boilerplate is
 * identical between rebuilds, so in practice only index entries survive here.
 * Returns null when nothing meaningful changed.
 */
function buildDeltaBody(previous: string, current: string): string | null {
  const before = new Set(significantLines(previous));
  const after = new Set(significantLines(current));
  const added = [...after].filter((line) => !before.has(line));
  const removed = [...before].filter((line) => !after.has(line));

  if (added.length === 0 && removed.length === 0) {
    return null;
  }

  const sections = [
    'Managed memory changed. The memory index earlier in this conversation is stale in exactly these lines:',
  ];
  if (added.length > 0) {
    sections.push(`Added:\n${added.join('\n')}`);
  }
  if (removed.length > 0) {
    sections.push(`Removed:\n${removed.join('\n')}`);
  }
  return sections.join('\n\n');
}

/**
 * The full memory section, for the startup reminder prelude. Returns null when
 * the mode is off or there is no memory section, so the caller drops the part.
 * Records what was delivered so later saves emit a delta against it.
 */
export function buildAutoMemoryReminder(config: Config): string | null {
  if (!isAppendOnlyMemoryEnabled()) {
    return null;
  }
  const prompt = config.getAutoMemoryPrompt();
  deliveredMemoryPrompt.set(config, prompt);
  return prompt.trim() ? wrapReminder(prompt) : null;
}

/**
 * Append-only counterpart of `refreshMemoryInstruction`: reload memory from
 * disk (so `/memory show`, `/context` and the next session stay accurate)
 * without rewriting the system prompt. Delivery is deferred to
 * `drainAutoMemoryDelta`, because this runs after a tool batch and before its
 * responses are submitted — appending here would split a tool call from its
 * result.
 */
export async function appendAutoMemoryDelta(
  config: Config,
  logContext?: string,
): Promise<void> {
  try {
    await config.refreshHierarchicalMemory();
  } catch (err) {
    const prefix = logContext ? `${logContext}: ` : '';
    debugLogger.warn(`${prefix}refreshHierarchicalMemory failed: ${err}`);
  }
}

/**
 * Deliver any memory change since the last delivery as one appended reminder.
 * Called at the start of a user query with no tool call pending, so the delta
 * lands right before the user's prompt.
 */
export function drainAutoMemoryDelta(
  config: Config,
  chat: { addHistory(content: Content): void },
): void {
  if (!isAppendOnlyMemoryEnabled()) {
    return;
  }
  const current = config.getAutoMemoryPrompt();
  const previous = deliveredMemoryPrompt.get(config);
  if (previous === undefined || previous === current) {
    // No prelude delivered yet (the next `getInitialChatHistory` carries the
    // full prompt), or nothing changed. Either way there is nothing to append.
    return;
  }

  const body = buildDeltaBody(previous, current);
  if (body) {
    chat.addHistory({
      role: 'user',
      parts: [{ text: wrapReminder(body) }],
    });
  }
  deliveredMemoryPrompt.set(config, current);
}

/** Test seam: drop the per-Config delivery record. */
export function resetAppendOnlyMemoryStateForTests(config: Config): void {
  deliveredMemoryPrompt.delete(config);
}
