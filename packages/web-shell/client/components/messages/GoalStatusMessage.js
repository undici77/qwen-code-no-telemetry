import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useEffect } from 'react';
import { DAEMON_GOAL_STATUS_SENTINEL_PREFIX } from '@qwen-code/sdk/daemon';
import { useI18n } from '../../i18n';
import { useTranscriptRenderMode } from '../../transcriptRenderMode';
import { formatRuntime } from '../../utils/formatRuntime';
import { createSentinelSerializer } from '../../utils/sentinelMessage';
import styles from './GoalStatusMessage.module.css';
export const GOAL_STATUS_ACTIVE_EVENT = 'web-shell-goal-status-active';
const {
  serialize: serializeGoalStatusMessage,
  parse: parseRawGoalStatusMessage,
} = createSentinelSerializer(DAEMON_GOAL_STATUS_SENTINEL_PREFIX);
const VALID_GOAL_KINDS = new Set([
  'set',
  'achieved',
  'cleared',
  'failed',
  'aborted',
  // A paused goal is not running. Dropping it here left the footer and
  // the active-goal derivation falling through to the previous `set`
  // card, so the UI kept claiming autonomous work was under way.
  'paused',
  'checking',
]);
function parseGoalStatusMessage(content) {
  const parsed =
    typeof content === 'string' ? parseRawGoalStatusMessage(content) : content;
  return normalizeGoalStatus(parsed);
}
export { serializeGoalStatusMessage, parseGoalStatusMessage };
function normalizeGoalStatus(value) {
  if (!value || typeof value !== 'object') return null;
  const record = value;
  const kind = record.kind;
  const condition = record.condition;
  if (typeof kind !== 'string' || !VALID_GOAL_KINDS.has(kind)) return null;
  if (typeof condition !== 'string') return null;
  const iterations = getNumber(record.iterations);
  const durationMs = getNumber(record.durationMs);
  const setAt = getNumber(record.setAt);
  const lastReason =
    typeof record.lastReason === 'string' ? record.lastReason : undefined;
  return {
    kind: kind,
    condition,
    ...(iterations !== undefined ? { iterations } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(setAt !== undefined ? { setAt } : {}),
    ...(lastReason !== undefined ? { lastReason } : {}),
  };
}
function getNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}
function pluralTurns(n, t) {
  return t(n === 1 ? 'goal.turn' : 'goal.turns', { count: n });
}
function getTitle(status, t) {
  switch (status.kind) {
    case 'checking':
      return {
        title: `${t('goal.check')}${
          status.iterations && status.iterations > 0
            ? ` · ${t('goal.turnLabel', { count: status.iterations })}`
            : ''
        } · ${t('goal.notYetMet')}`,
        colorClass: styles.muted,
      };
    case 'set':
      return {
        title: t('goal.set'),
        colorClass: styles.accent,
      };
    case 'achieved':
      return {
        title: t('goal.achieved'),
        colorClass: styles.success,
      };
    case 'cleared':
      return {
        title: t('goal.cleared'),
        colorClass: styles.muted,
      };
    case 'failed':
      return {
        title: t('goal.failed'),
        colorClass: styles.error,
      };
    case 'aborted':
      return {
        title: t('goal.aborted'),
        colorClass: styles.warning,
      };
    case 'paused':
      return {
        title: t('goal.paused'),
        colorClass: styles.warning,
      };
  }
}
export function GoalStatusMessage({ status, activateFooter = false }) {
  const { t } = useI18n();
  const renderMode = useTranscriptRenderMode();
  useEffect(() => {
    if (!activateFooter || renderMode === 'readonly') return;
    const active = status.kind === 'set' || status.kind === 'checking';
    window.dispatchEvent(
      new CustomEvent(GOAL_STATUS_ACTIVE_EVENT, {
        detail: {
          active,
          condition: status.condition,
          setAt: status.setAt,
        },
      }),
    );
  }, [activateFooter, renderMode, status.condition, status.kind, status.setAt]);
  const title = getTitle(status, t);
  const stats = [];
  if (status.kind !== 'checking') {
    if (status.iterations && status.iterations > 0) {
      stats.push(pluralTurns(status.iterations, t));
    }
    if (typeof status.durationMs === 'number') {
      stats.push(formatRuntime(status.durationMs));
    }
  }
  const subtitle = stats.length > 0 ? ` · ${stats.join(' · ')}` : '';
  const showReason =
    (status.kind === 'checking' ||
      status.kind === 'achieved' ||
      status.kind === 'failed' ||
      status.kind === 'aborted' ||
      status.kind === 'paused') &&
    status.lastReason?.trim();
  const reasonLabel =
    status.kind === 'checking' ? t('goal.judge') : t('goal.lastCheck');
  return _jsx('div', {
    className: styles.message,
    children: _jsxs('div', {
      className: styles.body,
      children: [
        _jsxs('div', {
          className: `${styles.title} ${title.colorClass}`,
          children: [
            title.title,
            subtitle &&
              _jsx('span', { className: styles.muted, children: subtitle }),
          ],
        }),
        _jsxs('div', {
          className: styles.row,
          children: [
            _jsxs('span', {
              className: styles.label,
              children: [t('goal.label'), ':'],
            }),
            _jsx('span', {
              className: styles.value,
              children: status.condition,
            }),
          ],
        }),
        showReason &&
          _jsxs('div', {
            className: styles.muted,
            children: [reasonLabel, ': ', showReason],
          }),
      ],
    }),
  });
}
//# sourceMappingURL=GoalStatusMessage.js.map
