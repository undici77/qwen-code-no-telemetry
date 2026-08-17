import { jsx as _jsx } from 'react/jsx-runtime';
import {
  Fragment,
  createElement,
  isValidElement,
  useMemo,
  useRef,
} from 'react';
import { ChartRendererRegistry } from '@datafe-open/markdown-chart';
import { createEChartsRenderer } from '@datafe-open/markdown-chart-echarts';
import {
  MarkdownChartBlock,
  MarkdownChartProvider,
  createMarkdownChartComponents,
  isRegisteredChartLanguage,
} from '@datafe-open/markdown-chart-react';
import { useI18n } from '../../i18n';
export const ECHARTS_FULLDATA_LANGUAGE = 'echarts-fulldata';
const DATA_REF_TIMEOUT_MS = 30_000;
const SUPPORTED_DATA_REF_PREFIXES = ['artifact://', 'session-file://'];
const WINDOWS_DRIVE_SEGMENT_PATTERN = /^[a-z]:/i;
export function createMarkdownChartRegistry(options = {}) {
  const {
    resolveDataRef,
    validateDataRef = isSupportedLegacyDataRef,
    ...rendererOptions
  } = options;
  const usesDefaultDataRefValidation = options.validateDataRef === undefined;
  const boundedResolveDataRef = resolveDataRef
    ? async (ref, context) => {
        const resolvedRef = usesDefaultDataRefValidation
          ? normalizeSupportedDataRef(ref)
          : ref;
        if (!resolvedRef) {
          throw new Error('Chart data reference is not supported.');
        }
        return withTimeout(
          Promise.resolve(resolveDataRef(resolvedRef, context)),
          'Chart data reference resolution',
        );
      }
    : undefined;
  return new ChartRendererRegistry().register(
    createEChartsRenderer({
      ...rendererOptions,
      resolveDataRef: boundedResolveDataRef,
      validateDataRef,
    }),
  );
}
export const DEFAULT_WEB_SHELL_MARKDOWN_CHART = {
  registry: createMarkdownChartRegistry(),
};
export function createWebShellMarkdownChartPre(registry, options = {}) {
  const sharedPre = createMarkdownChartComponents(options).pre;
  if (!sharedPre) {
    throw new Error(
      'markdown-chart React adapter did not provide a pre renderer',
    );
  }
  return function WebShellMarkdownChartPre({ children, ...props }) {
    if (isValidElement(children)) {
      const code = children;
      const match = /(?:^|\s)language-([^\s]+)/.exec(
        code.props.className ?? '',
      );
      const language = match?.[1]?.toLowerCase();
      if (language && isRegisteredChartLanguage(language, registry)) {
        return createElement(sharedPre, props, children);
      }
    }
    return createElement(Fragment, null, children);
  };
}
export function WebShellMarkdownChartProvider({
  customization,
  source,
  streaming,
  theme,
  children,
}) {
  const labels = useWebShellMarkdownChartLabels(customization.labels);
  const { t } = useI18n();
  return _jsx(MarkdownChartProvider, {
    registry: customization.registry,
    source: source,
    streaming: streaming,
    theme: theme,
    loadingLabel: customization.loadingLabel ?? t('echartsChart.rendering'),
    labels: labels,
    onError: customization.onError,
    children: children,
  });
}
function useWebShellMarkdownChartLabels(overrides) {
  const { t } = useI18n();
  return useMemo(
    () => ({
      chartUnavailable: t('echartsChart.renderFailed'),
      viewMode: t('echartsChart.viewMode'),
      chart: t('echartsChart.chart'),
      data: t('echartsChart.data'),
      showChart: t('echartsChart.showChart'),
      showData: t('echartsChart.showData'),
      noData: t('echartsChart.noData'),
      tableNotice: ({ visibleRows, totalRows, visibleColumns, totalColumns }) =>
        t('echartsChart.tableNotice', {
          visibleRows,
          totalRows,
          visibleColumns,
          totalColumns,
          omittedRows: totalRows - visibleRows,
          omittedColumns: totalColumns - visibleColumns,
        }),
      ...overrides,
    }),
    [overrides, t],
  );
}
function hasWhitespaceOrControl(value) {
  return (
    /\s/.test(value) ||
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
    })
  );
}
function normalizeSupportedDataRef(ref) {
  if (ref.trim() !== ref || !ref || hasWhitespaceOrControl(ref)) {
    return undefined;
  }
  const lower = ref.toLowerCase();
  const prefix = SUPPORTED_DATA_REF_PREFIXES.find((candidate) =>
    lower.startsWith(candidate),
  );
  if (!prefix) {
    return undefined;
  }
  const rawPath = ref.slice(prefix.length);
  if (!rawPath || /[?#\\]/.test(rawPath)) {
    return undefined;
  }
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return undefined;
  }
  if (/[%?#\\]/.test(decodedPath) || hasWhitespaceOrControl(decodedPath)) {
    return undefined;
  }
  const segments = decodedPath.split('/');
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === '.' ||
        segment === '..' ||
        WINDOWS_DRIVE_SEGMENT_PATTERN.test(segment),
    )
  ) {
    return undefined;
  }
  return `${prefix}${segments.join('/')}`;
}
function isSupportedLegacyDataRef(ref) {
  return normalizeSupportedDataRef(ref) !== undefined;
}
function withTimeout(promise, label) {
  return new Promise((resolve, reject) => {
    const timeout = globalThis.setTimeout(
      () => reject(new Error(`${label} timed out.`)),
      DATA_REF_TIMEOUT_MS,
    );
    promise
      .then(resolve, reject)
      .finally(() => globalThis.clearTimeout(timeout));
  });
}
function adaptLegacyRuntimeLoader(loadEcharts) {
  if (!loadEcharts) {
    return async () => {
      throw new Error('Chart runtime is unavailable.');
    };
  }
  return async () => {
    const runtime = await withTimeout(
      Promise.resolve().then(loadEcharts),
      'Chart runtime load',
    );
    return {
      init(container, theme) {
        return runtime.init(
          container,
          typeof theme === 'string' ? theme : undefined,
        );
      },
    };
  };
}
function adaptLegacyDataResolver(resolveDataRef) {
  if (!resolveDataRef) {
    return undefined;
  }
  let cached;
  return async (ref, context) => {
    if (!context.dimensions || !context.format) {
      throw new Error('Chart data reference metadata is incomplete.');
    }
    const normalizedRef = normalizeSupportedDataRef(ref);
    if (!normalizedRef) {
      throw new Error('Chart data reference is not supported.');
    }
    const key = JSON.stringify([
      normalizedRef,
      context.format,
      context.dimensions,
    ]);
    if (cached?.key === key) {
      return cached.dataset;
    }
    const resolved = await resolveDataRef(normalizedRef, {
      dimensions: [...context.dimensions],
      format: context.format,
    });
    const dataset = {
      dimensions: resolved.dimensions,
      source: resolved.source,
    };
    cached = { key, dataset };
    return dataset;
  };
}
function createLegacyRegistry(options) {
  return createMarkdownChartRegistry({
    loadECharts: adaptLegacyRuntimeLoader(options.loadEcharts),
    resolveDataRef: adaptLegacyDataResolver(options.resolveDataRef),
    validateDataRef: isSupportedLegacyDataRef,
  });
}
function normalizeLegacyEchartsSource(source) {
  try {
    const parsed = JSON.parse(source);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      !('version' in parsed && 'data' in parsed && 'option' in parsed)
    ) {
      return {
        language: 'markdown-chart',
        source: JSON.stringify({
          version: 1,
          renderer: 'echarts',
          spec: parsed,
        }),
      };
    }
  } catch {
    // Let the shared strict parser produce the user-facing error.
  }
  return { language: ECHARTS_FULLDATA_LANGUAGE, source };
}
function reportLegacyMarkdownChartError(error) {
  console.error('[web-shell] markdown-chart render failed:', error);
}
function MarkdownChartCodeBlock({
  registry,
  language,
  source,
  streaming,
  theme,
}) {
  const { t } = useI18n();
  const labels = useWebShellMarkdownChartLabels();
  return _jsx(MarkdownChartProvider, {
    registry: registry,
    theme: theme,
    streaming: streaming,
    loadingLabel: t('echartsChart.rendering'),
    labels: labels,
    onError: reportLegacyMarkdownChartError,
    children: _jsx(MarkdownChartBlock, {
      language: language,
      source: source,
      streaming: streaming,
      style: { minHeight: 360 },
    }),
  });
}
function LegacyMarkdownChartCodeBlock({
  options,
  language,
  source,
  streaming,
  theme,
}) {
  const registry = useMemo(() => createLegacyRegistry(options), [options]);
  return _jsx(MarkdownChartCodeBlock, {
    registry: registry,
    language: language,
    source: source,
    streaming: streaming,
    theme: theme,
  });
}
/**
 * @deprecated Configure `markdown.chart.registry` with
 * `createMarkdownChartRegistry` instead.
 */
