/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// No-telemetry fork patch — see NO_TELEMETRY_GUIDELINES.md §1.5.
//
// This is the executable form of the WebSearch privacy guarantee. The old
// guarantee was a grep for the string "DashScope" in one file, which proved
// only that a word was absent. These tests intercept every outbound request
// and assert the host is serpapi.com — including when the config is loaded
// with upstream's DashScope model, base URL and API-key env var, which is
// the case the grep could not cover once upstream's resolver came back.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Config } from '../config/config.js';
import { ToolErrorType } from './tool-error.js';
import {
  WebSearchTool,
  evaluateWebSearchGate,
  serpApiToMarkdown,
} from './serpapi-web-search.js';

vi.mock('../utils/runtimeFetchOptions.js', () => ({
  preloadRuntimeFetchModule: vi.fn(async () => {}),
}));

interface ConfigOverrides {
  settings?: Record<string, unknown>;
}

function makeConfig(overrides: ConfigOverrides = {}): Config {
  return {
    getWebSearchSettings: () =>
      'settings' in overrides ? overrides.settings : undefined,
    getCliVersion: () => '0.0.0-test',
  } as unknown as Config;
}

function serpApiResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function searchParamsOf(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

const savedKey = process.env['SERPAPI_API_KEY'];

beforeEach(() => {
  delete process.env['SERPAPI_API_KEY'];
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (savedKey === undefined) delete process.env['SERPAPI_API_KEY'];
  else process.env['SERPAPI_API_KEY'] = savedKey;
});

async function runSearch(config: Config, query = 'qwen code') {
  const tool = new WebSearchTool(config);
  const invocation = tool.build({ query });
  return invocation.execute(new AbortController().signal);
}

describe('evaluateWebSearchGate', () => {
  it('stays off without a notice when nothing is configured', () => {
    const gate = evaluateWebSearchGate(makeConfig());
    expect(gate.ok).toBe(false);
    expect(gate.silent).toBe(true);
  });

  it('warns when the user explicitly enabled the tool but set no key', () => {
    const gate = evaluateWebSearchGate(
      makeConfig({ settings: { enabled: true } }),
    );
    expect(gate.ok).toBe(false);
    expect(gate.silent).toBeFalsy();
    expect(gate.ok || gate.notice).toMatch(/SerpApi API key/);
  });

  it('resolves a backend from tools.webSearch.apiKey', () => {
    const gate = evaluateWebSearchGate(
      makeConfig({ settings: { apiKey: 'serp-key' } }),
    );
    expect(gate.ok).toBe(true);
    if (gate.ok) {
      expect(gate.backend).toEqual({
        apiKey: 'serp-key',
        engine: 'google',
        hl: 'en',
        gl: 'us',
      });
    }
  });

  it('falls back to SERPAPI_API_KEY and lets settings win over env', () => {
    process.env['SERPAPI_API_KEY'] = 'env-key';
    const fromEnv = evaluateWebSearchGate(makeConfig());
    expect(fromEnv.ok && fromEnv.backend.apiKey).toBe('env-key');

    const fromSettings = evaluateWebSearchGate(
      makeConfig({ settings: { apiKey: 'settings-key' } }),
    );
    expect(fromSettings.ok && fromSettings.backend.apiKey).toBe('settings-key');
  });

  it('honours engine, hl and gl', () => {
    const gate = evaluateWebSearchGate(
      makeConfig({
        settings: { apiKey: 'k', engine: 'bing', hl: 'de', gl: 'de' },
      }),
    );
    expect(gate.ok && gate.backend).toMatchObject({
      engine: 'bing',
      hl: 'de',
      gl: 'de',
    });
  });

  it('cannot derive a backend from upstream DashScope settings', () => {
    // The regression this guards: upstream's resolver hands the gate a
    // DashScope model, base URL and apiKeyEnv. None of those may produce a
    // usable backend, because the fork has no DashScope backend at all.
    const gate = evaluateWebSearchGate(
      makeConfig({
        settings: {
          enabled: true,
          model: 'qwen3.6-plus',
          webExtractor: true,
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          apiKeyEnv: 'DASHSCOPE_API_KEY',
        },
      }),
    );
    expect(gate.ok).toBe(false);
    if (gate.ok) {
      expect(JSON.stringify(gate.backend)).not.toMatch(/dashscope/i);
    }
  });
});

describe('WebSearchTool.execute — outbound host', () => {
  it('sends the query to serpapi.com and nowhere else', async () => {
    const fetchMock = mockFetch(serpApiResponse({ organic_results: [] }));
    const config = makeConfig({ settings: { apiKey: 'serp-key' } });

    await runSearch(config, 'release notes');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new URL(url).origin).toBe('https://serpapi.com');
    expect(new URL(url).pathname).toBe('/search');
    expect(searchParamsOf(url).get('q')).toBe('release notes');
    expect(searchParamsOf(url).get('engine')).toBe('google');
    expect(searchParamsOf(url).get('hl')).toBe('en');
    expect(searchParamsOf(url).get('gl')).toBe('us');
    expect(init.headers).toMatchObject({ Accept: 'application/json' });
  });

  it('contacts only serpapi.com even when configured with DashScope values', async () => {
    // The §1.5 guarantee, enforced rather than grepped.
    const fetchMock = mockFetch(serpApiResponse({ organic_results: [] }));
    const config = makeConfig({
      settings: {
        enabled: true,
        model: 'qwen3.8-flash',
        webExtractor: true,
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKeyEnv: 'DASHSCOPE_API_KEY',
        apiKey: 'serp-key',
      },
    });

    await runSearch(config, 'privacy');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(new URL(url).host).toBe('serpapi.com');
    expect(url).not.toMatch(/dashscope|aliyuncs|bailian/i);
  });

  it('never echoes the API key back to the model or the terminal', async () => {
    mockFetch(
      serpApiResponse({
        organic_results: [{ position: 1, title: 'T', link: 'https://x.test' }],
      }),
    );
    const config = makeConfig({ settings: { apiKey: 'super-secret-key' } });

    const result = await runSearch(config);

    const serialised = JSON.stringify(result);
    expect(serialised).not.toContain('super-secret-key');
    expect(result.returnDisplay).toContain('Searched');
  });

  it('reports rate limiting distinctly from other backend failures', async () => {
    mockFetch(serpApiResponse({ error: 'Too Many Requests' }, 429));
    const config = makeConfig({ settings: { apiKey: 'k' } });

    const result = await runSearch(config);

    expect(result.error?.type).toBe(ToolErrorType.WEB_SEARCH_RATE_LIMITED);
  });

  it('surfaces a non-JSON response without crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>gateway</html>', { status: 502 })),
    );
    const config = makeConfig({ settings: { apiKey: 'k' } });

    const result = await runSearch(config);

    expect(result.error?.type).toBe(ToolErrorType.WEB_SEARCH_BACKEND_FAILED);
    expect(result.error?.message).toMatch(/non-JSON/);
  });

  it('surfaces a SerpApi-level error carried in a 200 body', async () => {
    mockFetch(serpApiResponse({ error: 'Invalid API key' }));
    const config = makeConfig({ settings: { apiKey: 'k' } });

    const result = await runSearch(config);

    expect(result.error?.message).toMatch(/Invalid API key/);
  });

  it('refuses to run when the gate has no key', async () => {
    const fetchMock = mockFetch(serpApiResponse({}));
    const result = await runSearch(makeConfig());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.error?.message).toMatch(/SerpApi API key/);
  });
});

