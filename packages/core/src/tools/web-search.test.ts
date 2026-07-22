/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Config } from '../config/config.js';
import { ToolErrorType } from './tool-error.js';
import {
  WebSearchTool,
  evaluateWebSearchGate,
  serpApiToMarkdown,
} from './web-search.js';

function makeConfig(
  overrides: {
    enabled?: boolean;
    apiKey?: string;
    engine?: string;
    hl?: string;
    gl?: string;
  } = {},
): Config {
  return {
    getWebSearchSettings: () => ({
      enabled: overrides.enabled ?? true,
      apiKey: overrides.apiKey,
      engine: overrides.engine,
      hl: overrides.hl,
      gl: overrides.gl,
    }),
    getSessionId: () => 'session-1',
    getCliVersion: () => '0.0.0-test',
    getProxy: () => undefined,
    getModel: () => 'main-model',
    getContentGeneratorConfig: () => ({ authType: 'openai' }),
    getFastModel: () => undefined,
  } as unknown as Config;
}

// Sample SerpApi JSON response for "coffee"
const SAMPLE_SERPAPI_RESPONSE = {
  search_metadata: {
    id: 'test-id',
    status: 'Success',
    created_at: '2025-01-01T00:00:00Z',
    processed_at: '2025-01-01T00:00:01Z',
    total_time_taken: 1.2,
  },
  search_parameters: {
    engine: 'google',
    q: 'coffee',
    hl: 'en',
    gl: 'us',
  },
  search_information: {
    query_displayed: 'coffee',
    total_results: 1_250_000_000,
    time_taken_displayed: 0.85,
  },
  answer_box: {
    answer: 'Coffee is a brewed drink prepared from roasted coffee beans.',
    title: 'Coffee - Wikipedia',
    link: 'https://en.wikipedia.org/wiki/Coffee',
    source: { name: 'Wikipedia' },
  },
  knowledge_graph: {
    title: 'Coffee',
    type: 'Beverage',
    description: 'Coffee is a beverage brewed from roasted coffee beans.',
    attributes: {
      Caffeine: 'Yes',
      Origin: 'Ethiopia',
      'Serving temperature': 'Hot or cold',
    },
    source: { name: 'Wikipedia', link: 'https://en.wikipedia.org/wiki/Coffee' },
  },
  organic_results: [
    {
      position: 1,
      title: 'Coffee - Wikipedia',
      link: 'https://en.wikipedia.org/wiki/Coffee',
      displayed_link: 'en.wikipedia.org › wiki › Coffee',
      snippet: 'Coffee is a brewed drink prepared from roasted coffee beans.',
      sitelinks: {
        expanded: [
          {
            title: 'History',
            link: 'https://en.wikipedia.org/wiki/History_of_coffee',
          },
        ],
      },
    },
    {
      position: 2,
      title: 'Starbucks Coffee Company',
      link: 'https://www.starbucks.com/',
      displayed_link: 'www.starbucks.com',
      snippet:
        'More than just great coffee. Explore the menu, sign up for Starbucks® Rewards, manage your gift card and more.',
    },
  ],
  related_questions: [
    {
      question: 'Is coffee good for health?',
      answer:
        'Moderate coffee consumption is linked to several health benefits.',
      source: {
        name: 'Healthline',
        link: 'https://www.healthline.com/nutrition/top-13-evidence-based-health-benefits-of-coffee',
      },
    },
  ],
  top_stories: [
    {
      title: 'New Study Shows Coffee May Improve Memory',
      link: 'https://example.com/coffee-memory',
      source: 'Science Daily',
      date: '2 hours ago',
      snippet:
        'Researchers found that regular coffee consumption may help improve memory function.',
    },
  ],
};