export function createEchartsFullDataRenderer(options = {}) {
  return function renderEchartsFullDataBlock(info) {
    if (
      info.source !== 'assistant' ||
      info.language.toLowerCase() !== ECHARTS_FULLDATA_LANGUAGE
    ) {
      return undefined;
    }
    const normalized = info.isIncomplete
      ? { language: ECHARTS_FULLDATA_LANGUAGE, source: info.code }
      : normalizeLegacyEchartsSource(info.code);
    return _jsx(LegacyMarkdownChartCodeBlock, {
      options: options,
      language: normalized.language,
      source: normalized.source,
      streaming: info.isIncomplete,
      theme: info.theme,
    });
  };
}
/**
 * @deprecated Configure `markdown.chart.registry` and emit a Markdown chart
 * fence instead.
 */
export function EchartsFullDataBlock({
  option,
  parseError,
  isStreaming = false,
  theme,
  loadEcharts,
}) {
  const loadEchartsRef = useRef(loadEcharts);
  loadEchartsRef.current = loadEcharts;
  const hasLoadEcharts = loadEcharts !== undefined;
  const stableLoadEcharts = useMemo(
    () =>
      hasLoadEcharts
        ? () => {
            const current = loadEchartsRef.current;
            if (!current) {
              throw new Error('Chart runtime is unavailable.');
            }
            return current();
          }
        : undefined,
    [hasLoadEcharts],
  );
  const registry = useMemo(
    () => createLegacyRegistry({ loadEcharts: stableLoadEcharts }),
    [stableLoadEcharts],
  );
  if (parseError && !isStreaming) {
    return _jsx('div', { role: 'alert', children: parseError });
  }
  return _jsx(MarkdownChartCodeBlock, {
    registry: registry,
    language: 'markdown-chart',
    source: JSON.stringify({
      version: 1,
      renderer: 'echarts',
      spec: option ?? {},
    }),
    streaming: isStreaming,
    theme: theme,
  });
}
//# sourceMappingURL=MarkdownChartRenderer.js.map
