/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

// No-telemetry fork patch — see NO_TELEMETRY_GUIDELINES.md §15 for why this
// exists and which upstream files it hooks into.
//
// Owns every status-line item that reports prompt-cache state and precise
// context size. Upstream `statusLinePresets.ts` / `useStatusLine.ts` carry only
// additive one-line hooks, so an upstream rewrite of either file can be taken
// wholesale and the hooks re-applied on top.

import {
  computeThresholds,
  MAIN_SOURCE,
  uiTelemetryService,
} from '@qwen-code/qwen-code-core';

/**
 * Token formatter, injected by the caller rather than imported.
 *
 * `statusLinePresets.ts` imports this module to build its item catalogue, so
 * importing its `formatTokenCount` back would form a module cycle that fails at
 * initialization. Injection keeps one implementation of the format and leaves
 * this module free of upstream imports.
 */
export type TokenFormatter = (value: number) => string;

/**
 * Fork-owned preset item ids, appended to the upstream catalogue.
 *
 * Order matters: the upstream `STATUS_LINE_PRESET_ITEM_IDS` array doubles as
 * the render order, and these are spread onto its end, so fork items always
 * render after upstream ones regardless of how the user orders `items`.
 */
export const FORK_STATUS_LINE_ITEM_IDS = [
  'context-tokens',
  'cache-live',
  'cache-hit',
  'compact-in',
] as const;

export type ForkStatusLineItemId = (typeof FORK_STATUS_LINE_ITEM_IDS)[number];

/**
 * Fork items that render context usage. Spread into the upstream
 * `CONTEXT_PRESET_ITEM_IDS` set so the built-in footer indicator auto-hides
 * when one of them is active, matching how `context-used` behaves.
 */
export const FORK_CONTEXT_ITEM_IDS = ['context-tokens'] as const;

/**
 * Catalogue entries. Structurally compatible with upstream's
 * `StatusLinePresetItem` but declared locally so this module never depends on
 * an upstream type that a merge could reshape.
 *
 * None sets `defaultSelected`: every fork item is opt-in, so a user who does
 * not list it sees byte-identical upstream behavior.
 */
export interface ForkStatusLineItem {
  id: ForkStatusLineItemId;
  label: string;
  description: string;
}

export const FORK_STATUS_LINE_ITEMS: readonly ForkStatusLineItem[] = [
  {
    id: 'context-tokens',
    label: 'context-tokens',
    description: 'Exact context tokens used over the window size',
  },
  {
    id: 'cache-live',
    label: 'cache-live',
    description: 'Share of the last request served from the prompt cache',
  },
  {
    id: 'cache-hit',
    label: 'cache-hit',
    description: 'Session-wide prompt cache hit rate',
  },
  {
    id: 'compact-in',
    label: 'compact-in',
    description: 'Tokens remaining before auto-compaction triggers',
  },
];

/** Everything the fork items need, resolved once per status-line refresh. */
export interface ForkStatusLineData {
  contextWindowSize: number;
  /** Prompt tokens of the most recent request (the live context size). */
  currentUsage: number;
  /** Cache-read tokens reported for the most recent request. */
  lastTurnCachedTokens: number;
  /** Cumulative cache-read tokens for the main model's main-source traffic. */
  sessionCachedTokens: number;
  /** Cumulative prompt tokens for the main model's main-source traffic. */
  sessionPromptTokens: number;
  /**
   * Tokens left before auto-compaction fires, or undefined when the context
   * window size is unknown. May be negative once the threshold is passed.
   */
  tokensUntilAutoCompact: number | undefined;
}

/**
 * Minimal structural view of `Config` needed to resolve the main model.
 * Declared locally so this module never imports an upstream type.
 */
export interface MainModelConfigView {
  getModelsConfig?: () => {
    getGenerationConfig?: () => {
      model?: string;
      contextWindowSize?: number;
    };
  };
  getContentGeneratorConfig?: () =>
    | { model?: string; contextWindowSize?: number }
    | undefined;
}

/**
 * Resolves the **main conversation's** model id and context window.
 *
 * `Config.getContentGeneratorConfig()` and `Config.getModel()` do not read
 * plain fields: they resolve through an AsyncLocalStorage "runtime view" that
 * forked and fast-model runs push (`config.ts` `getRuntimeContentGenerator()`).
 * That view carries the *auxiliary* model's `contextWindowSize`, and the ALS
 * context propagates into any async continuation started inside the frame —
 * including React commits — so the footer transiently renders the fast model's
 * window and then flips back. This is the documented #7156 leak class; the
 * `runOutsideAgentContext` mitigation wraps only four call sites, none of them
 * UI readers.
 *
 * `Config.getModelsConfig()` returns a plain field, and its
 * `getGenerationConfig()` is written only by `setModel`/`switchModel`, so it
 * always describes the main model. Prefer it, and otherwise accept the live
 * config unless it *proves* it describes a different model.
 *
 * When no window is known this returns 0, matching upstream's contract that 0
 * hides the context items. It deliberately does NOT fall back to
 * `tokenLimit(modelId)`: a provider-declared window (the common case for a
 * custom `modelProviders` entry) never appears in `tokenLimits.ts`, so that
 * fallback would fabricate a plausible-but-wrong size — the very failure this
 * function exists to prevent.
 */
