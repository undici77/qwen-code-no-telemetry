import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isSessionDisconnectedError } from '../../utils/sessionErrors';
import {
  computeAgentTreeInfo,
  computeUserBlockingIds,
  reorderChildrenUnderParents,
  TREE_INDENT_MAX_LEVELS,
} from './agentForest';
import { useActions } from '@qwen-code/webui/daemon-react-sdk';
import { useDelayedGlobalKeyDown } from '../../hooks/useDelayedGlobalKeyDown';
import { useI18n } from '../../i18n';
import { formatRuntime } from '../../utils/formatRuntime';
import { formatContextTokens } from '../../utils/formatTokenCount';
import { createSentinelSerializer } from '../../utils/sentinelMessage';
import { PlanExecutionView } from './PlanExecutionView';
import {
  localizeAgentTypeName,
  localizeToolDisplayName,
  sanitizeControlChars,
} from './toolFormatting';
import { Badge } from '../ui/badge';
import styles from './TasksStatusMessage.module.css';
const ACTIVE_EVENT = 'web-shell:tasks-panel-active';
const REFRESH_INTERVAL_MS = 3000;
const LIST_MAX_ROWS = 8;
// Compact web panel budget — intentionally smaller than core's
// MAX_RECENT_ACTIVITIES (10) retention cap, which the CLI's full-height
// detail dialog renders in full.
const MAX_DISPLAYED_ACTIVITIES = 5;
const {
  serialize: serializeTasksStatusMessage,
  parse: parseRawTasksStatusMessage,
} = createSentinelSerializer('web-shell:tasks-status:v1:');
function parseTasksStatusMessage(content) {
  const parsed = parseRawTasksStatusMessage(content);
  if (!parsed || !parsed.snapshot) return null;
  return parsed;
}
export { serializeTasksStatusMessage, parseTasksStatusMessage };
function dispatchActive(id, active) {
  window.dispatchEvent(
    new CustomEvent(ACTIVE_EVENT, { detail: { id, active } }),
  );
}
function isActive(task) {
  return task.status === 'running' || task.status === 'paused';
}
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const aActive = isActive(a);
    const bActive = isActive(b);
    if (aActive !== bActive) return aActive ? -1 : 1;
    if (aActive) return b.startTime - a.startTime;
    return (b.endTime ?? b.startTime) - (a.endTime ?? a.startTime);
  });
}
/**
 * Display order for the panel: active-first sort, then each nested agent
 * grouped under its parent as a tree. The reorder is a post-pass so a tree
 * spanning the active/terminal buckets stays contiguous at whichever
 * position its root earned. Every `setTasks` site must use this (not bare
 * `sortTasks`) — selection is index-based, so list order IS the contract.
 */