describe('evaluateWebSearchGate', () => {
  beforeEach(() => {
    process.env['SERPAPI_API_KEY'] = 'sk-test-env';
  });

  afterEach(() => {
    delete process.env['SERPAPI_API_KEY'];
  });

  it('passes with a configured API key in settings', () => {
    const gate = evaluateWebSearchGate(makeConfig({ apiKey: 'sk-settings' }));
    expect(gate.ok).toBe(true);
    if (gate.ok) {
      expect(gate.backend.apiKey).toBe('sk-settings');
      expect(gate.backend.engine).toBe('google');
      expect(gate.backend.hl).toBe('en');
      expect(gate.backend.gl).toBe('us');
    }
  });

  it('falls back to SERPAPI_API_KEY env var when settings have no apiKey', () => {
    const gate = evaluateWebSearchGate(makeConfig());
    expect(gate.ok).toBe(true);
    if (gate.ok) {
      expect(gate.backend.apiKey).toBe('sk-test-env');
    }
  });

  it('settings apiKey takes precedence over env var', () => {
    const gate = evaluateWebSearchGate(makeConfig({ apiKey: 'sk-settings' }));
    expect(gate.ok).toBe(true);
    if (gate.ok) {
      expect(gate.backend.apiKey).toBe('sk-settings');
    }
  });

  it('rejects when web search is not enabled', () => {
    const gate = evaluateWebSearchGate(makeConfig({ enabled: false }));
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.notice).toContain('not enabled');
  });

  it('rejects when no API key is available', () => {
    delete process.env['SERPAPI_API_KEY'];
    const gate = evaluateWebSearchGate(makeConfig());
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.notice).toContain('SERPAPI_API_KEY');
  });

  it('rejects a whitespace-only apiKey in settings', () => {
    delete process.env['SERPAPI_API_KEY'];
    const gate = evaluateWebSearchGate(makeConfig({ apiKey: '   ' }));
    expect(gate.ok).toBe(false);
  });

  it('honors custom engine, hl, and gl', () => {
    const gate = evaluateWebSearchGate(
      makeConfig({
        apiKey: 'sk-test',
        engine: 'bing',
        hl: 'zh',
        gl: 'cn',
      }),
    );
    expect(gate.ok).toBe(true);
    if (gate.ok) {
      expect(gate.backend.engine).toBe('bing');
      expect(gate.backend.hl).toBe('zh');
      expect(gate.backend.gl).toBe('cn');
    }
  });
});

