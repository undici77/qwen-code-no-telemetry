/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { computeThresholds } from '@qwen-code/qwen-code-core';
import {
  buildForkStatusLineData,
  FORK_CONTEXT_ITEM_IDS,
  FORK_STATUS_LINE_ITEM_IDS,
  FORK_STATUS_LINE_ITEMS,
  formatForkStatusLineItem,
  resolveMainModelContext,
  type ForkStatusLineData,
} from './status-line-fork-items.js';
import {
  buildStatusLinePresetData,
  buildStatusLinePresetLines,
  formatTokenCount,
  type StatusLinePresetItemId,
} from './statusLinePresets.js';
import { StreamingState } from './types.js';

const WINDOW = 128_000;

/**
 * Exercises the item formatter with the real upstream token formatter, so the
 * expected strings below stay honest about what the footer actually renders.
 */
function format(
  item: Parameters<typeof formatForkStatusLineItem>[0],
  data: Parameters<typeof formatForkStatusLineItem>[1],
): string | undefined {
  return formatForkStatusLineItem(item, data, formatTokenCount);
}

const MAIN_MODEL = 'qwen3-coder';

function makeMetrics(
  models: Record<
    string,
    {
      prompt: number;
      cached: number;
      bySource?: Record<string, { prompt: number; cached: number }>;
    }
  >,
) {
  return {
    models: Object.fromEntries(
      Object.entries(models).map(([id, { bySource, ...tokens }]) => [
        id,
        {
          tokens,
          ...(bySource && {
            bySource: Object.fromEntries(
              Object.entries(bySource).map(([source, sourceTokens]) => [
                source,
                { tokens: sourceTokens },
              ]),
            ),
          }),
        },
      ]),
    ),
  };
}

function makeData(overrides: Partial<ForkStatusLineData> = {}) {
  return {
    contextWindowSize: WINDOW,
    currentUsage: 54_100,
    lastTurnCachedTokens: 49_800,
    sessionCachedTokens: 420_000,
    sessionPromptTokens: 480_000,
    tokensUntilAutoCompact: 18_200,
    ...overrides,
  } satisfies ForkStatusLineData;
}

