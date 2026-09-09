/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// No-telemetry fork patch — see NO_TELEMETRY_GUIDELINES.md §1.5.
//
// `web-search.ts` is declared `merge=ours` in .gitattributes, so upstream's
// rewrite of it is discarded on every merge. That makes the seam itself the
// thing worth guarding: if the shim is ever "resolved" toward upstream, the
// fork silently loses its SerpApi backend and this is the test that says so.

import { describe, expect, it } from 'vitest';
import * as shim from './web-search.js';
import * as serpapiBackend from './serpapi-web-search.js';

describe('web-search shim', () => {
  it('re-exports the SerpApi backend, not an upstream implementation', () => {
    expect(shim.WebSearchTool).toBe(serpapiBackend.WebSearchTool);
    expect(shim.evaluateWebSearchGate).toBe(
      serpapiBackend.evaluateWebSearchGate,
    );
    expect(shim.serpApiToMarkdown).toBe(serpapiBackend.serpApiToMarkdown);
  });

  it('exports every name upstream consumers import', () => {
    // config/config.ts registers through these two at runtime; index.ts
    // re-exports the types. A shim that drops one breaks startup.
    expect(typeof shim.WebSearchTool).toBe('function');
    expect(typeof shim.evaluateWebSearchGate).toBe('function');
  });

  it('exposes no upstream backend symbol that could reach another host', () => {
    // Upstream's own module declares these; the fork must not resurrect them.
    expect(shim).not.toHaveProperty('DEFAULT_WEB_SEARCH_MODEL');
    expect(Object.keys(shim).join(' ')).not.toMatch(/dashscope/i);
  });
});