describe('serpApiToMarkdown', () => {
  it('produces a header with query, engine, language, country, and result count', () => {
    const md = serpApiToMarkdown(SAMPLE_SERPAPI_RESPONSE, 'coffee');
    expect(md).toContain('Web Search Results');
    expect(md).toContain('"coffee"');
    expect(md).toContain('google');
    expect(md).toContain('en');
    expect(md).toContain('us');
    expect(md).toContain('1,250,000,000');
  });

  it('includes the answer box section', () => {
    const md = serpApiToMarkdown(SAMPLE_SERPAPI_RESPONSE, 'coffee');
    expect(md).toContain('Answer Box');
    expect(md).toContain(
      'Coffee is a brewed drink prepared from roasted coffee beans.',
    );
    expect(md).toContain(
      '[Coffee - Wikipedia](https://en.wikipedia.org/wiki/Coffee)',
    );
  });

  it('includes the knowledge graph section', () => {
    const md = serpApiToMarkdown(SAMPLE_SERPAPI_RESPONSE, 'coffee');
    expect(md).toContain('Knowledge Graph');
    expect(md).toContain('Coffee');
    expect(md).toContain('Beverage');
    expect(md).toContain('Caffeine');
    expect(md).toContain('Ethiopia');
  });

  it('includes organic results with position, title, link, and snippet', () => {
    const md = serpApiToMarkdown(SAMPLE_SERPAPI_RESPONSE, 'coffee');
    expect(md).toContain('Organic Results');
    expect(md).toContain(
      '1. [Coffee - Wikipedia](https://en.wikipedia.org/wiki/Coffee)',
    );
    expect(md).toContain('en.wikipedia.org › wiki › Coffee');
    expect(md).toContain(
      'Coffee is a brewed drink prepared from roasted coffee beans.',
    );
    expect(md).toContain(
      '2. [Starbucks Coffee Company](https://www.starbucks.com/)',
    );
  });

  it('includes sitelinks in organic results', () => {
    const md = serpApiToMarkdown(SAMPLE_SERPAPI_RESPONSE, 'coffee');
    expect(md).toContain(
      '[History](https://en.wikipedia.org/wiki/History_of_coffee)',
    );
  });

  it('includes related questions', () => {
    const md = serpApiToMarkdown(SAMPLE_SERPAPI_RESPONSE, 'coffee');
    expect(md).toContain('Related Questions');
    expect(md).toContain('Is coffee good for health?');
    expect(md).toContain('Moderate coffee consumption');
  });

  it('includes top stories', () => {
    const md = serpApiToMarkdown(SAMPLE_SERPAPI_RESPONSE, 'coffee');
    expect(md).toContain('Top Stories');
    expect(md).toContain('New Study Shows Coffee May Improve Memory');
    expect(md).toContain('Science Daily');
    expect(md).toContain('2 hours ago');
  });

  it('returns error section when response has an error field', () => {
    const md = serpApiToMarkdown({ error: 'Invalid API key' }, 'test');
    expect(md).toContain('API Error');
    expect(md).toContain('Invalid API key');
  });

  it('shows no results message when response has no data sections', () => {
    const md = serpApiToMarkdown(
      { search_parameters: { q: 'nothing' } },
      'nothing',
    );
    expect(md).toContain('No results found');
  });

  it('handles answer_box as an array', () => {
    const md = serpApiToMarkdown(
      {
        search_parameters: { q: 'test' },
        answer_box: [
          {
            answer: 'First answer',
            title: 'Source 1',
            link: 'https://example.com/1',
          },
          {
            answer: 'Second answer',
            title: 'Source 2',
            link: 'https://example.com/2',
          },
        ],
      },
      'test',
    );
    expect(md).toContain('First answer');
    expect(md).toContain('Second answer');
  });

  it('includes shopping results when present', () => {
    const md = serpApiToMarkdown(
      {
        search_parameters: { q: 'laptop' },
        shopping_results: [
          {
            title: 'Laptop Pro',
            price: '$1,299',
            link: 'https://example.com/laptop',
            rating: 4.5,
            reviews: 123,
          },
        ],
      },
      'laptop',
    );
    expect(md).toContain('Shopping Results');
    expect(md).toContain('Laptop Pro');
    expect(md).toContain('$1,299');
    expect(md).toContain('4.5');
  });

  it('includes local results when present', () => {
    const md = serpApiToMarkdown(
      {
        search_parameters: { q: 'pizza near me' },
        local_results: [
          {
            title: 'Pizza Place',
            rating: 4.2,
            reviews: 200,
            address: '123 Main St',
            phone: '555-0100',
          },
        ],
      },
      'pizza near me',
    );
    expect(md).toContain('Local Results');
    expect(md).toContain('Pizza Place');
    expect(md).toContain('123 Main St');
    expect(md).toContain('555-0100');
  });

  it('includes job results when present', () => {
    const md = serpApiToMarkdown(
      {
        search_parameters: { q: 'software engineer jobs' },
        jobs: [
          {
            title: 'Software Engineer',
            company_name: 'Tech Co',
            location: 'San Francisco, CA',
            description: 'Build great software.',
          },
        ],
      },
      'software engineer jobs',
    );
    expect(md).toContain('Jobs');
    expect(md).toContain('Software Engineer');
    expect(md).toContain('Tech Co');
  });

  it('includes recipe results when present', () => {
    const md = serpApiToMarkdown(
      {
        search_parameters: { q: 'chocolate cake recipe' },
        recipes_results: [
          {
            title: 'Best Chocolate Cake',
            link: 'https://example.com/cake',
            rating: 4.8,
            reviews: 500,
            ingredients: ['flour', 'sugar', 'cocoa'],
          },
        ],
      },
      'chocolate cake recipe',
    );
    expect(md).toContain('Recipes');
    expect(md).toContain('Best Chocolate Cake');
    expect(md).toContain('flour, sugar, cocoa');
  });

  it('includes sports results as JSON when present', () => {
    const md = serpApiToMarkdown(
      {
        search_parameters: { q: 'nfl scores' },
        sports_results: { game: 'Team A vs Team B', score: '24-21' },
      },
      'nfl scores',
    );
    expect(md).toContain('Sports Results');
    expect(md).toContain('Team A vs Team B');
  });

  it('includes inline images when present', () => {
    const md = serpApiToMarkdown(
      {
        search_parameters: { q: 'sunset' },
        inline_images: [
          {
            title: 'Beautiful Sunset',
            link: 'https://example.com/sunset',
            source: 'Pexels',
            original: 'https://example.com/sunset.jpg',
          },
        ],
      },
      'sunset',
    );
    expect(md).toContain('Images');
    expect(md).toContain('Beautiful Sunset');
    expect(md).toContain('![Image](https://example.com/sunset.jpg)');
  });

  it('includes inline videos when present', () => {
    const md = serpApiToMarkdown(
      {
        search_parameters: { q: 'tutorial' },
        inline_videos: [
          {
            title: 'How to Code',
            link: 'https://example.com/video',
            source: 'YouTube',
            channel: 'CodeChannel',
            duration: '10:30',
          },
        ],
      },
      'tutorial',
    );
    expect(md).toContain('Videos');
    expect(md).toContain('How to Code');
    expect(md).toContain('CodeChannel');
    expect(md).toContain('10:30');
  });

  it('includes Twitter results when present', () => {
    const md = serpApiToMarkdown(
      {
        search_parameters: { q: 'news' },
        twitter_results: [
          {
            author: 'NewsBot',
            tweet: 'Breaking news!',
            date: '1 hour ago',
            link: 'https://x.com/newsbot/status/1',
          },
        ],
      },
      'news',
    );
    expect(md).toContain('Twitter / X Results');
    expect(md).toContain('NewsBot');
    expect(md).toContain('Breaking news!');
  });
});

