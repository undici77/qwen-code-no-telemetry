import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useConnection } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../i18n';
import { isComposerTask } from '../utils/composerTasks';
import styles from './StatusBar.module.css';
const GOAL_PILL_INTERVAL_MS = 1000;
function getModeIndicator(mode, t) {
  switch (mode) {
    case 'default':
      return { label: t('mode.default'), className: styles.modeDefault };
    case 'plan':
      return { label: t('mode.plan'), className: styles.modePlan };
    case 'auto-edit':
      return { label: t('mode.auto-edit'), className: styles.modeAutoEdit };
    case 'auto':
      return { label: t('mode.auto'), className: styles.modeAuto };
    case 'yolo':
      return { label: t('mode.yolo'), className: styles.modeYolo };
    default:
      // Only reached before a mode is known (e.g. while disconnected).
      return null;
  }
}
// Feather "settings" gear, stroke-based like PromptChevron so it inherits
// the button's currentColor.
function GearIcon() {
  return _jsxs('svg', {
    width: '14',
    height: '14',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
    children: [
      _jsx('circle', { cx: '12', cy: '12', r: '3' }),
      _jsx('path', {
        d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
      }),
    ],
  });
}
function formatCount(count, singularKey, pluralKey, t) {
  return t(count === 1 ? singularKey : pluralKey, { count });
}
export function getTaskPillLabel(tasks, t) {
  const composerTasks = tasks.filter(isComposerTask);
  if (composerTasks.length === 0) return '';
  const running = composerTasks.filter((task) => task.status === 'running');
  if (running.length > 0) {
    const counts = { shell: 0, monitor: 0 };
    for (const task of running) {
      if (task.kind === 'shell') counts.shell += 1;
      if (task.kind === 'monitor') counts.monitor += 1;
    }
    const parts = [];
    if (counts.shell > 0) {
      parts.push(
        formatCount(counts.shell, 'tasks.pill.shell', 'tasks.pill.shells', t),
      );
    }
    if (counts.monitor > 0) {
      parts.push(
        formatCount(
          counts.monitor,
          'tasks.pill.monitor',
          'tasks.pill.monitors',
          t,
        ),
      );
    }
    return parts.join(', ');
  }
  return t(
    composerTasks.length === 1 ? 'tasks.pill.done' : 'tasks.pill.doneMany',
    {
      count: composerTasks.length,
    },
  );
}
function formatGoalElapsed(ms) {
  if (ms < 1000) return '';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
export const StatusBar = forwardRef(function StatusBar(
  {
    onSelectMode,
    onSelectModel,
    onShowContext,
    onOpenSettings,
    onOpenTasks,
    onReturnToInput,
    tasks,
    activeGoal,
    onOpenGoals,
    hideSettings,
    onToggleShortcuts,
    compact = false,
  },
  ref,
) {
  const connection = useConnection();
  const connected = connection.status === 'connected';
  const currentModel = connection.currentModel ?? '';
  const currentMode = connection.currentMode ?? '';
  const tokenCount = connection.tokenCount ?? 0;
  const contextWindow = connection.contextWindow ?? 0;
  const { t } = useI18n();
  const pct = contextWindow > 0 ? (tokenCount / contextWindow) * 100 : 0;
  const pctDisplay = pct.toFixed(1);
  const modeIndicator = getModeIndicator(currentMode, t);
  const [, setGoalTick] = useState(0);
  const taskPillRef = useRef(null);
  useEffect(() => {
    if (!activeGoal) return;
    const id = setInterval(
      () => setGoalTick((tick) => (tick + 1) % 1_000_000),
      GOAL_PILL_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [activeGoal]);
  const taskPillLabel = useMemo(() => getTaskPillLabel(tasks, t), [tasks, t]);
  const hasLeftPrefix = !compact && (connected || !!modeIndicator);
  const goalElapsed = activeGoal
    ? formatGoalElapsed(Date.now() - activeGoal.setAt)
    : '';
  const goalLabel = activeGoal
    ? `◎ ${t('goal.statusActive')}${goalElapsed ? ` (${goalElapsed})` : ''}`
    : '';
  const hasLeftContent = !!taskPillLabel || !compact;
  const hasRightContent =
    (!compact && !!currentModel) ||
    (!compact && contextWindow > 0 && tokenCount > 0) ||
    !!goalLabel;
  useImperativeHandle(
    ref,
    () => ({
      focusTaskPill() {
        if (!taskPillLabel) return false;
        taskPillRef.current?.focus({ preventScroll: true });
        return true;
      },
    }),
    [taskPillLabel],
  );
  if (!hasLeftContent && !hasRightContent) {
    return null;
  }
  const handleTaskPillKeyDown = (event) => {
    if (
      event.key === 'Enter' ||
      event.key === 'ArrowDown' ||
      (event.key === 'n' && event.ctrlKey)
    ) {
      event.preventDefault();
      event.stopPropagation();
      onOpenTasks?.();
      return;
    }
    if (
      event.key === 'ArrowUp' ||
      event.key === 'Escape' ||
      (event.key === 'p' && event.ctrlKey)
    ) {
      event.preventDefault();
      event.stopPropagation();
      onReturnToInput?.();
      return;
    }
    if (
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      event.stopPropagation();
      onReturnToInput?.(event.key);
    }
  };
  return _jsxs('div', {
    className: styles.bar,
    children: [
      _jsxs('div', {
        className: styles.left,
        children: [
          connected &&
            !hideSettings &&
            !compact &&
            _jsx('button', {
              type: 'button',
              className: styles.settingsButton,
              onClick: onOpenSettings,
              onMouseDown: (e) => e.stopPropagation(),
              onTouchStart: (e) => e.stopPropagation(),
              title: t('settings.title'),
              'aria-label': t('settings.title'),
              'aria-haspopup': 'dialog',
              children: _jsx(GearIcon, {}),
            }),
          modeIndicator &&
            !compact &&
            _jsxs('button', {
              type: 'button',
              className: styles.modeButton,
              onClick: onSelectMode,
              onMouseDown: (e) => e.stopPropagation(),
              onTouchStart: (e) => e.stopPropagation(),
              title: t('mode.select'),
              'aria-haspopup': 'listbox',
              children: [
                _jsx('span', {
                  className: `${styles.modeLabel} ${modeIndicator.className}`,
                  children: modeIndicator.label,
                }),
                !compact &&
                  _jsx('span', {
                    className: styles.modeHint,
                    children: t('status.modeHint'),
                  }),
              ],
            }),
          !compact &&
            _jsx(_Fragment, {
              children: onToggleShortcuts
                ? _jsx('button', {
                    type: 'button',
                    className: styles.shortcutsButton,
                    onClick: onToggleShortcuts,
                    onMouseDown: (e) => e.stopPropagation(),
                    onTouchStart: (e) => e.stopPropagation(),
                    'aria-haspopup': 'dialog',
                    'aria-label': t('status.shortcuts'),
                    children: t('status.shortcuts'),
                  })
                : _jsx('span', { children: t('status.shortcuts') }),
            }),
          taskPillLabel &&
            _jsxs(_Fragment, {
              children: [
                hasLeftPrefix &&
                  _jsx('span', {
                    className: styles.separator,
                    children: '\u00B7',
                  }),
                _jsx('button', {
                  ref: taskPillRef,
                  type: 'button',
                  className: styles.taskPill,
                  onClick: onOpenTasks,
                  onKeyDown: handleTaskPillKeyDown,
                  disabled: !onOpenTasks,
                  children: taskPillLabel,
                }),
              ],
            }),
        ],
      }),
      _jsxs('div', {
        className: styles.right,
        children: [
          !compact &&
            currentModel &&
            _jsx('button', {
              type: 'button',
              className: styles.modelButton,
              onClick: onSelectModel,
              onMouseDown: (e) => e.stopPropagation(),
              onTouchStart: (e) => e.stopPropagation(),
              title: t('model.select'),
              'aria-haspopup': 'listbox',
              children: _jsx('span', {
                className: styles.model,
                children: currentModel,
              }),
            }),
          !compact &&
            contextWindow > 0 &&
            tokenCount > 0 &&
            _jsx('button', {
              type: 'button',
              className: styles.contextButton,
              onClick: onShowContext,
              title: t('contextUsage.title'),
              children: _jsx('span', {
                className: styles.context,
                children: t('status.contextUsed', { pct: pctDisplay }),
              }),
            }),
          goalLabel &&
            (onOpenGoals
              ? _jsx('button', {
                  type: 'button',
                  className: styles.goalButton,
                  onClick: onOpenGoals,
                  title: activeGoal?.condition,
                  'aria-label': activeGoal?.condition
                    ? `${t('sidebar.goals')}: ${activeGoal.condition}`
                    : t('sidebar.goals'),
                  children: _jsx('span', {
                    className: styles.goal,
                    children: goalLabel,
                  }),
                })
              : _jsx('span', {
                  className: styles.goal,
                  title: activeGoal?.condition,
                  children: goalLabel,
                })),
        ],
      }),
    ],
  });
});
//# sourceMappingURL=StatusBar.js.map