describe('fork status line items', () => {
  describe('catalogue', () => {
    it('exposes an entry for every id', () => {
      expect(FORK_STATUS_LINE_ITEMS.map((item) => item.id)).toEqual([
        ...FORK_STATUS_LINE_ITEM_IDS,
      ]);
    });

    it('keeps every item opt-in', () => {
      for (const item of FORK_STATUS_LINE_ITEMS) {
        expect(item).not.toHaveProperty('defaultSelected');
      }
    });

    it('only lists known ids as context items', () => {
      for (const id of FORK_CONTEXT_ITEM_IDS) {
        expect(FORK_STATUS_LINE_ITEM_IDS).toContain(id);
      }
    });
  });

  describe('resolveMainModelContext', () => {
    const makeConfig = (opts: {
      mainModel?: string;
      mainWindow?: number;
      liveModel?: string;
      liveWindow?: number;
    }) => ({
      getModelsConfig: () => ({
        getGenerationConfig: () => ({
          model: opts.mainModel,
          contextWindowSize: opts.mainWindow,
        }),
      }),
      getContentGeneratorConfig: () => ({
        model: opts.liveModel,
        contextWindowSize: opts.liveWindow,
      }),
    });

    it('ignores an auxiliary model window leaked through the runtime view', () => {
      // The reported bug: a fast-model run pushes an AsyncLocalStorage view
      // carrying its own 128k window, which surfaced in the footer mid-turn.
      const { modelId, contextWindowSize } = resolveMainModelContext(
        makeConfig({
          mainModel: MAIN_MODEL,
          mainWindow: 262_144,
          liveModel: 'qwen3-fast',
          liveWindow: 128_000,
        }),
        MAIN_MODEL,
      );

      expect(modelId).toBe(MAIN_MODEL);
      expect(contextWindowSize).toBe(262_144);
    });

    it('stays on the main model even when the live config has no window', () => {
      expect(
        resolveMainModelContext(
          makeConfig({ mainModel: MAIN_MODEL, mainWindow: 262_144 }),
          MAIN_MODEL,
        ).contextWindowSize,
      ).toBe(262_144);
    });

    it('accepts the live window when it describes the main model', () => {
      expect(
        resolveMainModelContext(
          makeConfig({
            mainModel: MAIN_MODEL,
            liveModel: MAIN_MODEL,
            liveWindow: 262_144,
          }),
          MAIN_MODEL,
        ).contextWindowSize,
      ).toBe(262_144);
    });

    it('reports an unknown window rather than another model size', () => {
      // No main-model window recorded and the live one provably belongs to the
      // fast model. 0 means "unknown" and hides the item, which beats
      // fabricating a plausible-but-wrong number.
      const { contextWindowSize } = resolveMainModelContext(
        makeConfig({ liveModel: 'qwen3-fast', liveWindow: 128_000 }),
        MAIN_MODEL,
      );

      expect(contextWindowSize).toBe(0);
    });

    it('keeps a live window that does not name its model', () => {
      // Cannot be proven to come from an auxiliary run, and is usually right.
      expect(
        resolveMainModelContext(makeConfig({ liveWindow: 262_144 }), MAIN_MODEL)
          .contextWindowSize,
      ).toBe(262_144);
    });

    it('falls back to the generation config model when currentModel is empty', () => {
      expect(
        resolveMainModelContext(
          makeConfig({ mainModel: MAIN_MODEL, mainWindow: 262_144 }),
          undefined,
        ).modelId,
      ).toBe(MAIN_MODEL);
    });

    it('degrades to zero rather than throwing without a config', () => {
      expect(resolveMainModelContext(undefined, undefined)).toEqual({
        modelId: undefined,
        contextWindowSize: 0,
      });
    });
  });

  describe('buildForkStatusLineData', () => {
    const build = (
      overrides: Partial<Parameters<typeof buildForkStatusLineData>[0]> = {},
    ) =>
      buildForkStatusLineData({
        metrics: makeMetrics({}),
        modelId: MAIN_MODEL,
        contextWindowSize: WINDOW,
        currentUsage: 54_100,
        lastTurnCachedTokens: 49_800,
        ...overrides,
      });

    it('counts only the main model, ignoring auxiliary models', () => {
      const data = build({
        metrics: makeMetrics({
          [MAIN_MODEL]: { prompt: 480_000, cached: 420_000 },
          // Title generation / summarization on a cheaper model with its own
          // window — must not dilute the main conversation's hit rate.
          'qwen3-fast': { prompt: 120_000, cached: 0 },
        }),
      });

      expect(data.sessionPromptTokens).toBe(480_000);
      expect(data.sessionCachedTokens).toBe(420_000);
    });

    it('prefers the main-source bucket over subagent traffic', () => {
      const data = build({
        metrics: makeMetrics({
          [MAIN_MODEL]: {
            prompt: 900_000,
            cached: 500_000,
            bySource: {
              main: { prompt: 480_000, cached: 420_000 },
              researcher: { prompt: 420_000, cached: 80_000 },
            },
          },
        }),
      });

      expect(data.sessionPromptTokens).toBe(480_000);
      expect(data.sessionCachedTokens).toBe(420_000);
    });

    it('falls back to the model aggregate when no sources are recorded', () => {
      const data = build({
        metrics: makeMetrics({
          [MAIN_MODEL]: { prompt: 480_000, cached: 420_000 },
        }),
      });

      expect(data.sessionPromptTokens).toBe(480_000);
    });

    it('reports zeros when the main model has no traffic yet', () => {
      const data = build({
        metrics: makeMetrics({
          'qwen3-fast': { prompt: 120_000, cached: 90_000 },
        }),
      });

      expect(data.sessionPromptTokens).toBe(0);
      expect(data.sessionCachedTokens).toBe(0);
    });

    it('reports zeros when the model is unknown', () => {
      const data = build({
        modelId: undefined,
        metrics: makeMetrics({
          [MAIN_MODEL]: { prompt: 480_000, cached: 420_000 },
        }),
      });

      expect(data.sessionCachedTokens).toBe(0);
    });

    it('derives compaction headroom from the shared core thresholds', () => {
      expect(build({ currentUsage: 54_100 }).tokensUntilAutoCompact).toBe(
        computeThresholds(WINDOW).auto - 54_100,
      );
    });

    it('honors an auto-compact threshold override', () => {
      expect(
        build({ currentUsage: 0, autoCompactThreshold: 0.5 })
          .tokensUntilAutoCompact,
      ).toBe(computeThresholds(WINDOW, 0.5).auto);
    });

    it('leaves headroom undefined when the window is unknown', () => {
      expect(build({ contextWindowSize: 0 }).tokensUntilAutoCompact).toBe(
        undefined,
      );
    });
  });

  describe('context-tokens', () => {
    it('renders used over total', () => {
      expect(format('context-tokens', makeData())).toBe('54.1k/128.0k');
    });

    it('is hidden before the first request', () => {
      expect(
        format('context-tokens', makeData({ currentUsage: 0 })),
      ).toBeUndefined();
    });

    it('is hidden when the window is unknown', () => {
      expect(
        format('context-tokens', makeData({ contextWindowSize: 0 })),
      ).toBeUndefined();
    });
  });

  describe('cache-live', () => {
    it('reports the share of the last request served from cache', () => {
      expect(format('cache-live', makeData())).toBe('Cache 92% now');
    });

    it('reports a genuine cold turn once cache has been observed', () => {
      expect(format('cache-live', makeData({ lastTurnCachedTokens: 0 }))).toBe(
        'Cache 0% now',
      );
    });

    it('stays hidden while the provider has never reported cache usage', () => {
      expect(
        format(
          'cache-live',
          makeData({ sessionCachedTokens: 0, lastTurnCachedTokens: 0 }),
        ),
      ).toBeUndefined();
    });

    it('clamps a cache read larger than the prompt to 100%', () => {
      expect(
        format(
          'cache-live',
          makeData({ lastTurnCachedTokens: 60_000, currentUsage: 54_100 }),
        ),
      ).toBe('Cache 100% now');
    });
  });

  describe('cache-hit', () => {
    it('reports the session-wide hit rate', () => {
      expect(format('cache-hit', makeData())).toBe('Cache 88% avg');
    });

    it('stays hidden while the provider has never reported cache usage', () => {
      expect(
        format('cache-hit', makeData({ sessionCachedTokens: 0 })),
      ).toBeUndefined();
    });

    it('is hidden before any prompt tokens are recorded', () => {
      expect(
        format('cache-hit', makeData({ sessionPromptTokens: 0 })),
      ).toBeUndefined();
    });
  });

  describe('compact-in', () => {
    it('reports remaining headroom', () => {
      expect(format('compact-in', makeData())).toBe('Compact in 18.2k');
    });

    it('warns once the threshold is reached', () => {
      expect(
        format('compact-in', makeData({ tokensUntilAutoCompact: 0 })),
      ).toBe('Compact imminent');
    });

    it('warns once the threshold is passed', () => {
      expect(
        format('compact-in', makeData({ tokensUntilAutoCompact: -4_200 })),
      ).toBe('Compact imminent');
    });

    it('is hidden when the window is unknown', () => {
      expect(
        format('compact-in', makeData({ tokensUntilAutoCompact: undefined })),
      ).toBeUndefined();
    });

    it('is hidden before the first request', () => {
      expect(
        format('compact-in', makeData({ currentUsage: 0 })),
      ).toBeUndefined();
    });
  });

  it('omits every item when no fork data was collected', () => {
    for (const id of FORK_STATUS_LINE_ITEM_IDS) {
      expect(format(id, undefined)).toBeUndefined();
    }
  });

  // Proves the additive hooks in statusLinePresets.ts are wired: the ids
  // survive orderStatusLinePresetItems' allowlist, the fork data reaches
  // formatPresetItem, and the parts join into the rendered footer line.
  describe('integration with the upstream preset pipeline', () => {
    const renderLine = (items: StatusLinePresetItemId[], fork = makeData()) =>
      buildStatusLinePresetLines(
        { type: 'preset', items },
        buildStatusLinePresetData({
          sessionId: 'test-session',
          version: '1.0.0',
          modelDisplayName: 'Test Model',
          currentDir: '/repo/qwen-code-no-telemetry',
          branch: 'dev',
          contextWindowSize: WINDOW,
          currentUsage: fork.currentUsage,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalLinesAdded: 0,
          totalLinesRemoved: 0,
          streamingState: StreamingState.Idle,
          fork,
        }),
      );

    it('renders fork items alongside upstream ones', () => {
      expect(
        renderLine([
          'project-name',
          'git-branch',
          'context-tokens',
          'cache-live',
          'cache-hit',
          'compact-in',
        ]),
      ).toEqual([
        '➜ qwen-code-no-telemetry · git:(dev) · 54.1k/128.0k · ' +
          'Cache 92% now · Cache 88% avg · Compact in 18.2k',
      ]);
    });

    it('drops hidden fork items from the joined line', () => {
      expect(
        renderLine(['project-name', 'cache-live', 'compact-in'], {
          ...makeData(),
          sessionCachedTokens: 0,
        }),
      ).toEqual(['➜ qwen-code-no-telemetry · Compact in 18.2k']);
    });
  });
});
