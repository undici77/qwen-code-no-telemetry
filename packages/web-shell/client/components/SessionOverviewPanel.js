import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useConnection,
  useStatusReport,
} from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../i18n';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { buildSplitUrl, MAX_SPLIT_PANES } from '../utils/splitUrl';
import {
  hasMultipleWorkspaces,
  isNonPrimaryWorkspaceSession,
  mergeSessionsById,
  workspaceLabelForCwd,
} from '../utils/workspace';
import { useOtherWorkspaceSessions } from '../hooks/useOtherWorkspaceSessions';
import { useScopedSessions } from '../hooks/useScopedSessions';
import { getDaemonToken } from '../config/daemon';
import {
  SESSION_LIST_PAGE_SIZE,
  SESSION_ORGANIZATION_FEATURE,
} from '../constants/sessions';
import { ErrorBoundary } from './ErrorBoundary';
import { getModelDisplayName } from '../utils/modelDisplay';
import styles from './SessionOverviewPanel.module.css';
// The list is cheap to poll (it's the same endpoint the sidebar already hits),
// so it drives the primary running/idle liveness at a snappy cadence. The
// detail=full status report is materially more expensive — it aggregates
// per-session diagnostics and can spawn the ACP child — so DaemonStatusDialog
// deliberately never polls it. We do poll it here, but slowly: it is the only
// source of the per-session "needs approval" signal, which is the whole point
// of a mission-control view, and a bounded 10s cadence keeps the cost in check
// while approval badges stay live-enough. Both polls pause when the tab is
// hidden or a previous request is still outstanding.
const LIST_POLL_MS = 3000;
const STATUS_POLL_MS = 10000;
const STATUS_PRIORITY = {
  needsApproval: 0,
  running: 1,
  idle: 2,
};
/**
 * Merge the (cheap, all-sessions) list with the (richer, loaded-sessions-only)
 * status report into one ranked set of cards. `needsApproval` is derived from
 * the status report's `pendingPermissionCount` and takes precedence over
 * `running` because it is the actionable state — the session is blocked waiting
 * for the user. Cold sessions absent from the status report simply read as
 * idle. Sorted needs-approval → running → idle, then most-recent first, so the
 * sessions that want attention float to the top of a 10+ session grid.
 */
