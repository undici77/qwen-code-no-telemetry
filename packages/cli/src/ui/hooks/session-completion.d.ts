/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Suggestion } from '../components/SuggestionsDisplay.js';
/** Test-only: clear the module-level listing cache between cases. */
export declare function __resetSessionSuggestionCacheForTest(): void;
/**
 * Lists prior sessions for the current project as `@` completion suggestions.
 * Scope is enforced by SessionService (current project only). The disk listing
 * is cached per cwd for a short TTL (see {@link SESSION_LIST_CACHE_TTL_MS}) so
 * rapid keystrokes don't re-walk the chats directory; pattern filtering runs
 * fresh on the cached items. A listing failure yields an empty list so the
 * Sessions tab simply shows nothing rather than breaking file/MCP/extension
 * completion.
 *
 * @param nowMs Injected clock for the cache TTL (defaults to Date.now()).
 *   Exposed for deterministic tests.
 */
export declare function getSessionSuggestions(cwd: string, pattern: string, nowMs?: number): Promise<Suggestion[]>;
