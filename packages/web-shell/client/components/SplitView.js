import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DaemonSessionProvider,
  useConnection,
} from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../i18n';
import { ChatPane } from './ChatPane';
import { ErrorBoundary } from './ErrorBoundary';
import { MAX_SPLIT_PANES } from '../utils/splitUrl';
import {
  SESSION_LIST_PAGE_SIZE,
  SESSION_ORGANIZATION_FEATURE,
  WEB_SHELL_HISTORY_PAGE_SIZE,
  WEB_SHELL_MAX_TRANSCRIPT_BLOCKS,
} from '../constants/sessions';
import { useOtherWorkspaceSessions } from '../hooks/useOtherWorkspaceSessions';
import { useScopedSessions } from '../hooks/useScopedSessions';
import {
  hasMultipleWorkspaces,
  mergeSessionsById,
  workspaceLabelForCwd,
} from '../utils/workspace';
import { isEditableTarget } from '../utils/dom';
import styles from './SplitView.module.css';
const MAX_PANES = MAX_SPLIT_PANES;
/**
 * Shows 2+ independent interactive chats side by side in one window. Each pane
 * is its own `DaemonSessionProvider` (own session, SSE, transcript, approvals),
 * all sharing the one `DaemonWorkspaceProvider` above the app. Browser focus
 * naturally scopes the keyboard to the pane the user clicks into, so panes never
 * fight over which session an approval or Enter belongs to.
 */