export function deriveSessionCards(
  sessions,
  statusSessions,
  currentSessionId,
  primaryCwd,
) {
  const statusById = new Map(
    statusSessions.map((session) => [session.sessionId, session]),
  );
  const cards = sessions.map((session) => {
    const status = statusById.get(session.sessionId);
    const running = session.hasActivePrompt ?? status?.hasActivePrompt ?? false;
    const needsApproval = (status?.pendingPermissionCount ?? 0) > 0;
    return {
      sessionId: session.sessionId,
      label: session.displayName?.trim() || session.sessionId.slice(0, 8),
      status: needsApproval ? 'needsApproval' : running ? 'running' : 'idle',
      clientCount: session.clientCount ?? status?.clientCount ?? 0,
      model: status?.currentModelId?.startsWith('qwen-route:')
        ? undefined
        : status?.currentModelId
          ? getModelDisplayName(status.currentModelId)
          : undefined,
      updatedAt: session.updatedAt || session.createdAt,
      color: session.color,
      isCurrent: session.sessionId === currentSessionId,
      workspaceCwd: session.workspaceCwd,
      isNonPrimary: isNonPrimaryWorkspaceSession(
        session.workspaceCwd,
        primaryCwd,
      ),
    };
  });
  cards.sort((a, b) => {
    const byStatus = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (byStatus !== 0) return byStatus;
    // ISO timestamps sort lexicographically; newest first.
    return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
  });
  return cards;
}
function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}
function colorDotClass(color) {
  switch (color) {
    case 'red':
      return styles.colorRed;
    case 'orange':
      return styles.colorOrange;
    case 'yellow':
      return styles.colorYellow;
    case 'green':
      return styles.colorGreen;
    case 'blue':
      return styles.colorBlue;
    case 'purple':
      return styles.colorPurple;
    default:
      return undefined;
  }
}
function statusClass(status) {
  switch (status) {
    case 'needsApproval':
      return styles.statusApproval;
    case 'running':
      return styles.statusRunning;
    default:
      return styles.statusIdle;
  }
}
function SessionOverviewPanelInner({
  onOpenSession,
  onOpenSplit,
  includeOtherWorkspaces,
  workspaceCwd,
}) {
  const { t } = useI18n();
  const connection = useConnection();
  const currentSessionId = connection.sessionId;
  const organizationEnabled =
    connection.capabilities?.features?.includes(SESSION_ORGANIZATION_FEATURE) ??
    false;
  const { sessions, loading, error, reload } = useScopedSessions(workspaceCwd, {
    autoLoad: true,
    pollIntervalMs: LIST_POLL_MS,
    pageSize: SESSION_LIST_PAGE_SIZE,
    archiveState: 'active',
    ...(organizationEnabled ? { view: 'organized', group: 'all' } : {}),
  });
  // Fold in the live sessions of the daemon's other workspaces (empty on a
  // single-workspace daemon), so the overview is mission control for every
  // workspace, not just the primary one.
  const { sessions: otherSessions, reload: reloadOther } =
    useOtherWorkspaceSessions(
      includeOtherWorkspaces && !workspaceCwd,
      LIST_POLL_MS,
    );
  const mergedSessions = useMemo(
    () => mergeSessionsById(sessions, otherSessions),
    [sessions, otherSessions],
  );
  const multiWorkspace =
    !workspaceCwd &&
    includeOtherWorkspaces &&
    hasMultipleWorkspaces(connection.capabilities);
  const status = useStatusReport({ autoLoad: true, detail: 'full' });
  const statusReload = status.reload;
  const statusReport = status.report;
  const [selected, setSelected] = useState(() => new Set());
  const [popupBlocked, setPopupBlocked] = useState(false);
  // Poll the richer status report less often — it is the only source of
  // per-session "needs approval" and current-model, but costs more to build.
  const statusInFlight = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden || statusInFlight.current) return;
      statusInFlight.current = true;
      void statusReload().finally(() => {
        statusInFlight.current = false;
      });
    }, STATUS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [statusReload]);
  // The primary workspace cwd (not `connection.workspaceCwd`, which follows the
  // currently-loaded session and can itself be non-primary) — so cards are
  // tagged against the real primary.
  const primaryCwd = connection.capabilities?.workspaceCwd;
  const cards = useMemo(
    () =>
      deriveSessionCards(
        mergedSessions,
        statusReport?.full?.sessions ?? [],
        currentSessionId,
        primaryCwd,
      ),
    [mergedSessions, statusReport, currentSessionId, primaryCwd],
  );
  const toggleSelected = useCallback((sessionId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }, []);
  // Selection drives the batch actions: open the checked sessions each in a new
  // tab, or open them together in the in-window split.
  const selectedIds = cards
    .map((card) => card.sessionId)
    .filter((id) => selected.has(id));
  const selectedCount = selectedIds.length;
  const allSelected = cards.length > 0 && selectedCount === cards.length;
  // The split shows at most MAX_SPLIT_PANES; cap what we hand off so the new-tab
  // URL doesn't bloat with ids that get discarded and the in-window path doesn't
  // silently open fewer than were checked. The top-ranked selections win.
  const splitIds = selectedIds.slice(0, MAX_SPLIT_PANES);
  const overCap = selectedCount > MAX_SPLIT_PANES;
  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      const ids = cards.map((card) => card.sessionId);
      // Toggle off only when every currently-listed card is selected — using
      // the intersection, not prev.size, so stale ids can't skew it.
      const everySelected = ids.length > 0 && ids.every((id) => prev.has(id));
      return everySelected ? new Set() : new Set(ids);
    });
  }, [cards]);
  // Drop selections for sessions that have left the list, so a reappearing
  // session isn't silently pre-selected and select-all/counts stay accurate.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const present = new Set(cards.map((card) => card.sessionId));
      let changed = false;
      const next = new Set();
      for (const id of prev) {
        if (present.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [cards]);
  // Open the selected sessions as a split view in a NEW browser tab: one tab
  // showing all of them side by side (not one tab per session). Passing no
  // window features makes browsers open a tab rather than a popup window.
  const openSelectedInNewTab = useCallback(() => {
    if (splitIds.length === 0) return;
    // Carry the (already-stripped-from-the-URL) daemon token so the new tab can
    // authenticate on token-auth deployments.
    const url = buildSplitUrl(splitIds, window.location.href, getDaemonToken());
    const win = window.open(url, '_blank');
    if (win) {
      // The split tab carries a daemon token in its URL fragment; sever the
      // opener link so it can't script the shell that spawned it during an
      // authenticated session (reverse tabnabbing). Mirrors the bug-report path.
      win.opener = null;
      win.focus();
    }
    setPopupBlocked(!win);
  }, [splitIds]);
  const refresh = useCallback(() => {
    void reload().catch(() => undefined);
    void reloadOther().catch(() => undefined);
    void statusReload().catch(() => undefined);
  }, [reload, reloadOther, statusReload]);
  if (cards.length === 0) {
    return _jsx('div', {
      className: styles.panel,
      children: _jsx('div', {
        className: styles.empty,
        children: loading
          ? t('sessionsOverview.loading')
          : error
            ? `${t('sessionsOverview.loadFailed')}: ${error.message}`
            : t('sessionsOverview.empty'),
      }),
    });
  }
  return _jsxs('div', {
    className: styles.panel,
    children: [
      _jsxs('div', {
        className: styles.toolbar,
        children: [
          _jsx('span', {
            className: styles.count,
            children: t('sessionsOverview.count', { count: cards.length }),
          }),
          _jsxs('label', {
            className: styles.selectAll,
            children: [
              _jsx('input', {
                type: 'checkbox',
                checked: allSelected,
                onChange: toggleSelectAll,
              }),
              t('sessionsOverview.selectAll'),
            ],
          }),
          _jsx('button', {
            type: 'button',
            className: styles.actionButton,
            disabled: selectedCount === 0,
            onClick: openSelectedInNewTab,
            title: t('sessionsOverview.openInTabHint'),
            children: t('sessionsOverview.openInTab'),
          }),
          onOpenSplit &&
            _jsx('button', {
              type: 'button',
              className: styles.actionButton,
              disabled: selectedCount === 0,
              onClick: () => onOpenSplit(splitIds),
              title: t('sessionsOverview.openInSplitHint'),
              children: t('sessionsOverview.openInSplit'),
            }),
          _jsx('button', {
            type: 'button',
            className: styles.refreshButton,
            onClick: refresh,
            children: t('sessionsOverview.refresh'),
          }),
        ],
      }),
      overCap &&
        _jsx('div', {
          className: styles.notice,
          role: 'status',
          children: t('sessionsOverview.splitCap', { max: MAX_SPLIT_PANES }),
        }),
      popupBlocked &&
        _jsx('div', {
          className: styles.notice,
          role: 'alert',
          children: t('sessionsOverview.popupBlocked'),
        }),
      error &&
        _jsxs('div', {
          className: styles.notice,
          role: 'alert',
          children: [t('sessionsOverview.loadFailed'), ': ', error.message],
        }),
      _jsx('ul', {
        className: styles.grid,
        children: cards.map((card) =>
          _jsxs(
            'li',
            {
              className: cx(
                styles.card,
                statusClass(card.status),
                card.isCurrent && styles.cardCurrent,
              ),
              children: [
                _jsxs('div', {
                  className: styles.cardTop,
                  children: [
                    _jsx('input', {
                      type: 'checkbox',
                      className: styles.cardCheckbox,
                      checked: selected.has(card.sessionId),
                      onChange: () => toggleSelected(card.sessionId),
                      'aria-label': t('sessionsOverview.selectSession', {
                        name: card.label,
                      }),
                    }),
                    card.color &&
                      _jsx('span', {
                        className: cx(
                          styles.colorDot,
                          colorDotClass(card.color),
                        ),
                        'aria-hidden': 'true',
                      }),
                    _jsx('button', {
                      type: 'button',
                      className: styles.cardLabel,
                      onClick: () => onOpenSession(card.sessionId),
                      title: card.label,
                      children: card.label,
                    }),
                    card.isCurrent &&
                      _jsx('span', {
                        className: styles.currentBadge,
                        children: t('sessionsOverview.current'),
                      }),
                  ],
                }),
                _jsxs('div', {
                  className: styles.cardMeta,
                  children: [
                    _jsx('span', {
                      className: cx(
                        styles.statusBadge,
                        statusClass(card.status),
                      ),
                      children: t(`sessionsOverview.status.${card.status}`),
                    }),
                    multiWorkspace &&
                      _jsx('span', {
                        className: cx(
                          styles.workspaceBadge,
                          card.isNonPrimary && styles.workspaceBadgeOther,
                        ),
                        title: card.workspaceCwd,
                        children: workspaceLabelForCwd(
                          card.workspaceCwd,
                          connection.capabilities?.workspaces,
                        ),
                      }),
                    card.model &&
                      _jsx('span', {
                        className: styles.metaItem,
                        title: card.model,
                        children: card.model,
                      }),
                    card.clientCount > 0 &&
                      _jsx('span', {
                        className: styles.metaItem,
                        title: t('sessionsOverview.openElsewhere'),
                        children: t('common.clients', {
                          count: card.clientCount,
                        }),
                      }),
                    card.updatedAt &&
                      _jsx('span', {
                        className: styles.metaItem,
                        children: formatRelativeTime(card.updatedAt, t),
                      }),
                  ],
                }),
              ],
            },
            card.sessionId,
          ),
        ),
      }),
    ],
  });
}
/**
 * A malformed daemon payload must not white-screen the shell; contain any
 * render throw to the panel, mirroring DaemonStatusDialog.
 */
export function SessionOverviewPanel({
  onOpenSession,
  onOpenSplit,
  includeOtherWorkspaces = true,
  workspaceCwd,
}) {
  const { t } = useI18n();
  return _jsx(ErrorBoundary, {
    label: 'session-overview',
    fallback: (fallbackError) =>
      _jsx('div', {
        className: styles.panel,
        children: _jsxs('div', {
          className: styles.empty,
          children: [
            t('sessionsOverview.loadFailed'),
            ': ',
            fallbackError.message,
          ],
        }),
      }),
    children: _jsx(SessionOverviewPanelInner, {
      onOpenSession: onOpenSession,
      onOpenSplit: onOpenSplit,
      includeOtherWorkspaces: includeOtherWorkspaces,
      workspaceCwd: workspaceCwd,
    }),
  });
}
//# sourceMappingURL=SessionOverviewPanel.js.map