describe('serpApiToMarkdown', () => {
  it('renders organic results as linked Markdown', () => {
    const md = serpApiToMarkdown(
      {
        organic_results: [
          {
            position: 1,
            title: 'Qwen Code',
            link: 'https://example.test/a',
            snippet: 'A terminal coding agent.',
          },
        ],
      },
      'qwen code',
    );
    expect(md).toContain('[Qwen Code](https://example.test/a)');
    expect(md).toContain('A terminal coding agent.');
  });

  it('renders answer box and knowledge graph sections', () => {
    const md = serpApiToMarkdown(
      {
        answer_box: { answer: '42', title: 'Meaning' },
        knowledge_graph: { title: 'Douglas Adams', type: 'Author' },
      },
      'meaning of life',
    );
    expect(md).toContain('Answer Box');
    expect(md).toContain('42');
    expect(md).toContain('Douglas Adams');
  });

  it('reports an empty result set instead of an empty payload', () => {
    const md = serpApiToMarkdown({}, 'nothing here');
    expect(md).toContain('No results found');
  });
});

describe('WebSearchTool schema and validation', () => {
  it('rejects queries shorter than two characters', () => {
    const tool = new WebSearchTool(makeConfig());
    // The schema's minLength fires first; validateToolParamValues is the
    // backstop. Both messages say the same thing.
    expect(() => tool.build({ query: 'a' })).toThrow(/2 characters/);
    expect(() => tool.build({ query: '   ' })).toThrow(/2 characters/);
  });

  it('describes the SerpApi backend to the model', () => {
    const tool = new WebSearchTool(makeConfig());
    expect(tool.schema.description).toMatch(/SerpApi/);
    expect(tool.schema.description).not.toMatch(/DashScope/);
  });
});