export function resolveMainModelContext(
  config: MainModelConfigView | undefined,
  currentModel: string | undefined,
): { modelId: string | undefined; contextWindowSize: number } {
  const mainGenerationConfig = config
    ?.getModelsConfig?.()
    ?.getGenerationConfig?.();
  // `currentModel` is React state seeded outside any agent frame, so it is a
  // safe anchor; the generation config's own model is the ALS-immune fallback.
  const modelId = currentModel || mainGenerationConfig?.model;

  const liveConfig = config?.getContentGeneratorConfig?.();
  // Reject only a *proven* mismatch. A live config that does not name its model
  // cannot be shown to belong to an auxiliary run, and discarding it would lose
  // a window that is usually correct.
  const liveDescribesAnotherModel =
    !!modelId && !!liveConfig?.model && liveConfig.model !== modelId;
  const liveWindow = liveDescribesAnotherModel
    ? undefined
    : liveConfig?.contextWindowSize;

  const contextWindowSize =
    mainGenerationConfig?.contextWindowSize ?? liveWindow ?? 0;

  return { modelId, contextWindowSize: contextWindowSize || 0 };
}

/**
 * Collects the fork item inputs.
 *
 * `metrics` is structurally typed rather than imported as `SessionMetrics`,
 * mirroring upstream's `aggregateModelTokens`, so this module stays decoupled
 * from the full metrics shape and unit tests need no fixtures.
 *
 * Cache figures are scoped to `modelId`'s main-source traffic, NOT summed
 * across the session. The status line describes the main conversation, so
 * folding in auxiliary models (title generation, summarization, a cheaper fast
 * model with its own window) or subagent traffic would report a hit rate for a
 * cache the main conversation never uses. The `bySource[MAIN_SOURCE] ??
 * aggregate` fallback matches `utils/modelsBySource.ts`.
 *
 * `lastTurnCachedTokens` defaults to the global telemetry singleton — the only
 * place per-turn cache reads are recorded (there is no per-chat mirror; see
 * `contextCommand.ts`, which reads it the same way) — and is injectable so
 * tests stay pure.
 */
export function buildForkStatusLineData(params: {
  metrics: {
    models: Record<
      string,
      {
        tokens: { prompt: number; cached: number };
        bySource?: Record<
          string,
          { tokens: { prompt: number; cached: number } }
        >;
      }
    >;
  };
  modelId: string | undefined;
  contextWindowSize: number;
  currentUsage: number;
  autoCompactThreshold?: number;
  lastTurnCachedTokens?: number;
}): ForkStatusLineData {
  const modelMetrics = params.modelId
    ? params.metrics.models[params.modelId]
    : undefined;
  // Prefer the main-source bucket so subagent traffic on the same model does
  // not skew the headline rate; fall back to the model aggregate.
  const scoped = modelMetrics?.bySource?.[MAIN_SOURCE] ?? modelMetrics;
  const sessionCachedTokens = scoped?.tokens.cached ?? 0;
  const sessionPromptTokens = scoped?.tokens.prompt ?? 0;

  const tokensUntilAutoCompact =
    params.contextWindowSize > 0
      ? computeThresholds(params.contextWindowSize, params.autoCompactThreshold)
          .auto - params.currentUsage
      : undefined;

  return {
    contextWindowSize: params.contextWindowSize,
    currentUsage: params.currentUsage,
    lastTurnCachedTokens:
      params.lastTurnCachedTokens ??
      uiTelemetryService.getLastCachedContentTokenCount(),
    sessionCachedTokens,
    sessionPromptTokens,
    tokensUntilAutoCompact,
  };
}

function formatRatioPercent(numerator: number, denominator: number): string {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return '0%';
  }
  if (denominator <= 0) {
    return '0%';
  }
  const percent = Math.min(100, Math.max(0, (numerator / denominator) * 100));
  return `${Math.round(percent)}%`;
}

/**
 * Whether cache figures can be trusted for this session.
 *
 * The `cachedInputTokensReported` provenance flag is dropped before it reaches
 * `SessionMetrics`, so a provider that never reports cache usage is
 * indistinguishable from a genuine 0% hit rate. Staying hidden until the
 * session observes at least one cache read avoids pinning a misleading "0%
 * cached" to the footer on providers that simply do not report it. Once any
 * read is seen the items render normally, including a real 0% on a later cold
 * turn.
 */
function hasObservedCache(data: ForkStatusLineData): boolean {
  return data.sessionCachedTokens > 0;
}

/**
 * Renders a fork item. Returns undefined to omit it, matching the upstream
 * `formatPresetItem` contract.
 *
 * Items return plain strings: the footer applies a single color to the whole
 * status line, so state is conveyed with wording rather than per-item color.
 */
export function formatForkStatusLineItem(
  item: ForkStatusLineItemId,
  data: ForkStatusLineData | undefined,
  formatTokens: TokenFormatter,
): string | undefined {
  if (!data) {
    return undefined;
  }

  switch (item) {
    case 'context-tokens':
      if (data.contextWindowSize > 0 && data.currentUsage > 0) {
        return `${formatTokens(data.currentUsage)}/${formatTokens(
          data.contextWindowSize,
        )}`;
      }
      return undefined;

    case 'cache-live':
      if (hasObservedCache(data) && data.currentUsage > 0) {
        return `Cache ${formatRatioPercent(
          data.lastTurnCachedTokens,
          data.currentUsage,
        )} now`;
      }
      return undefined;

    case 'cache-hit':
      if (hasObservedCache(data) && data.sessionPromptTokens > 0) {
        return `Cache ${formatRatioPercent(
          data.sessionCachedTokens,
          data.sessionPromptTokens,
        )} avg`;
      }
      return undefined;

    case 'compact-in':
      if (data.tokensUntilAutoCompact === undefined || data.currentUsage <= 0) {
        return undefined;
      }
      if (data.tokensUntilAutoCompact <= 0) {
        return 'Compact imminent';
      }
      return `Compact in ${formatTokens(data.tokensUntilAutoCompact)}`;

    default: {
      item satisfies never;
      return undefined;
    }
  }
}
