import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import { useI18n } from '../../i18n';
import { getContextUsageLevel } from '../../utils/contextUsage';
import { formatContextTokens as formatTokens } from '../../utils/formatTokenCount';
import styles from './ContextUsageMessage.module.css';
const SENTINEL = 'web-shell:context-usage:v1:';
const FILLED = '\u2588';
const BUFFER = '\u2592';
const EMPTY = '\u2591';
const DETAIL_NAME_MAX_LEN = 30;
export function serializeContextUsageMessage(status) {
  return `${SENTINEL}${JSON.stringify(status)}`;
}
export function parseContextUsageMessage(content) {
  if (!content.startsWith(SENTINEL)) return null;
  try {
    const parsed = JSON.parse(content.slice(SENTINEL.length));
    if (!parsed?.usage || typeof parsed.usage.totalTokens !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
function truncateName(name, maxLen) {
  if (name.length <= maxLen) return name;
  return `${name.slice(0, maxLen - 1)}\u2026`;
}
function formatPercentage(tokens, contextWindowSize) {
  if (contextWindowSize <= 0) return '0.0';
  const percentage = (tokens / contextWindowSize) * 100;
  if (percentage > 100) return '>100';
  return percentage.toFixed(1);
}
function sortByTokens(items) {
  return [...items].sort((a, b) => b.tokens - a.tokens);
}
function ProgressBar({ usedPercentage, bufferPercentage }) {
  const width = 56;
  const usedCount = Math.round((Math.min(usedPercentage, 100) / 100) * width);
  const bufferCount = Math.round(
    (Math.min(bufferPercentage, Math.max(0, 100 - usedPercentage)) / 100) *
      width,
  );
  const freeCount = Math.max(0, width - usedCount - bufferCount);
  const usedLevel = getContextUsageLevel(usedPercentage);
  const usedClass =
    usedLevel === 'error'
      ? styles.error
      : usedLevel === 'warning'
        ? styles.warning
        : styles.accent;
  return _jsxs('div', {
    className: styles.progress,
    'aria-hidden': 'true',
    children: [
      _jsx('span', {
        className: usedClass,
        children: FILLED.repeat(Math.max(0, usedCount)),
      }),
      _jsx('span', {
        className: styles.secondary,
        children: EMPTY.repeat(Math.max(0, freeCount)),
      }),
      _jsx('span', {
        className: styles.warning,
        children: BUFFER.repeat(Math.max(0, bufferCount)),
      }),
    ],
  });
}
function CategoryRow({
  symbol,
  label,
  tokens,
  tokenLabel,
  contextWindowSize,
  symbolClassName = styles.secondary,
  isOverLimit,
}) {
  return _jsxs('div', {
    className: styles.row,
    children: [
      _jsx('span', {
        className: `${styles.symbol} ${symbolClassName}`,
        children: symbol,
      }),
      _jsx('span', { className: styles.label, children: label }),
      _jsxs('span', {
        className: isOverLimit ? styles.error : styles.value,
        children: [
          formatTokens(tokens),
          ' ',
          tokenLabel,
          ' (',
          formatPercentage(tokens, contextWindowSize),
          '%)',
        ],
      }),
    ],
  });
}
const DETAIL_COMMAND = '/context detail';
function DetailHint({ hint, onShowDetail }) {
  // The clickable part is located by the literal command inside the
  // translated hint, so a translation that drops it (or a missing
  // callback) degrades to the plain text line.
  const idx = onShowDetail ? hint.indexOf(DETAIL_COMMAND) : -1;
  if (idx < 0) return _jsx('div', { className: styles.hint, children: hint });
  return _jsxs('div', {
    className: styles.hint,
    children: [
      hint.slice(0, idx),
      _jsx('button', {
        type: 'button',
        className: styles.detailCommand,
        onClick: onShowDetail,
        children: DETAIL_COMMAND,
      }),
      hint.slice(idx + DETAIL_COMMAND.length),
    ],
  });
}
function DetailRow({ name, tokens, tokenLabel }) {
  return _jsxs('div', {
    className: styles.detailRow,
    children: [
      _jsxs('span', { className: styles.secondary, children: ['\u2514', ' '] }),
      _jsx('span', {
        className: styles.detailName,
        title: name,
        children: truncateName(name, DETAIL_NAME_MAX_LEN),
      }),
      _jsxs('span', {
        className: styles.value,
        children: [formatTokens(tokens), ' ', tokenLabel],
      }),
    ],
  });
}
function DetailSection({ title, items, getName, tokenLabel }) {
  const sorted = sortByTokens(items);
  if (sorted.length === 0) return null;
  return _jsxs('section', {
    className: styles.detailSection,
    children: [
      _jsx('div', { className: styles.sectionTitle, children: title }),
      sorted.map((item) =>
        _jsx(
          DetailRow,
          { name: getName(item), tokens: item.tokens, tokenLabel: tokenLabel },
          getName(item),
        ),
      ),
    ],
  });
}
function SkillsSection({ skills, labels }) {
  const sorted = [...skills].sort((a, b) => {
    if (a.loaded !== b.loaded) return a.loaded ? -1 : 1;
    return b.tokens + (b.bodyTokens ?? 0) - (a.tokens + (a.bodyTokens ?? 0));
  });
  if (sorted.length === 0) return null;
  return _jsxs('section', {
    className: styles.detailSection,
    children: [
      _jsx('div', { className: styles.sectionTitle, children: labels.skills }),
      sorted.map((skill) =>
        _jsxs(
          'div',
          {
            className: styles.skillBlock,
            children: [
              _jsxs('div', {
                className: styles.detailRow,
                children: [
                  _jsxs('span', {
                    className: styles.secondary,
                    children: ['\u2514', ' '],
                  }),
                  _jsxs('span', {
                    className: styles.detailName,
                    title: skill.name,
                    children: [
                      truncateName(skill.name, DETAIL_NAME_MAX_LEN),
                      skill.loaded &&
                        _jsxs('span', {
                          className: styles.success,
                          children: [' ', labels.active],
                        }),
                    ],
                  }),
                  _jsxs('span', {
                    className: styles.value,
                    children: [formatTokens(skill.tokens), ' ', labels.tokens],
                  }),
                ],
              }),
              skill.loaded &&
                skill.bodyTokens != null &&
                skill.bodyTokens > 0 &&
                _jsxs('div', {
                  className: styles.subDetailRow,
                  children: [
                    _jsxs('span', {
                      className: styles.secondary,
                      children: ['  \u2514', ' '],
                    }),
                    _jsx('span', {
                      className: styles.bodyLoaded,
                      children: labels.bodyLoaded,
                    }),
                    _jsxs('span', {
                      className: styles.success,
                      children: [
                        '+',
                        formatTokens(skill.bodyTokens),
                        ' ',
                        labels.tokens,
                      ],
                    }),
                  ],
                }),
            ],
          },
          skill.name,
        ),
      ),
    ],
  });
}
export function ContextUsageMessage({ status, onShowDetail }) {
  const { t } = useI18n();
  const { usage } = status;
  const { breakdown, contextWindowSize } = usage;
  const hasTokenCount = usage.totalTokens > 0;
  const percentage =
    contextWindowSize > 0 ? (usage.totalTokens / contextWindowSize) * 100 : 0;
  const isOverLimit = percentage > 100;
  const bufferPercentage =
    contextWindowSize > 0
      ? (breakdown.autocompactBuffer / contextWindowSize) * 100
      : 0;
  return _jsxs('div', {
    className: styles.panel,
    children: [
      _jsx('div', {
        className: styles.title,
        children: t('contextUsage.title'),
      }),
      !hasTokenCount
        ? _jsxs(_Fragment, {
            children: [
              _jsx('div', {
                className: styles.estimateHint,
                children: t('contextUsage.noApiResponse'),
              }),
              _jsx('div', {
                className: styles.sectionTitle,
                children: t('contextUsage.estimatedOverhead'),
              }),
              _jsxs('div', {
                className: styles.metaLine,
                children: [
                  _jsxs('span', {
                    children: [t('contextUsage.model'), ': ', usage.modelName],
                  }),
                  _jsxs('span', {
                    children: [
                      t('contextUsage.contextWindow'),
                      ':',
                      ' ',
                      formatTokens(contextWindowSize),
                      ' ',
                      t('contextUsage.tokens'),
                    ],
                  }),
                ],
              }),
            ],
          })
        : _jsxs(_Fragment, {
            children: [
              _jsxs('div', {
                className: styles.metaLine,
                children: [
                  _jsxs('span', {
                    children: [t('contextUsage.model'), ': ', usage.modelName],
                  }),
                  _jsxs('span', {
                    children: [
                      t('contextUsage.contextWindow'),
                      ':',
                      ' ',
                      formatTokens(contextWindowSize),
                      ' ',
                      t('contextUsage.tokens'),
                    ],
                  }),
                ],
              }),
              usage.isEstimated &&
                _jsx('div', {
                  className: styles.estimateHint,
                  children: t('contextUsage.estimatedUntilProviderUsage'),
                }),
              isOverLimit &&
                _jsx('div', {
                  className: styles.error,
                  children: t('contextUsage.overLimit'),
                }),
              _jsx(ProgressBar, {
                usedPercentage: Math.min(percentage, 100),
                bufferPercentage: bufferPercentage,
              }),
              _jsx('div', { className: styles.spacer }),
              _jsx(CategoryRow, {
                symbol: FILLED,
                label: t('contextUsage.used'),
                tokens: usage.totalTokens,
                tokenLabel: t('contextUsage.tokens'),
                contextWindowSize: contextWindowSize,
                symbolClassName: isOverLimit ? styles.error : styles.accent,
                isOverLimit: isOverLimit,
              }),
              _jsx(CategoryRow, {
                symbol: EMPTY,
                label: t('contextUsage.free'),
                tokens: breakdown.freeSpace,
                tokenLabel: t('contextUsage.tokens'),
                contextWindowSize: contextWindowSize,
              }),
              _jsx(CategoryRow, {
                symbol: BUFFER,
                label: t('contextUsage.autocompactBuffer'),
                tokens: breakdown.autocompactBuffer,
                tokenLabel: t('contextUsage.tokens'),
                contextWindowSize: contextWindowSize,
                symbolClassName: styles.warning,
              }),
              _jsx('div', { className: styles.spacer }),
              _jsx('div', {
                className: styles.sectionTitle,
                children: t('contextUsage.usageByCategory'),
              }),
            ],
          }),
      _jsx(CategoryRow, {
        symbol: FILLED,
        label: t('contextUsage.systemPrompt'),
        tokens: breakdown.systemPrompt,
        tokenLabel: t('contextUsage.tokens'),
        contextWindowSize: contextWindowSize,
        symbolClassName: styles.accent,
      }),
      _jsx(CategoryRow, {
        symbol: FILLED,
        label: t('contextUsage.builtinTools'),
        tokens: breakdown.builtinTools,
        tokenLabel: t('contextUsage.tokens'),
        contextWindowSize: contextWindowSize,
        symbolClassName: styles.accent,
      }),
      breakdown.mcpTools > 0 &&
        _jsx(CategoryRow, {
          symbol: FILLED,
          label: t('contextUsage.mcpTools'),
          tokens: breakdown.mcpTools,
          tokenLabel: t('contextUsage.tokens'),
          contextWindowSize: contextWindowSize,
          symbolClassName: styles.accent,
        }),
      _jsx(CategoryRow, {
        symbol: FILLED,
        label: t('contextUsage.memoryFiles'),
        tokens: breakdown.memoryFiles,
        tokenLabel: t('contextUsage.tokens'),
        contextWindowSize: contextWindowSize,
        symbolClassName: styles.accent,
      }),
      _jsx(CategoryRow, {
        symbol: FILLED,
        label: t('contextUsage.skills'),
        tokens: breakdown.skills,
        tokenLabel: t('contextUsage.tokens'),
        contextWindowSize: contextWindowSize,
        symbolClassName: styles.accent,
      }),
      hasTokenCount &&
        _jsx(CategoryRow, {
          symbol: FILLED,
          label: t('contextUsage.messages'),
          tokens: breakdown.messages,
          tokenLabel: t('contextUsage.tokens'),
          contextWindowSize: contextWindowSize,
          symbolClassName: styles.accent,
        }),
      usage.showDetails
        ? _jsxs(_Fragment, {
            children: [
              _jsx(DetailSection, {
                title: t('contextUsage.builtinTools'),
                items: usage.builtinTools,
                getName: (item) => ('name' in item ? item.name : item.path),
                tokenLabel: t('contextUsage.tokens'),
              }),
              _jsx(DetailSection, {
                title: t('contextUsage.mcpTools'),
                items: usage.mcpTools,
                getName: (item) => ('name' in item ? item.name : item.path),
                tokenLabel: t('contextUsage.tokens'),
              }),
              _jsx(DetailSection, {
                title: t('contextUsage.memoryFiles'),
                items: usage.memoryFiles,
                getName: (item) => ('path' in item ? item.path : item.name),
                tokenLabel: t('contextUsage.tokens'),
              }),
              _jsx(SkillsSection, {
                skills: usage.skills,
                labels: {
                  active: t('contextUsage.active'),
                  bodyLoaded: t('contextUsage.bodyLoaded'),
                  skills: t('contextUsage.skills'),
                  tokens: t('contextUsage.tokens'),
                },
              }),
            ],
          })
        : _jsx(DetailHint, {
            hint: t('contextUsage.detailHint'),
            onShowDetail: onShowDetail,
          }),
    ],
  });
}
//# sourceMappingURL=ContextUsageMessage.js.map
