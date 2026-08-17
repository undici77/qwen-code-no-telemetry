import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspaceActions } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { DialogShell } from './DialogShell';
import { formatRuntime } from '../../utils/formatRuntime';
import { isGoalClearKeyword } from '../../utils/goalCondition';
import styles from './GoalsDialog.module.css';
/**
 * Gap between the end of one refetch and the start of the next. Unlike
 * scheduled tasks there is no `nextRunAt` to schedule against: a goal advances
 * whenever its session finishes a turn, which the page can't predict, so it
 * polls on a slow lane.
 */
const RELOAD_INTERVAL_MS = 10_000;
/** The elapsed-time column ticks independently of the refetch. */
const TICK_INTERVAL_MS = 1000;
export function GoalsDialog({ onCreateGoal, onOpenSession, onError }) {
  const { t } = useI18n();
  const actions = useWorkspaceActions();
  const [goals, setGoals] = useState(null);
  /** Sessions the daemon could not probe; their goals are missing from `goals`. */
  const [droppedCount, setDroppedCount] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [busySessionId, setBusySessionId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [condition, setCondition] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const mountedRef = useRef(true);
  // Monotonic reload id: a slow poll that resolves after a clear's reload must
  // not resurrect the cleared goal. Only the latest reload may apply.
  const reloadSeqRef = useRef(0);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const reload = useCallback(async () => {
    const seq = ++reloadSeqRef.current;
    try {
      const list = await actions.listGoals();
      if (!mountedRef.current || seq !== reloadSeqRef.current) return;
      setGoals(list.goals);
      setDroppedCount(list.droppedCount);
      setLoadError(null);
    } catch (err) {
      if (!mountedRef.current || seq !== reloadSeqRef.current) return;
      setLoadError(err instanceof Error ? err.message : String(err));
      setGoals((prev) => prev ?? []);
      // The count described the previous, partially-probed list. This load
      // reached nothing at all, so keeping it would pin a degraded banner
      // reporting a partial probe that no longer happened.
      setDroppedCount(0);
    }
  }, [actions]);
  // One self-chaining loop owns both the initial load and the polling: each
  // fetch is scheduled only once the previous one has settled. `GET /goals`
  // probes every live session, and a wedged child holds it for the bridge's
  // ext-method timeout — the same order as this interval — so a fixed
  // setInterval would stack overlapping fan-outs. `withActionTimeout` rejects
  // the wait but does not abort the request, so those would keep running.
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const run = async () => {
      await reload();
      if (cancelled) return;
      timer = window.setTimeout(() => void run(), RELOAD_INTERVAL_MS);
    };
    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reload]);
  // Only tick the elapsed column while something is actually elapsing.
  const hasGoals = !!goals?.length;
  useEffect(() => {
    if (!hasGoals) return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [hasGoals]);
  const resetForm = useCallback(() => {
    setCondition('');
    setFormError(null);
    setShowForm(false);
  }, []);
  const handleSubmit = useCallback(async () => {
    const trimmed = condition.trim();
    if (trimmed.length === 0) {
      setFormError(t('goals.error.emptyCondition'));
      return;
    }
    // No length cap: `/goal` accepts a condition of any length, and refusing
    // one here that the daemon would accept only splits the two surfaces.
    //
    // The condition travels to the daemon as `/goal <condition>`, so a bare
    // clear keyword arrives as a clear command: the fresh session would drop
    // the goal the instant it was set, with nothing to show for it.
    if (isGoalClearKeyword(trimmed)) {
      setFormError(t('goals.error.clearKeyword', { word: trimmed }));
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await onCreateGoal(trimmed);
      if (!mountedRef.current) return;
      // No goal was started, and the caller already said why. Resetting here
      // would close the form and drop the condition the user typed.
      if (created === false) return;
      resetForm();
    } catch (err) {
      if (!mountedRef.current) {
        // The page closed while the prompt was in flight, so the inline form
        // error has nowhere to render. Toast rather than swallow it.
        onError(err, t('goals.error.createFailed'));
        return;
      }
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [condition, onCreateGoal, onError, resetForm, t]);
  const handleClear = useCallback(
    async (goal) => {
      const label =
        goal.condition.length > 60
          ? `${goal.condition.slice(0, 57)}…`
          : goal.condition;
      if (!window.confirm(t('goals.clearConfirm', { condition: label }))) {
        return;
      }
      setBusySessionId(goal.sessionId);
      try {
        await actions.clearGoal(goal.sessionId);
        await reload();
      } catch (err) {
        onError(err, t('goals.error.clearFailed'));
      } finally {
        if (mountedRef.current) setBusySessionId(null);
      }
    },
    [actions, onError, reload, t],
  );
  return _jsxs('div', {
    className: styles.root,
    children: [
      _jsx('div', { className: styles.intro, children: t('goals.subtitle') }),
      _jsxs('div', {
        className: styles.toolbar,
        children: [
          _jsx('div', {
            className: styles.count,
            children:
              goals === null
                ? t('goals.loading')
                : t('goals.count', { count: goals.length }),
          }),
          _jsxs('div', {
            className: styles.toolbarActions,
            children: [
              _jsx('button', {
                type: 'button',
                className: styles.secondaryButton,
                onClick: () => void reload(),
                children: t('goals.refresh'),
              }),
              _jsx('button', {
                type: 'button',
                className: styles.primaryButton,
                onClick: () => {
                  setCondition('');
                  setFormError(null);
                  setShowForm(true);
                },
                children: t('goals.new'),
              }),
            ],
          }),
        ],
      }),
      showForm &&
        _jsx(DialogShell, {
          title: t('goals.new'),
          size: 'md',
          onClose: resetForm,
          children: _jsxs('div', {
            className: styles.formFields,
            children: [
              _jsxs('label', {
                className: styles.field,
                children: [
                  _jsxs('span', {
                    className: styles.fieldLabel,
                    children: [
                      t('goals.condition'),
                      _jsx('span', {
                        className: styles.required,
                        children: '*',
                      }),
                    ],
                  }),
                  _jsx('textarea', {
                    className: styles.textarea,
                    value: condition,
                    rows: 4,
                    placeholder: t('goals.conditionPlaceholder'),
                    onChange: (e) => setCondition(e.target.value),
                  }),
                ],
              }),
              _jsx('div', {
                className: styles.formHint,
                children: t('goals.newHint'),
              }),
              formError &&
                _jsx('div', {
                  className: styles.formError,
                  role: 'alert',
                  children: formError,
                }),
              _jsxs('div', {
                className: styles.formActions,
                children: [
                  _jsx('button', {
                    type: 'button',
                    className: styles.secondaryButton,
                    onClick: resetForm,
                    disabled: submitting,
                    children: t('goals.cancel'),
                  }),
                  _jsx('button', {
                    type: 'button',
                    className: styles.primaryButton,
                    onClick: () => void handleSubmit(),
                    disabled: submitting,
                    children: submitting
                      ? t('goals.creating')
                      : t('goals.create'),
                  }),
                ],
              }),
            ],
          }),
        }),
      loadError &&
        _jsx('div', {
          className: styles.loadError,
          role: 'alert',
          children: loadError,
        }),
      droppedCount > 0 &&
        _jsx('div', {
          className: styles.degraded,
          'data-testid': 'goals-dropped',
          children: t('goals.dropped', { count: droppedCount }),
        }),
      goals !== null &&
        goals.length === 0 &&
        !loadError &&
        _jsx('div', { className: styles.empty, children: t('goals.empty') }),
      _jsx('div', {
        className: styles.list,
        role: 'list',
        children: (goals ?? []).map((goal) => {
          const busy = busySessionId === goal.sessionId;
          return _jsxs(
            'div',
            {
              className: styles.card,
              role: 'listitem',
              children: [
                _jsxs('div', {
                  className: styles.cardHeader,
                  children: [
                    _jsx('span', {
                      className: `${styles.statusDot} ${goal.hasActivePrompt ? styles.statusDotRunning : ''}`,
                      'aria-hidden': 'true',
                    }),
                    _jsx('div', {
                      className: styles.cardTitle,
                      title: goal.condition,
                      children: goal.condition,
                    }),
                    _jsx('div', {
                      className: styles.cardMenu,
                      children: _jsx('button', {
                        type: 'button',
                        className: styles.iconAction,
                        onClick: () => void handleClear(goal),
                        disabled: busy,
                        title: t('goals.clear'),
                        'aria-label': t('goals.clear'),
                        children: '\u2715',
                      }),
                    }),
                  ],
                }),
                goal.lastReason &&
                  _jsxs('div', {
                    className: styles.cardReason,
                    children: [
                      _jsxs('span', {
                        className: styles.reasonLabel,
                        children: [t('goal.lastCheck'), ':'],
                      }),
                      ' ',
                      goal.lastReason,
                    ],
                  }),
                _jsxs('div', {
                  className: styles.cardFooter,
                  children: [
                    _jsx('span', {
                      className: styles.statusPill,
                      children: t(
                        goal.hasActivePrompt ? 'goals.running' : 'goals.idle',
                      ),
                    }),
                    _jsx('span', {
                      className: styles.meta,
                      children:
                        goal.iterations > 0
                          ? t(
                              goal.iterations === 1
                                ? 'goal.turn'
                                : 'goal.turns',
                              {
                                count: goal.iterations,
                              },
                            )
                          : t('goals.notYetEvaluated'),
                    }),
                    _jsx('span', {
                      className: styles.meta,
                      'data-testid': 'goal-elapsed',
                      children: formatRuntime(Math.max(0, now - goal.setAt)),
                    }),
                    _jsx('button', {
                      type: 'button',
                      className: styles.sessionLink,
                      onClick: () => onOpenSession(goal.sessionId),
                      title: t('goals.openSessionHint'),
                      'aria-label': `${t('goals.openSessionHint')}: ${goal.displayName || goal.sessionId}`,
                      children: goal.displayName || goal.sessionId,
                    }),
                  ],
                }),
              ],
            },
            goal.sessionId,
          );
        }),
      }),
    ],
  });
}
//# sourceMappingURL=GoalsDialog.js.map