export function SplitView({
  sessionIds,
  onPanesChange,
  onExit,
  onError,
  onImageIngestionNotice,
  onSlashCommand,
  onRightPanelOpen,
  onOpenMonitor,
  onPaneArtifactsChange,
  messageTurnOutputs,
  renderPaneHeaderActions,
  includeOtherWorkspaces = true,
  workspaceCwd,
  restartSseOnPrompt,
  historyPageSize = WEB_SHELL_HISTORY_PAGE_SIZE,
  voiceUserRevision = 0,
  voiceWorkspaceRevisions = {},
  voiceWorkspaces,
  sessionWorkflowEnabled = false,
}) {
  const { t } = useI18n();
  const connection = useConnection();
  const currentSessionId = connection.sessionId;
  const organizationEnabled =
    connection.capabilities?.features?.includes(SESSION_ORGANIZATION_FEATURE) ??
    false;
  const { sessions, reload } = useScopedSessions(workspaceCwd, {
    autoLoad: true,
    pageSize: SESSION_LIST_PAGE_SIZE,
    archiveState: 'active',
    ...(organizationEnabled ? { view: 'organized', group: 'all' } : {}),
  });
  // Live sessions from the daemon's other workspaces, so the picker can offer —
  // and a pane can attach to — sessions that aren't in the primary workspace.
  // Empty (a no-op) on a single-workspace daemon.
  const { sessions: otherSessions, reload: reloadOther } =
    useOtherWorkspaceSessions(includeOtherWorkspaces && !workspaceCwd);
  const allSessions = useMemo(
    () => mergeSessionsById(sessions, otherSessions),
    [sessions, otherSessions],
  );
  const multiWorkspace =
    !workspaceCwd &&
    includeOtherWorkspaces &&
    hasMultipleWorkspaces(connection.capabilities);
  const scopePanesByWorkspace = Boolean(workspaceCwd) || multiWorkspace;
  const sessionIdsControlled = sessionIds !== undefined;
  const normalizedSessionIds = useMemo(
    () =>
      Array.from(new Set((sessionIds ?? []).filter(Boolean))).slice(
        0,
        MAX_PANES,
      ),
    [sessionIds],
  );
  const [paneIds, setPaneIds] = useState(() => {
    if (normalizedSessionIds.length > 0) return normalizedSessionIds;
    return currentSessionId ? [currentSessionId] : [];
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  // Which pane, if any, is maximized to fill the whole split. Purely visual and
  // ephemeral (not deep-linked via `?split=`, like the dialog fullscreen toggle
  // it mirrors): the other panes stay mounted and streaming, just hidden.
  const [maximizedPaneId, setMaximizedPaneId] = useState(null);
  const addWrapRef = useRef(null);
  // A per-tab/per-mount nonce: two browser tabs opening the same split must not
  // register the same daemon client id, or suppressOwnUserEcho would treat one
  // tab's prompt as the other's own echo and drop it from the transcript.
  const [instanceId] = useState(() =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  );
  useEffect(() => {
    if (!sessionIdsControlled) return;
    setPaneIds((prev) =>
      prev.length === normalizedSessionIds.length &&
      prev.every((id, index) => id === normalizedSessionIds[index])
        ? prev
        : normalizedSessionIds,
    );
  }, [normalizedSessionIds, sessionIdsControlled]);
  const paneIdsRef = useRef(paneIds);
  paneIdsRef.current = paneIds;
  // Dismiss the "add session" picker on Escape or a click outside it.
  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (event) => {
      if (!addWrapRef.current?.contains(event.target)) {
        setPickerOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [pickerOpen]);
  // Refresh the list the moment the picker opens so it includes sessions
  // created since the split was first entered.
  useEffect(() => {
    if (pickerOpen) {
      void reload().catch(() => undefined);
      void reloadOther().catch(() => undefined);
    }
  }, [pickerOpen, reload, reloadOther]);
  const titleById = useMemo(() => {
    const map = new Map();
    for (const session of allSessions) {
      map.set(
        session.sessionId,
        session.displayName?.trim() || session.sessionId.slice(0, 8),
      );
    }
    return map;
  }, [allSessions]);
  // The workspace each session lives in, so a pane attaches under its owning
  // workspace (a non-primary session 409s if loaded with the primary cwd). The
  // seed pane is the current session, whose workspace the connection already
  // knows before the lists finish loading — cover it so it attaches correctly
  // on first paint.
  const workspaceCwdById = useMemo(() => {
    const map = new Map();
    for (const session of allSessions) {
      map.set(session.sessionId, session.workspaceCwd);
    }
    if (
      currentSessionId &&
      connection.workspaceCwd &&
      !map.has(currentSessionId)
    ) {
      map.set(currentSessionId, connection.workspaceCwd);
    }
    return map;
  }, [allSessions, currentSessionId, connection.workspaceCwd]);
  const addPane = useCallback(
    (sessionId) => {
      const currentPaneIds = paneIdsRef.current;
      if (
        currentPaneIds.includes(sessionId) ||
        currentPaneIds.length >= MAX_PANES
      ) {
        setPickerOpen(false);
        return;
      }
      const next = [...currentPaneIds, sessionId];
      // Reveal the freshly added pane rather than leaving it hidden behind a
      // still-maximized one.
      setMaximizedPaneId(null);
      if (sessionIdsControlled) {
        onPanesChange?.(next);
      } else {
        setPaneIds(next);
      }
      setPickerOpen(false);
    },
    [onPanesChange, sessionIdsControlled],
  );
  // Closing the last pane is a natural "I'm done" gesture — return to the
  // overview instead of stranding the user on an empty split. Guarded so an
  // initial empty seed (no current session) doesn't bounce straight back out.
  const hadPanesRef = useRef(false);
  useEffect(() => {
    if (paneIds.length > 0) {
      hadPanesRef.current = true;
    } else if (hadPanesRef.current) {
      onExit();
    }
  }, [paneIds, onExit]);
  // Mirror the live pane set up to the parent so it outlives this component
  // unmounting when the user switches views. On re-entry the parent reseeds
  // `sessionIds` from it, restoring the exact panes instead of clearing.
  useEffect(() => {
    if (!sessionIdsControlled) onPanesChange?.(paneIds);
  }, [paneIds, onPanesChange, sessionIdsControlled]);
  const removePane = useCallback(
    (sessionId) => {
      const currentPaneIds = paneIdsRef.current;
      if (!currentPaneIds.includes(sessionId)) return;
      const next = currentPaneIds.filter((id) => id !== sessionId);
      if (sessionIdsControlled) {
        onPanesChange?.(next);
      } else {
        setPaneIds(next);
      }
    },
    [onPanesChange, sessionIdsControlled],
  );
  const toggleMaximize = useCallback((sessionId) => {
    setMaximizedPaneId((current) => (current === sessionId ? null : sessionId));
  }, []);
  // Maximize only makes sense against another pane, so drop it whenever it no
  // longer can hold: the maximized pane left the set (closed here, or removed by
  // a controlled-mode sync), or the split shrank to a lone pane. Without the
  // length guard a surviving maximized pane would keep a stale `maximizedPaneId`
  // that silently re-hides the next pane a controlled parent adds back.
  useEffect(() => {
    if (
      maximizedPaneId &&
      (paneIds.length < 2 || !paneIds.includes(maximizedPaneId))
    ) {
      setMaximizedPaneId(null);
    }
  }, [paneIds, maximizedPaneId]);
  // Escape restores the tiled layout, but only when the key is otherwise unused:
  // defer to an open picker (its own Escape closes it first), and never steal
  // Escape from the composer — it cancels the in-flight turn / closes its menus —
  // or from an open dialog. `isEditableTarget` covers `.cm-editor` and dialog
  // keyboard scopes, so a maximized pane's composer keeps its Escape.
  useEffect(() => {
    if (!maximizedPaneId) return;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (pickerOpen || isEditableTarget(event.target)) return;
      setMaximizedPaneId(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [maximizedPaneId, pickerOpen]);
  const available = useMemo(
    () => allSessions.filter((session) => !paneIds.includes(session.sessionId)),
    [allSessions, paneIds],
  );
  const canAdd = paneIds.length < MAX_PANES && available.length > 0;
  // Only offer per-pane maximize once there's another pane to maximize against —
  // a lone pane already fills the split.
  const canMaximize = paneIds.length > 1;
  return _jsxs('div', {
    className: styles.split,
    'data-testid': 'split-view',
    children: [
      _jsxs('header', {
        className: styles.toolbar,
        children: [
          _jsx('button', {
            type: 'button',
            className: styles.backButton,
            onClick: onExit,
            'aria-label': t('common.back'),
            title: t('common.back'),
            children: _jsx('svg', {
              viewBox: '0 0 24 24',
              width: '18',
              height: '18',
              'aria-hidden': 'true',
              children: _jsx('path', {
                d: 'M15 18l-6-6 6-6',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }),
            }),
          }),
          _jsx('span', {
            className: styles.title,
            children: t('splitView.title'),
          }),
          _jsx('span', {
            className: styles.count,
            children: t('splitView.count', { count: paneIds.length }),
          }),
          _jsxs('div', {
            className: styles.addWrap,
            ref: addWrapRef,
            children: [
              _jsxs('button', {
                type: 'button',
                className: styles.addButton,
                disabled: !canAdd,
                'aria-haspopup': 'listbox',
                'aria-expanded': pickerOpen,
                onClick: () => setPickerOpen((open) => !open),
                children: ['+ ', t('splitView.addPane')],
              }),
              pickerOpen &&
                available.length > 0 &&
                _jsx('ul', {
                  className: styles.picker,
                  role: 'listbox',
                  children: available.map((session) =>
                    _jsx(
                      'li',
                      {
                        role: 'option',
                        'aria-selected': 'false',
                        children: _jsxs('button', {
                          type: 'button',
                          className: styles.pickerItem,
                          onClick: () => addPane(session.sessionId),
                          children: [
                            _jsx('span', {
                              className: styles.pickerItemLabel,
                              children:
                                titleById.get(session.sessionId) ??
                                session.sessionId.slice(0, 8),
                            }),
                            multiWorkspace &&
                              _jsx('span', {
                                className: styles.pickerItemWorkspace,
                                title: session.workspaceCwd,
                                children: workspaceLabelForCwd(
                                  session.workspaceCwd,
                                  connection.capabilities?.workspaces,
                                ),
                              }),
                          ],
                        }),
                      },
                      session.sessionId,
                    ),
                  ),
                }),
            ],
          }),
        ],
      }),
      _jsx('div', {
        className: styles.panes,
        children:
          paneIds.length === 0
            ? _jsx('div', {
                className: styles.empty,
                children: t('splitView.empty'),
              })
            : paneIds.map((sessionId) => {
                const paneWorkspaceCwd = workspaceCwdById.get(sessionId);
                const isMaximized = maximizedPaneId === sessionId;
                // When one pane is maximized, the rest stay mounted (their sessions
                // keep streaming) but are hidden via CSS — a purely visual solo.
                const isHidden = maximizedPaneId !== null && !isMaximized;
                return _jsx(
                  'div',
                  {
                    className: styles.paneSlot,
                    'data-pane-hidden': isHidden ? '' : undefined,
                    children: _jsx(ErrorBoundary, {
                      label: `split-pane:${sessionId}`,
                      resetKeys: [sessionId],
                      fallback: (error) =>
                        _jsxs('div', {
                          className: styles.paneError,
                          role: 'alert',
                          children: [
                            _jsx('div', {
                              className: styles.paneErrorTitle,
                              children:
                                titleById.get(sessionId) ??
                                sessionId.slice(0, 8),
                            }),
                            _jsxs('div', {
                              className: styles.paneErrorMessage,
                              children: [
                                t('splitView.paneError'),
                                ': ',
                                error.message,
                              ],
                            }),
                            _jsx('button', {
                              type: 'button',
                              className: styles.paneErrorClose,
                              onClick: () => removePane(sessionId),
                              children: t('splitView.closePane'),
                            }),
                          ],
                        }),
                      children: _jsx(DaemonSessionProvider, {
                        sessionId: sessionId,
                        // Attach the pane under its session's own workspace. Only on
                        // a multi-workspace daemon — passing it on a single-workspace
                        // daemon would flip a deep-linked pane's prop from undefined
                        // to the primary cwd once the list resolves, needlessly
                        // re-attaching it. Undefined falls back to the provider's
                        // primary cwd, i.e. today's behavior.
                        workspaceCwd: scopePanesByWorkspace
                          ? (paneWorkspaceCwd ?? workspaceCwd)
                          : undefined,
                        // Distinct from the main view's client (and from any other
                        // tab's panes) for the same session, so the attachments don't
                        // collide on one client identity.
                        clientId: `split-pane:${instanceId}:${sessionId}`,
                        historyPageSize: historyPageSize,
                        subagentTranscriptMode: 'summary',
                        maxBlocks: WEB_SHELL_MAX_TRANSCRIPT_BLOCKS,
                        suppressOwnUserEcho: true,
                        restartEventStreamOnPrompt: restartSseOnPrompt,
                        children: _jsx(ChatPane, {
                          title: titleById.get(sessionId),
                          workspaceCwd: paneWorkspaceCwd,
                          reportCatalogTurnCompletion:
                            sessionId !== currentSessionId ||
                            paneWorkspaceCwd !== connection.workspaceCwd,
                          renderHeaderActions: renderPaneHeaderActions,
                          hidden: isHidden,
                          voiceUserRevision: voiceUserRevision,
                          voiceWorkspaceRevisions: voiceWorkspaceRevisions,
                          voiceWorkspaces: voiceWorkspaces,
                          onClose: () => removePane(sessionId),
                          onToggleMaximize: canMaximize
                            ? () => toggleMaximize(sessionId)
                            : undefined,
                          isMaximized: isMaximized,
                          onError: onError,
                          onImageIngestionNotice: onImageIngestionNotice,
                          onSlashCommand: onSlashCommand,
                          onRightPanelOpen: onRightPanelOpen,
                          onOpenMonitor: onOpenMonitor,
                          onPaneArtifactsChange: onPaneArtifactsChange,
                          messageTurnOutputs: messageTurnOutputs,
                          restartSseOnPrompt: restartSseOnPrompt,
                          sessionWorkflowEnabled: sessionWorkflowEnabled,
                        }),
                      }),
                    }),
                  },
                  scopePanesByWorkspace
                    ? `${sessionId}:${paneWorkspaceCwd ?? ''}`
                    : sessionId,
                );
              }),
      }),
    ],
  });
}
//# sourceMappingURL=SplitView.js.map