function arrangeTasks(tasks) {
  return reorderChildrenUnderParents(sortTasks(tasks));
}
function statusClassName(status) {
  switch (status) {
    case 'running':
      return styles.success;
    case 'paused':
      return styles.warning;
    case 'completed':
      return styles.success;
    case 'failed':
      return styles.error;
    case 'cancelled':
      return styles.warning;
    default:
      return '';
  }
}
function statusLabel(status, t) {
  switch (status) {
    case 'running':
      return t('tasks.running');
    case 'completed':
      return t('tasks.completed');
    case 'failed':
      return t('tasks.failed');
    case 'cancelled':
      return t('tasks.cancelled');
    case 'paused':
      return t('tasks.paused');
    default:
      return status;
  }
}
function terminalStatusIcon(status) {
  switch (status) {
    case 'paused':
      return '⏸';
    case 'completed':
      return '✓';
    case 'failed':
    case 'cancelled':
      return '✗';
    case 'running':
      return null;
    default:
      return null;
  }
}
function ChevronIcon({ expanded }) {
  return _jsx('svg', {
    className: `${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`,
    viewBox: '0 0 16 16',
    'aria-hidden': 'true',
    children: _jsx('path', {
      d: 'M6 4.5 9.5 8 6 11.5',
      fill: 'none',
      stroke: 'currentColor',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  });
}
function rowLabel(task, blocking) {
  switch (task.kind) {
    case 'agent':
      // `blocking` comes from computeUserBlockingIds — an agent is tagged
      // only when its entire ancestor chain is foreground up to the
      // top-level session (cancelling it would end the user's turn), not
      // merely for being a foreground entry (a foreground child awaited by
      // a background parent blocks that parent, not the user).
      return blocking ? `[blocking] ${task.label}` : task.label;
    case 'shell':
      return `[shell] ${task.command}`;
    case 'monitor':
      return `[monitor] ${task.description}`;
  }
}
function windowTasks(tasks, selectedIndex) {
  if (tasks.length <= LIST_MAX_ROWS) {
    return {
      visible: tasks,
      windowStart: 0,
      hiddenAbove: 0,
      hiddenBelow: 0,
    };
  }
  const effectiveRows = Math.max(1, LIST_MAX_ROWS - 2);
  const windowStart = Math.max(
    0,
    Math.min(
      selectedIndex - Math.floor(effectiveRows / 2),
      tasks.length - effectiveRows,
    ),
  );
  const windowEnd = Math.min(tasks.length, windowStart + effectiveRows);
  return {
    visible: tasks.slice(windowStart, windowEnd),
    windowStart,
    hiddenAbove: windowStart,
    hiddenBelow: tasks.length - windowEnd,
  };
}
function formatActivityLabel(name, description, t) {
  const display = localizeToolDisplayName(name, t);
  const singleLineDescription = description
    ? description.replace(/\s*\n\s*/g, ' ').trim()
    : '';
  const label = singleLineDescription
    ? `${display}(${singleLineDescription})`
    : display;
  // The description is LLM-generated; strip bare control bytes so a stray
  // \r/BEL/ESC can't garble the panel (matches the CLI surfaces).
  return sanitizeControlChars(label);
}
export function TasksStatusMessage({
  message,
  embedded = false,
  manageActiveEvent = true,
  onClose,
  planTodos = [],
  agentTools = [],
  onOpenSubagent,
  onOpenMonitor,
}) {
  const { t } = useI18n();
  const actions = useActions();
  const [tasks, setTasks] = useState(() =>
    arrangeTasks(message.snapshot.tasks),
  );
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [actionError, setActionError] = useState(null);
  const panelIdRef = useRef(`tasks-${Math.random().toString(36).slice(2)}`);
  const refreshInFlightRef = useRef(false);
  const initialDetailStatusRef = useRef(null);
  const clampedSelectedIndex =
    tasks.length === 0 ? 0 : Math.min(selectedIndex, tasks.length - 1);
  const selectedTask = tasks[clampedSelectedIndex] ?? null;
  // Tree metadata is computed on the full task list (not the windowed
  // slice) so a row's indent doesn't shift when the window scrolls past
  // its parent.
  const treeInfo = useMemo(() => computeAgentTreeInfo(tasks), [tasks]);
  const blockingIds = useMemo(() => computeUserBlockingIds(tasks), [tasks]);
  useEffect(() => {
    if (!isOpen) return;
    const refresh = () => {
      if (refreshInFlightRef.current) return;
      refreshInFlightRef.current = true;
      actions
        .getTasks()
        .then((snapshot) => {
          setTasks(arrangeTasks(snapshot.tasks));
          setRefreshError(false);
        })
        .catch((error) => {
          if (isSessionDisconnectedError(error)) {
            setRefreshError(false);
            return;
          }
          console.warn('[web-shell] failed to refresh tasks:', error);
          setRefreshError(true);
        })
        .finally(() => {
          refreshInFlightRef.current = false;
        });
    };
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isOpen, actions]);
  useEffect(() => {
    if (tasks.length === 0 && selectedIndex !== 0) {
      setSelectedIndex(0);
    }
    if (selectedIndex >= tasks.length && tasks.length > 0) {
      setSelectedIndex(tasks.length - 1);
    }
  }, [tasks.length, selectedIndex]);
  useEffect(() => {
    if (!isOpen || step !== 'detail') {
      initialDetailStatusRef.current = null;
      return;
    }
    if (!selectedTask) {
      initialDetailStatusRef.current = null;
      setStep('list');
      return;
    }
    const initial = initialDetailStatusRef.current;
    if (!initial || initial.taskId !== selectedTask.id) {
      initialDetailStatusRef.current = {
        taskId: selectedTask.id,
        status: selectedTask.status,
      };
      return;
    }
    if (initial.status === 'running' && selectedTask.status !== 'running') {
      setPendingCancelId(null);
      setStep('list');
    }
  }, [isOpen, step, selectedTask]);
  useEffect(() => {
    if (!manageActiveEvent) return undefined;
    const id = panelIdRef.current;
    dispatchActive(id, isOpen);
    return () => dispatchActive(id, false);
  }, [isOpen, manageActiveEvent]);
  useEffect(() => {
    if (!manageActiveEvent) return undefined;
    const onActiveChange = (event) => {
      const detail = event.detail;
      if (detail?.active && detail.id && detail.id !== panelIdRef.current) {
        setIsOpen(false);
      }
    };
    window.addEventListener(ACTIVE_EVENT, onActiveChange);
    return () => window.removeEventListener(ACTIVE_EVENT, onActiveChange);
  }, [manageActiveEvent]);
  useEffect(() => {
    if (!isOpen) onClose?.();
  }, [isOpen, onClose]);
  const handleCancel = useCallback(
    async (task) => {
      if (busy) return;
      const isRunning = task.status === 'running';
      const isAbandonable = task.kind === 'agent' && task.status === 'paused';
      if (!isRunning && !isAbandonable) return;
      // Two-step confirm only when cancelling would end the USER's turn —
      // the same chain-aware verdict as the `[blocking]` row prefix. A
      // foreground child awaited by a *background* parent unblocks that
      // parent, not the user, so it cancels on the first press like any
      // background entry. Mirrors BackgroundTasksDialog's cancel gate.
      const isUserBlockingAgent =
        task.kind === 'agent' && blockingIds.has(task.id);
      if (isUserBlockingAgent && pendingCancelId !== task.id) {
        setPendingCancelId(task.id);
        return;
      }
      setPendingCancelId(null);
      setBusy(true);
      try {
        const result = await actions.cancelTask(task.id, task.kind);
        if (!result.cancelled) {
          setActionError(t('tasks.alreadyStopped'));
          return;
        }
        const snapshot = await actions.getTasks();
        setTasks(arrangeTasks(snapshot.tasks));
        setActionError(null);
      } catch (error) {
        console.warn('[web-shell] failed to cancel task:', error);
        setActionError(t('tasks.cancelFailed'));
      } finally {
        setBusy(false);
      }
    },
    [actions, busy, blockingIds, pendingCancelId, t],
  );
  useDelayedGlobalKeyDown(
    (event) => {
      if (!isOpen) return;
      if (
        event.key !== 'Escape' &&
        event.target instanceof Element &&
        event.target.closest('[data-plan-interactive]')
      ) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (pendingCancelId) {
          setPendingCancelId(null);
          return;
        }
        if (step === 'detail') {
          setStep('list');
        } else {
          setIsOpen(false);
        }
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopPropagation();
        if (step === 'detail') {
          setPendingCancelId(null);
          setStep('list');
        } else {
          setIsOpen(false);
        }
        return;
      }
      if (
        (event.key === 'ArrowUp' || event.key === 'ArrowDown') &&
        step === 'list'
      ) {
        event.preventDefault();
        event.stopPropagation();
        if (tasks.length === 0) return;
        const delta = event.key === 'ArrowUp' ? -1 : 1;
        setSelectedIndex((current) =>
          Math.min(Math.max(current + delta, 0), tasks.length - 1),
        );
        setPendingCancelId(null);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        if (step === 'list' && selectedTask) {
          if (embedded && selectedTask.kind === 'monitor' && onOpenMonitor) {
            onOpenMonitor(selectedTask);
          } else {
            setStep('detail');
          }
        } else if (step === 'detail') {
          setIsOpen(false);
        }
        return;
      }
      if (event.key === ' ' && step === 'detail') {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
        return;
      }
      if (event.key === 'x' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        if (selectedTask) {
          void handleCancel(selectedTask);
        }
        return;
      }
    },
    [
      embedded,
      isOpen,
      step,
      tasks.length,
      selectedTask,
      handleCancel,
      onOpenMonitor,
      pendingCancelId,
    ],
  );
  if (!isOpen) return null;
  const showCancelConfirm =
    pendingCancelId !== null &&
    selectedTask !== null &&
    pendingCancelId === selectedTask.id;
  const listHints = [];
  if (showCancelConfirm) {
    listHints.push(t('tasks.confirmStop'));
    listHints.push(t('tasks.shortcut.cancelConfirm'));
  } else {
    listHints.push(t('tasks.shortcut.select'));
    listHints.push(t('tasks.shortcut.view'));
    if (selectedTask?.status === 'running') {
      listHints.push(t('tasks.shortcut.stop'));
    } else if (
      selectedTask?.kind === 'agent' &&
      selectedTask?.status === 'paused'
    ) {
      listHints.push(t('tasks.shortcut.abandon'));
    }
    listHints.push(t('tasks.shortcut.listClose'));
  }
  const detailHints = [];
  if (showCancelConfirm) {
    detailHints.push(t('tasks.confirmStop'));
    detailHints.push(t('tasks.shortcut.cancelConfirm'));
  } else {
    detailHints.push(t('tasks.shortcut.detailBack'));
    detailHints.push(t('tasks.shortcut.detailClose'));
    if (selectedTask?.status === 'running') {
      detailHints.push(t('tasks.shortcut.stop'));
    } else if (
      selectedTask?.kind === 'agent' &&
      selectedTask?.status === 'paused'
    ) {
      detailHints.push(t('tasks.shortcut.abandon'));
    }
  }
  if (tasks.length === 0) {
    return _jsxs('div', {
      className: embedded
        ? `${styles.panel} ${styles.embeddedPanel}`
        : styles.panel,
      'data-keyboard-scope': true,
      children: [
        (refreshError || actionError || !embedded) &&
          _jsxs('div', {
            className: styles.header,
            children: [
              !embedded &&
                _jsx('div', {
                  className: styles.title,
                  children: t('tasks.title'),
                }),
              refreshError &&
                _jsx('div', {
                  className: styles.warning,
                  children: t('tasks.refreshStale'),
                }),
              actionError &&
                _jsx('div', { className: styles.error, children: actionError }),
            ],
          }),
        _jsx(PlanExecutionView, {
          todos: planTodos,
          tools: agentTools,
          tasks: tasks,
          onOpenSubagent: onOpenSubagent,
        }),
        _jsx('div', {
          children: _jsx('div', {
            className: styles.secondary,
            children: t('tasks.empty'),
          }),
        }),
        !embedded &&
          _jsx('div', {
            className: styles.shortcuts,
            children: t('tasks.shortcut.close'),
          }),
      ],
    });
  }
  const { visible, windowStart, hiddenAbove, hiddenBelow } = windowTasks(
    tasks,
    clampedSelectedIndex,
  );
  const listTasks = embedded ? tasks : visible;
  const listOffset = embedded ? 0 : windowStart;
  return _jsxs('div', {
    className: embedded
      ? `${styles.panel} ${styles.embeddedPanel}`
      : styles.panel,
    'data-keyboard-scope': true,
    children: [
      (embedded || step === 'list') &&
        (refreshError || actionError || !embedded) &&
        _jsxs('div', {
          className: styles.header,
          children: [
            !embedded &&
              _jsx('div', {
                className: styles.title,
                children: t('tasks.title'),
              }),
            refreshError &&
              _jsx('div', {
                className: styles.warning,
                children: t('tasks.refreshStale'),
              }),
            actionError &&
              _jsx('div', { className: styles.error, children: actionError }),
          ],
        }),
      (embedded || step === 'list') &&
        _jsx(PlanExecutionView, {
          todos: planTodos,
          tools: agentTools,
          tasks: tasks,
          onOpenSubagent: onOpenSubagent,
        }),
      (embedded || step === 'list') &&
        _jsxs('div', {
          className: styles.list,
          children: [
            !embedded &&
              _jsxs('div', {
                className: styles.sectionTitle,
                children: [
                  t('tasks.title'),
                  ' ',
                  _jsxs('span', {
                    className: styles.secondary,
                    children: ['(', tasks.length, ')'],
                  }),
                ],
              }),
            !embedded &&
              hiddenAbove > 0 &&
              _jsx('div', {
                className: styles.overflowHint,
                children: t('tasks.moreAbove', { count: hiddenAbove }),
              }),
            listTasks.map((task, visibleIndex) => {
              const index = listOffset + visibleIndex;
              const selected = index === clampedSelectedIndex;
              const stClass = statusClassName(task.status);
              const taskStatusLabel = statusLabel(task.status, t);
              const expanded = embedded && selected && step === 'detail';
              const showSelected = embedded ? expanded : selected;
              const tree =
                task.kind === 'agent' ? treeInfo.get(task.id) : undefined;
              // Indent clamps so deep trees don't starve the label column;
              // the detail view's nesting line carries the exact depth.
              const indentLevels = Math.min(
                tree?.visibleDepth ?? 0,
                TREE_INDENT_MAX_LEVELS,
              );
              // The ↳ marker is kept even for orphans (parent already gone,
              // depth back at 0) so "this was a nested agent" stays legible.
              const nestedMarker =
                task.kind === 'agent' && task.parentAgentId != null;
              const orphanNote = tree?.orphaned
                ? task.kind === 'agent' && task.parentName
                  ? t('tasks.row.from', { parent: task.parentName })
                  : t('tasks.row.nested')
                : null;
              return _jsxs(
                'div',
                {
                  className: `${styles.task} ${expanded ? styles.taskExpanded : ''}`,
                  children: [
                    _jsxs('div', {
                      className: showSelected
                        ? `${styles.row} ${styles.selected}`
                        : styles.row,
                      onClick: () => {
                        setSelectedIndex(index);
                        if (
                          embedded &&
                          task.kind === 'monitor' &&
                          onOpenMonitor
                        ) {
                          onOpenMonitor(task);
                        } else {
                          setStep(embedded && expanded ? 'list' : 'detail');
                        }
                      },
                      onMouseEnter: () => {
                        if (!embedded) setSelectedIndex(index);
                      },
                      children: [
                        _jsx('span', {
                          className: styles.pointer,
                          children: showSelected ? '❯' : '',
                        }),
                        embedded &&
                          _jsx('span', {
                            className: styles.taskIcon,
                            'aria-hidden': 'true',
                          }),
                        _jsxs('span', {
                          className: styles.nameCell,
                          style:
                            indentLevels > 0
                              ? { paddingLeft: `${indentLevels * 16}px` }
                              : undefined,
                          children: [
                            nestedMarker &&
                              _jsx('span', {
                                className: styles.treeMarker,
                                'aria-hidden': 'true',
                                children: '↳ ',
                              }),
                            rowLabel(task, blockingIds.has(task.id)),
                            orphanNote &&
                              _jsxs('span', {
                                className: styles.orphanNote,
                                children: [' · ', orphanNote],
                              }),
                          ],
                        }),
                        _jsx('span', {
                          className: `${styles.status} ${stClass}`,
                          children: taskStatusLabel,
                        }),
                        _jsx('span', {
                          className: styles.chevronCell,
                          children: _jsx(ChevronIcon, { expanded: expanded }),
                        }),
                      ],
                    }),
                    expanded &&
                      _jsx('div', {
                        className: styles.inlineDetail,
                        children: _jsx(TaskDetail, {
                          task: task,
                          t: t,
                          hideHeader: true,
                          busy: busy,
                          showCancelConfirm: pendingCancelId === task.id,
                          onCancel: () => void handleCancel(task),
                          onCancelConfirmDismiss: () =>
                            setPendingCancelId(null),
                        }),
                      }),
                  ],
                },
                task.id,
              );
            }),
            !embedded &&
              hiddenBelow > 0 &&
              _jsx('div', {
                className: styles.overflowHint,
                children: t('tasks.moreBelow', { count: hiddenBelow }),
              }),
          ],
        }),
      !embedded &&
        step === 'detail' &&
        selectedTask &&
        _jsxs(_Fragment, {
          children: [
            actionError &&
              _jsx('div', { className: styles.error, children: actionError }),
            _jsx(TaskDetail, {
              task: selectedTask,
              t: t,
              busy: busy,
              showCancelConfirm: pendingCancelId === selectedTask.id,
              onCancel: () => void handleCancel(selectedTask),
              onCancelConfirmDismiss: () => setPendingCancelId(null),
            }),
          ],
        }),
      !embedded &&
        _jsx('div', {
          className: showCancelConfirm
            ? `${styles.shortcuts} ${styles.confirmHint}`
            : styles.shortcuts,
          children: (step === 'list' ? listHints : detailHints).join(' · '),
        }),
    ],
  });
}
function detailTitle(task, t) {
  switch (task.kind) {
    case 'agent':
      return `${task.subagentType ? localizeAgentTypeName(task.subagentType, t) : t('common.agent')} › ${task.label}`;
    case 'shell':
      return `${t('tasks.kind.shell')} › ${task.command}`;
    case 'monitor':
      return `${t('tasks.kind.monitor')} › ${task.description}`;
  }
}
export function MonitorTaskDetail({ task, actions: providedActions }) {
  const { t } = useI18n();
  const contextActions = useActions();
  const actions = providedActions ?? contextActions;
  const [currentTask, setCurrentTask] = useState(task);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  useEffect(() => {
    setCurrentTask((current) =>
      current.id === task.id &&
      current.status !== 'running' &&
      task.status === 'running'
        ? current
        : task,
    );
  }, [task]);
  useEffect(() => {
    setActionError(null);
  }, [task.id, task.status]);
  const handleCancel = useCallback(async () => {
    if (busy || currentTask.status !== 'running') return;
    setActionError(null);
    setBusy(true);
    try {
      const result = await actions.cancelTask(currentTask.id, 'monitor');
      if (!result.cancelled) {
        setActionError(t('tasks.alreadyStopped'));
        return;
      }
      setCurrentTask({
        ...currentTask,
        status: 'cancelled',
        endTime: Date.now(),
      });
      setActionError(null);
      try {
        const snapshot = await actions.getTasks();
        const updatedTask = snapshot.tasks.find(
          (candidate) =>
            candidate.kind === 'monitor' && candidate.id === currentTask.id,
        );
        if (updatedTask && updatedTask.status !== 'running') {
          setCurrentTask(updatedTask);
        }
      } catch (error) {
        console.warn('[web-shell] failed to refresh stopped monitor:', error);
      }
    } catch (error) {
      console.warn('[web-shell] failed to cancel monitor:', error);
      setActionError(t('tasks.cancelFailed'));
    } finally {
      setBusy(false);
    }
  }, [actions, busy, currentTask, t]);
  return _jsxs('div', {
    className: styles.monitorDetail,
    children: [
      _jsxs('div', {
        className: styles.monitorOverview,
        children: [
          _jsxs('div', {
            className: styles.monitorHeadingRow,
            children: [
              _jsx('div', {
                className: styles.monitorDescription,
                children: currentTask.description,
              }),
              _jsxs('div', {
                className: styles.monitorStatusActions,
                children: [
                  _jsx(Badge, {
                    variant: 'outline',
                    className: styles.monitorStatusTag,
                    'data-status': currentTask.status,
                    children: statusLabel(currentTask.status, t),
                  }),
                  currentTask.status === 'running' &&
                    _jsx('button', {
                      type: 'button',
                      className: styles.monitorStopButton,
                      disabled: busy,
                      onClick: () => void handleCancel(),
                      children: busy
                        ? t('common.loading')
                        : t('tasks.action.stop'),
                    }),
                ],
              }),
            ],
          }),
          actionError &&
            _jsx('div', {
              className: styles.monitorActionError,
              children: actionError,
            }),
          _jsxs('div', {
            className: styles.monitorMetrics,
            children: [
              _jsx(MonitorMetric, {
                label: t('tasks.detail.runtime'),
                value: formatRuntime(currentTask.runtimeMs),
              }),
              _jsx(MonitorMetric, {
                label: t('tasks.detail.eventCount'),
                value: String(currentTask.eventCount),
              }),
              currentTask.pid !== undefined &&
                _jsx(MonitorMetric, {
                  label: t('tasks.detail.pid'),
                  value: String(currentTask.pid),
                }),
              currentTask.eventCount > 0 &&
                _jsx(MonitorMetric, {
                  label: t('tasks.detail.lastEvent'),
                  value: new Date(
                    currentTask.lastEventTime,
                  ).toLocaleTimeString(),
                }),
              currentTask.droppedLines > 0 &&
                _jsx(MonitorMetric, {
                  label: t('tasks.detail.droppedCount'),
                  value: String(currentTask.droppedLines),
                }),
              currentTask.exitCode !== undefined &&
                _jsx(MonitorMetric, {
                  label: t('tasks.detail.exitCode'),
                  value: String(currentTask.exitCode),
                }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: styles.monitorCommandSection,
        children: [
          _jsx('div', {
            className: styles.monitorSectionLabel,
            children: t('tasks.detail.command'),
          }),
          _jsx('pre', {
            className: styles.monitorCommand,
            children: currentTask.command,
          }),
        ],
      }),
      currentTask.error &&
        _jsxs('div', {
          className: styles.monitorError,
          children: [
            _jsx('div', {
              className: styles.monitorSectionLabel,
              children: t('tasks.detail.error'),
            }),
            _jsx('div', { children: currentTask.error }),
          ],
        }),
    ],
  });
}
export function ShellTaskDetail({ task, actions: providedActions }) {
  const { t } = useI18n();
  const contextActions = useActions();
  const actions = providedActions ?? contextActions;
  const [currentTask, setCurrentTask] = useState(task);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  useEffect(() => {
    setCurrentTask((current) =>
      current.id === task.id &&
      current.status !== 'running' &&
      task.status === 'running'
        ? current
        : task,
    );
  }, [task]);
  useEffect(() => {
    setActionError(null);
  }, [task.id, task.status]);
  const handleCancel = useCallback(async () => {
    if (busy || currentTask.status !== 'running') return;
    setActionError(null);
    setBusy(true);
    try {
      const result = await actions.cancelTask(currentTask.id, 'shell');
      if (!result.cancelled) {
        setActionError(t('tasks.alreadyStopped'));
        return;
      }
      setCurrentTask({
        ...currentTask,
        status: 'cancelled',
        endTime: Date.now(),
      });
      try {
        const snapshot = await actions.getTasks();
        const updatedTask = snapshot.tasks.find(
          (candidate) =>
            candidate.kind === 'shell' && candidate.id === currentTask.id,
        );
        if (updatedTask && updatedTask.status !== 'running') {
          setCurrentTask(updatedTask);
        }
      } catch (error) {
        console.warn(
          '[web-shell] failed to refresh stopped shell task:',
          error,
        );
      }
    } catch (error) {
      console.warn('[web-shell] failed to cancel shell task:', error);
      setActionError(t('tasks.cancelFailed'));
    } finally {
      setBusy(false);
    }
  }, [actions, busy, currentTask, t]);
  return _jsxs('div', {
    className: styles.monitorDetail,
    children: [
      _jsxs('div', {
        className: styles.monitorOverview,
        children: [
          _jsxs('div', {
            className: styles.monitorHeadingRow,
            children: [
              _jsx('div', {
                className: styles.monitorDescription,
                children: t('tasks.kind.shell'),
              }),
              _jsxs('div', {
                className: styles.monitorStatusActions,
                children: [
                  _jsx(Badge, {
                    variant: 'outline',
                    className: styles.monitorStatusTag,
                    'data-status': currentTask.status,
                    children: statusLabel(currentTask.status, t),
                  }),
                  currentTask.status === 'running' &&
                    _jsx('button', {
                      type: 'button',
                      className: styles.monitorStopButton,
                      disabled: busy,
                      onClick: () => void handleCancel(),
                      children: busy
                        ? t('common.loading')
                        : t('tasks.action.stop'),
                    }),
                ],
              }),
            ],
          }),
          _jsx('pre', {
            className: styles.monitorCommand,
            children: currentTask.command,
          }),
          actionError &&
            _jsx('div', {
              className: styles.monitorActionError,
              children: actionError,
            }),
          _jsxs('div', {
            className: styles.monitorMetrics,
            children: [
              _jsx(MonitorMetric, {
                label: t('tasks.detail.runtime'),
                value: formatRuntime(currentTask.runtimeMs),
              }),
              currentTask.pid !== undefined &&
                _jsx(MonitorMetric, {
                  label: t('tasks.detail.pid'),
                  value: String(currentTask.pid),
                }),
              currentTask.exitCode !== undefined &&
                _jsx(MonitorMetric, {
                  label: t('tasks.detail.exitCode'),
                  value: String(currentTask.exitCode),
                }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: styles.shellFields,
        children: [
          _jsxs('div', {
            className: styles.monitorCommandSection,
            children: [
              _jsx('div', {
                className: styles.monitorSectionLabel,
                children: t('tasks.detail.workingDir'),
              }),
              _jsx('div', {
                className: styles.shellFieldValue,
                children: currentTask.cwd,
              }),
            ],
          }),
          currentTask.outputFile &&
            _jsxs('div', {
              className: styles.monitorCommandSection,
              children: [
                _jsx('div', {
                  className: styles.monitorSectionLabel,
                  children: t('tasks.detail.outputFile'),
                }),
                _jsx('div', {
                  className: styles.shellFieldValue,
                  children: currentTask.outputFile,
                }),
              ],
            }),
        ],
      }),
      currentTask.error &&
        _jsxs('div', {
          className: `${styles.monitorError} ${styles.shellError}`,
          children: [
            _jsx('div', {
              className: styles.monitorSectionLabel,
              children: t('tasks.detail.error'),
            }),
            _jsx('div', { children: currentTask.error }),
          ],
        }),
    ],
  });
}
function MonitorMetric({ label, value }) {
  return _jsxs('div', {
    className: styles.monitorMetric,
    children: [
      _jsx('div', { className: styles.monitorMetricValue, children: value }),
      _jsx('div', { className: styles.monitorMetricLabel, children: label }),
    ],
  });
}
function TaskDetail({
  task,
  t,
  hideHeader = false,
  busy = false,
  showCancelConfirm = false,
  onCancel,
  onCancelConfirmDismiss,
}) {
  const terminalIcon = terminalStatusIcon(task.status);
  const stClass = statusClassName(task.status);
  const isAbandonable = task.kind === 'agent' && task.status === 'paused';
  const canCancel = task.status === 'running' || isAbandonable;
  const cancelLabel = isAbandonable
    ? t('tasks.action.abandon')
    : t('tasks.action.stop');
  const confirmLabel = isAbandonable
    ? t('tasks.action.confirmAbandon')
    : t('tasks.action.confirmStop');
  const subtitleParts = [formatRuntime(task.runtimeMs)];
  const compactFields = [
    {
      label: t('tasks.detail.runtime'),
      value: formatRuntime(task.runtimeMs),
    },
  ];
  const agentOutputTokens =
    task.kind === 'agent'
      ? (task.stats?.['outputTokens'] ?? task.stats?.totalTokens)
      : undefined;
  if (agentOutputTokens) {
    subtitleParts.push(
      t('tasks.detail.tokens', {
        count: formatContextTokens(agentOutputTokens),
      }),
    );
    compactFields.push({
      label: t('tasks.detail.tokenCount'),
      value: formatContextTokens(agentOutputTokens),
    });
  }
  if (task.kind === 'agent' && task.stats?.toolUses !== undefined) {
    subtitleParts.push(
      t('tasks.detail.toolCalls', {
        count: task.stats.toolUses,
      }),
    );
    compactFields.push({
      label: t('tasks.detail.toolCallCount'),
      value: String(task.stats.toolUses),
    });
  }
  if (task.kind !== 'agent' && task.pid !== undefined) {
    subtitleParts.push(`pid ${task.pid}`);
  }
  if (task.kind === 'shell' && task.exitCode !== undefined) {
    subtitleParts.push(t('tasks.detail.exit', { exitCode: task.exitCode }));
  }
  if (task.kind === 'monitor') {
    subtitleParts.push(t('tasks.detail.events', { count: task.eventCount }));
    if (task.droppedLines > 0) {
      subtitleParts.push(
        t('tasks.detail.dropped', { count: task.droppedLines }),
      );
    }
    if (task.exitCode !== undefined) {
      subtitleParts.push(t('tasks.detail.exit', { exitCode: task.exitCode }));
    }
  }
  const promptLines =
    task.kind === 'agent' && task.prompt ? task.prompt.split('\n') : [];
  const actionControls =
    canCancel && onCancel
      ? _jsx('div', {
          className: styles.actionBar,
          children: showCancelConfirm
            ? _jsxs(_Fragment, {
                children: [
                  _jsx('span', {
                    className: styles.actionHint,
                    children: t('tasks.action.confirmHint'),
                  }),
                  _jsx('button', {
                    type: 'button',
                    className: `${styles.actionButton} ${styles.dangerButton}`,
                    disabled: busy,
                    onClick: onCancel,
                    children: confirmLabel,
                  }),
                  _jsx('button', {
                    type: 'button',
                    className: styles.actionButton,
                    onClick: onCancelConfirmDismiss,
                    children: t('common.cancel'),
                  }),
                ],
              })
            : _jsx('button', {
                type: 'button',
                className: `${styles.actionButton} ${styles.dangerButton}`,
                disabled: busy,
                onClick: onCancel,
                children: cancelLabel,
              }),
        })
      : null;
  const headerContent = !hideHeader
    ? _jsxs(_Fragment, {
        children: [
          _jsx('div', {
            className: styles.title,
            children: detailTitle(task, t),
          }),
          _jsxs('div', {
            className: styles.statusBadge,
            children: [
              terminalIcon &&
                _jsxs(_Fragment, {
                  children: [
                    _jsxs('span', {
                      className: stClass,
                      children: [terminalIcon, ' ', t(`tasks.${task.status}`)],
                    }),
                    _jsx('span', {
                      className: styles.separator,
                      children: '\u00B7',
                    }),
                  ],
                }),
              _jsx('span', {
                className: styles.secondary,
                children: subtitleParts.join(' · '),
              }),
            ],
          }),
        ],
      })
    : compactFields.length > 0
      ? _jsx('div', {
          className: styles.compactSummary,
          children: compactFields
            .map((field) => `${field.label} ${field.value}`)
            .join(' · '),
        })
      : null;
  return _jsxs('div', {
    className: styles.detail,
    children: [
      (headerContent || actionControls) &&
        _jsxs('div', {
          className: styles.detailTop,
          children: [
            headerContent &&
              _jsx('div', {
                className: styles.detailTopMain,
                children: headerContent,
              }),
            actionControls,
          ],
        }),
      task.kind === 'shell' &&
        _jsxs(_Fragment, {
          children: [
            _jsx(DetailField, {
              label: t('tasks.detail.workingDir'),
              value: task.cwd,
            }),
            task.outputFile &&
              _jsx(DetailField, {
                label: t('tasks.detail.outputFile'),
                value: task.outputFile,
              }),
          ],
        }),
      task.kind === 'monitor' &&
        _jsx(DetailField, {
          label: t('tasks.detail.command'),
          value: task.command,
        }),
      task.kind === 'agent' &&
        task.subagentType &&
        _jsx(DetailField, {
          label: t('tasks.detail.type'),
          value: localizeAgentTypeName(task.subagentType, t),
        }),
      task.kind === 'agent' &&
        (task.depth ?? 0) > 0 &&
        _jsx(DetailField, {
          label: t('tasks.detail.nesting'),
          value:
            // User-facing level = launch depth + 1 (depth 0 = spawned by
            // the top-level session). Unlike the row indent, this is the
            // absolute launch level, unaffected by departed ancestors.
            task.parentName
              ? t('tasks.detail.nestingValue', {
                  level: (task.depth ?? 0) + 1,
                  parent: task.parentName,
                })
              : t('tasks.detail.nestingLevel', {
                  level: (task.depth ?? 0) + 1,
                }),
        }),
      task.kind === 'agent' &&
        task.recentActivities &&
        task.recentActivities.length > 0 &&
        _jsxs('div', {
          className: styles.detailField,
          children: [
            _jsx('div', {
              className: styles.detailFieldLabel,
              children: t('tasks.detail.progress'),
            }),
            _jsx('div', {
              className: styles.detailContent,
              children: task.recentActivities
                .slice(-MAX_DISPLAYED_ACTIVITIES)
                .map((a, i, arr) => {
                  const isLast = i === arr.length - 1;
                  const desc = formatActivityLabel(a.name, a.description, t);
                  return _jsxs(
                    'div',
                    {
                      className: isLast
                        ? styles.activityCurrent
                        : styles.activityPast,
                      children: [isLast ? '> ' : '  ', desc],
                    },
                    `${a.at}-${i}`,
                  );
                }),
            }),
          ],
        }),
      task.kind === 'agent' &&
        task.prompt &&
        _jsxs('div', {
          className: styles.detailField,
          children: [
            _jsx('div', {
              className: styles.detailFieldLabel,
              children: t('tasks.detail.prompt'),
            }),
            _jsx('div', {
              className: styles.promptContent,
              children: promptLines
                .slice(0, 5)
                .map((line, i, arr) =>
                  _jsx(
                    'div',
                    {
                      children:
                        i === arr.length - 1 && promptLines.length > 5
                          ? `${line}…`
                          : line || ' ',
                    },
                    i,
                  ),
                ),
            }),
          ],
        }),
      task.kind === 'agent' &&
        task.outputFile &&
        _jsx(DetailField, {
          label: t('tasks.detail.outputFile'),
          value: task.outputFile,
        }),
      task.kind === 'agent' &&
        task.status === 'paused' &&
        task.resumeBlockedReason &&
        _jsxs('div', {
          className: styles.detailField,
          children: [
            _jsx('div', {
              className: `${styles.detailFieldLabel} ${styles.error}`,
              children: t('tasks.detail.resumeBlocked'),
            }),
            _jsx('div', {
              className: styles.error,
              children: task.resumeBlockedReason,
            }),
          ],
        }),
      task.error &&
        _jsxs('div', {
          className: styles.detailField,
          children: [
            _jsx('div', {
              className: `${styles.detailFieldLabel} ${
                task.kind === 'monitor' && task.status !== 'failed'
                  ? styles.warning
                  : styles.error
              }`,
              children:
                task.kind === 'monitor' && task.status !== 'failed'
                  ? t('tasks.detail.stoppedBecause')
                  : t('tasks.detail.error'),
            }),
            _jsx('div', {
              className:
                task.kind === 'monitor' && task.status !== 'failed'
                  ? styles.warning
                  : styles.error,
              children: task.error,
            }),
          ],
        }),
    ],
  });
}
function DetailField({ label, value }) {
  return _jsxs('div', {
    className: styles.detailField,
    children: [
      _jsx('div', { className: styles.detailFieldLabel, children: label }),
      _jsx('div', { className: styles.detailContent, children: value }),
    ],
  });
}
export { ACTIVE_EVENT as TASKS_STATUS_ACTIVE_EVENT };
//# sourceMappingURL=TasksStatusMessage.js.map
