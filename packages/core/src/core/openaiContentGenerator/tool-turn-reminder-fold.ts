/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// No-telemetry fork patch — see NO_TELEMETRY_GUIDELINES.md §14 ("Prefix-stable
// tool turns") for why this exists and which upstream file it hooks into.

import type { Part } from '@google/genai';
import type OpenAI from 'openai';
import {
  AUTO_MEMORY_SNAPSHOT_METADATA,
  SYSTEM_REMINDER_OPEN,
} from '../environmentContext.js';
import { isAppendOnlyMemoryEnabled } from '../../memory/append-only-prompt-cache.js';

function isInjectedContextPart(part: Part): boolean {
  if (part.partMetadata?.[AUTO_MEMORY_SNAPSHOT_METADATA] === true) return true;
  return part.text?.trimStart().startsWith(SYSTEM_REMINDER_OPEN) === true;
}

/**
 * Qwen/DeepSeek-style chat templates render `<think>` only for assistant
 * messages after the last user message, so a separate `role: "user"` message
 * after tool results re-renders every earlier step of the turn and breaks the
 * server's prefix cache. When every text part of a tool-result turn is
 * client-injected context, append it to the last tool message instead (the
 * Anthropic converter already merges it into the tool_result message).
 *
 * All-or-nothing: curated history can merge a real user prompt into the same
 * turn, and that must never be hidden inside a tool result.
 *
 * Returns true when the text was folded and the caller must not emit it.
 */
export function foldInjectedContextIntoToolMessage(
  parts: readonly Part[],
  contentParts: ReadonlyArray<{ type: string }>,
  lastToolMessage: OpenAI.Chat.ChatCompletionToolMessageParam | undefined,
  hasSplitMedia: boolean,
): boolean {
  if (!isAppendOnlyMemoryEnabled() || !lastToolMessage || hasSplitMedia) {
    return false;
  }
  if (
    contentParts.length === 0 ||
    contentParts.some((p) => p.type !== 'text')
  ) {
    return false;
  }
  const textParts = parts.filter((part) => part.text && !part.thought);
  if (
    textParts.length !== contentParts.length ||
    !textParts.every(isInjectedContextPart)
  ) {
    return false;
  }

  const texts = textParts.map((part) => part.text as string);
  if (typeof lastToolMessage.content === 'string') {
    lastToolMessage.content = [lastToolMessage.content, ...texts]
      .filter(Boolean)
      .join('\n\n');
  } else {
    lastToolMessage.content = [
      ...lastToolMessage.content,
      ...texts.map((text) => ({ type: 'text' as const, text })),
    ];
  }
  return true;
}