describe('WebSearchTool validation', () => {
  it('rejects a query shorter than 2 characters', () => {
    const tool = new WebSearchTool(makeConfig());
    expect(() => tool.build({ query: 'a' })).toThrow(
      /fewer than 2 characters|at least 2 characters/,
    );
  });

  it('rejects a whitespace-only query', () => {
    const tool = new WebSearchTool(makeConfig());
    expect(() => tool.build({ query: '   ' })).toThrow(/at least 2 characters/);
  });
});

describe('WebSearchTool confirmation', () => {
  it('asks by default and shows the query', async () => {
    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'test query' });
    expect(await invocation.getDefaultPermission()).toBe('ask');
    const details = await invocation.getConfirmationDetails(
      new AbortController().signal,
    );
    expect(details && details.type).toBe('info');
    if (details && details.type === 'info') {
      expect(details.prompt).toContain('test query');
      expect(details.permissionRules).toEqual(['WebSearch']);
    }
  });
});

describe('WebSearchTool execute', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    process.env['SERPAPI_API_KEY'] = 'sk-test';
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env['SERPAPI_API_KEY'];
  });

  it('returns a structured Markdown result from a successful search', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => SAMPLE_SERPAPI_RESPONSE,
    });

    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'coffee' });
    const result = await invocation.execute(new AbortController().signal);

    expect(result.error).toBeUndefined();
    const content = result.llmContent as string;
    expect(content).toContain('Web Search Results');
    expect(content).toContain('"coffee"');
    expect(content).toContain('Answer Box');
    expect(content).toContain('Organic Results');
    expect(content).toContain(
      '1. [Coffee - Wikipedia](https://en.wikipedia.org/wiki/Coffee)',
    );
    expect(content).toContain('Knowledge Graph');
    expect(result.returnDisplay).toContain('2 results');
  });

  it('passes the correct SerpApi URL parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => SAMPLE_SERPAPI_RESPONSE,
    });

    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'test query' });
    await invocation.execute(new AbortController().signal);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('https://serpapi.com/search');
    expect(url).toContain('q=test+query');
    expect(url).toContain('engine=google');
    expect(url).toContain('hl=en');
    expect(url).toContain('gl=us');
    expect(url).toContain('api_key=sk-test');
  });

  it('returns an error on HTTP 429 (rate limited)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded' }),
    });

    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'test' });
    const result = await invocation.execute(new AbortController().signal);

    expect(result.error?.type).toBe(ToolErrorType.WEB_SEARCH_RATE_LIMITED);
    expect(result.error?.message).toContain('rate limited');
  });

  it('returns an error on HTTP 400', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid parameter' }),
    });

    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'test' });
    const result = await invocation.execute(new AbortController().signal);

    expect(result.error?.type).toBe(ToolErrorType.WEB_SEARCH_BACKEND_FAILED);
    expect(result.error?.message).toContain('Invalid parameter');
  });

  it('returns an error when SerpApi returns an error field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ error: 'Invalid API key' }),
    });

    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'test' });
    const result = await invocation.execute(new AbortController().signal);

    expect(result.error?.type).toBe(ToolErrorType.WEB_SEARCH_BACKEND_FAILED);
    expect(result.error?.message).toContain('Invalid API key');
  });

  it('returns an error when the gate check fails at runtime', async () => {
    delete process.env['SERPAPI_API_KEY'];
    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'test' });
    const result = await invocation.execute(new AbortController().signal);

    expect(result.error?.type).toBe(ToolErrorType.WEB_SEARCH_BACKEND_FAILED);
    expect(result.error?.message).toContain('SERPAPI_API_KEY');
  });

  it('returns an error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ENOTFOUND serpapi.com'));

    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'test' });
    const result = await invocation.execute(new AbortController().signal);

    expect(result.error?.type).toBe(ToolErrorType.WEB_SEARCH_BACKEND_FAILED);
    expect(result.error?.message).toContain('ENOTFOUND');
  });

  it('returns an error on non-JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => '<html>Bad Gateway</html>',
      json: async () => {
        throw new Error('not JSON');
      },
    });

    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'test' });
    const result = await invocation.execute(new AbortController().signal);

    expect(result.error?.type).toBe(ToolErrorType.WEB_SEARCH_BACKEND_FAILED);
    expect(result.llmContent).toContain('non-JSON');
  });

  it('respects custom engine, hl, and gl from settings', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => SAMPLE_SERPAPI_RESPONSE,
    });

    const tool = new WebSearchTool(
      makeConfig({
        apiKey: 'sk-test',
        engine: 'bing',
        hl: 'zh',
        gl: 'cn',
      }),
    );
    const invocation = tool.build({ query: 'test' });
    await invocation.execute(new AbortController().signal);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('engine=bing');
    expect(url).toContain('hl=zh');
    expect(url).toContain('gl=cn');
  });

  it('truncates output that exceeds MAX_RESULT_SIZE_CHARS', async () => {
    const hugeResponse = {
      search_parameters: { q: 'test' },
      organic_results: Array.from({ length: 1000 }, (_, i) => ({
        position: i + 1,
        title: 'x'.repeat(500),
        link: `https://example.com/${i}`,
        snippet: 'y'.repeat(500),
      })),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => hugeResponse,
    });

    const tool = new WebSearchTool(makeConfig());
    const invocation = tool.build({ query: 'test' });
    const result = await invocation.execute(new AbortController().signal);

    expect(result.error).toBeUndefined();
    const content = result.llmContent as string;
    expect(content.length).toBeLessThanOrEqual(102_000);
    expect(content).toContain('truncated');
  });
});
