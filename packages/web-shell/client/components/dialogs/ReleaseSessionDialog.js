import { jsxs as _jsxs, jsx as _jsx } from 'react/jsx-runtime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { dp } from './dialogStyles';
import { useConnection } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { useListboxKeyboard } from '../../hooks/useListboxKeyboard';
import { useFilterInput } from '../../hooks/useFilterInput';
import { SessionRow } from './SessionRow';
import { useScopedSessions } from '../../hooks/useScopedSessions';
const LIST_ID = 'release-session-list';
const optionId = (index) => `${LIST_ID}-opt-${index}`;
export function ReleaseSessionDialog({
  onReleased,
  onError,
  onClose,
  workspaceCwd,
}) {
  const { t } = useI18n();
  const connection = useConnection();
  const {
    sessions,
    loading,
    error: sessionsError,
    releaseSession,
  } = useScopedSessions(workspaceCwd, {
    autoLoad: true,
    maxAgeMs: 1_000,
  });
  const currentSessionId = connection.sessionId;
  const [deleting, setDeleting] = useState(false);
  // -1 = no highlight; see ResumeDialog for the rationale.
  const [cursorIdx, setCursorIdx] = useState(-1);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const { filterValue: filterQuery, inputProps } = useFilterInput(() => {
    setCursorIdx(-1);
    setSelectedSessionId(null);
  });
  const [message, setMessage] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    if (sessionsError) setMessage(sessionsError.message);
  }, [sessionsError]);
  const filtered = filterQuery
    ? sessions.filter((s) => {
        const q = filterQuery.toLowerCase();
        return (
          (s.displayName || '').toLowerCase().includes(q) ||
          s.sessionId.toLowerCase().includes(q)
        );
      })
    : sessions;
  const confirmRow = (index) => {
    const session = filtered[index];
    if (!session) return;
    const isCurrent = session.sessionId === currentSessionId;
    const isReleasable =
      (session.clientCount ?? 0) > 0 || session.hasActivePrompt === true;
    if (isCurrent || !isReleasable) return;
    setCursorIdx(index);
    setSelectedSessionId(session.sessionId);
  };
  useEffect(() => {
    if (cursorIdx >= filtered.length && filtered.length > 0) {
      setCursorIdx(filtered.length - 1);
    }
  }, [filtered.length, cursorIdx]);
  useEffect(() => {
    const el = listRef.current?.children[cursorIdx];
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursorIdx]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  // Arrows move only the roving cursor. Enter/click confirms the target row,
  // but the destructive release still stays behind the danger button.
  const { keyboardMode } = useListboxKeyboard({
    itemCount: filtered.length,
    activeIndex: cursorIdx,
    onActiveIndexChange: setCursorIdx,
    onConfirm: confirmRow,
  });
  const handleRelease = useCallback(
    (targetSession) => {
      const session =
        targetSession ??
        filtered.find((s) => s.sessionId === selectedSessionId) ??
        undefined;
      if (!session || deleting) return;
      const releasable =
        (session.clientCount ?? 0) > 0 || session.hasActivePrompt === true;
      if (!releasable) {
        setMessage(t('release.inactive'));
        return;
      }
      if (session.sessionId === currentSessionId) {
        setMessage(t('release.cannotCurrent'));
        return;
      }
      if (!releaseSession) return;
      setDeleting(true);
      releaseSession(session.sessionId)
        .then(() => {
          onReleased(session.sessionId);
          onClose();
        })
        .catch((error) => {
          onError(error);
          setDeleting(false);
        });
    },
    [
      currentSessionId,
      deleting,
      filtered,
      onClose,
      onError,
      onReleased,
      releaseSession,
      selectedSessionId,
      t,
    ],
  );
  const selectedSession =
    filtered.find((s) => s.sessionId === selectedSessionId) ?? undefined;
  const selectedReleasable =
    selectedSession &&
    ((selectedSession.clientCount ?? 0) > 0 ||
      selectedSession.hasActivePrompt === true);
  const canRelease =
    !deleting &&
    !loading &&
    !!selectedSession &&
    selectedSession.sessionId !== currentSessionId &&
    !!selectedReleasable;
  return _jsxs('div', {
    className: dp('picker', 'picker-in-shell'),
    children: [
      _jsxs('div', {
        className: dp('picker-search'),
        children: [
          _jsxs('span', {
            className: dp('picker-search-label'),
            children: [t('resume.search'), ':', ' '],
          }),
          _jsx('input', {
            ref: inputRef,
            className: dp('picker-search-input'),
            'aria-label': t('resume.search'),
            role: 'combobox',
            'aria-autocomplete': 'list',
            'aria-expanded': 'true',
            'aria-controls': LIST_ID,
            'aria-activedescendant':
              cursorIdx >= 0 && cursorIdx < filtered.length
                ? optionId(cursorIdx)
                : undefined,
            ...inputProps,
            placeholder: '',
          }),
          _jsx('span', {
            className: dp('picker-search-hint'),
            children:
              message ||
              (deleting
                ? t('release.releasing')
                : loading
                  ? t('common.loading')
                  : filterQuery
                    ? t('release.matches', { count: filtered.length })
                    : ''),
          }),
        ],
      }),
      _jsx('div', { className: dp('picker-sep') }),
      _jsxs('div', {
        id: LIST_ID,
        role: 'listbox',
        className: dp(
          'picker-list',
          keyboardMode ? 'picker-keyboard-only' : undefined,
        ),
        ref: listRef,
        children: [
          loading &&
            _jsx('div', {
              className: dp('picker-empty'),
              children: t('common.loading'),
            }),
          !loading &&
            filtered.length === 0 &&
            _jsx('div', {
              className: dp('picker-empty'),
              children: filterQuery
                ? t('release.noMatch', { query: filterQuery })
                : t('release.none'),
            }),
          !loading &&
            filtered.map((s, i) => {
              const isCurrent = s.sessionId === currentSessionId;
              const isReleasable =
                (s.clientCount ?? 0) > 0 || s.hasActivePrompt === true;
              const isDisabled = isCurrent || !isReleasable;
              return _jsx(
                SessionRow,
                {
                  session: s,
                  optionId: optionId(i),
                  active: i === cursorIdx,
                  confirmed: s.sessionId === selectedSessionId,
                  ariaSelected: s.sessionId === selectedSessionId,
                  // In release/delete dialogs, "current session" is just a
                  // disabled reason, not the confirmed target. Keep the stronger
                  // accent bar + ✓ for the actual confirmed release target only.
                  current: false,
                  disabled: isDisabled,
                  trailing: isCurrent
                    ? _jsx('span', {
                        className: dp('picker-item-badge'),
                        children: t('resume.current'),
                      })
                    : !isReleasable
                      ? _jsx('span', {
                          className: dp('picker-item-badge'),
                          children: t('release.inactiveBadge'),
                        })
                      : undefined,
                  onClick: () => confirmRow(i),
                  onActivate: () => setCursorIdx(i),
                },
                s.sessionId,
              );
            }),
        ],
      }),
      _jsx('div', { className: dp('picker-sep') }),
      _jsxs('div', {
        className: dp('dialog-footer-actions'),
        children: [
          _jsx('button', {
            type: 'button',
            className: dp('dialog-inline-button'),
            onClick: onClose,
            disabled: deleting,
            children: t('common.cancel'),
          }),
          _jsx('button', {
            type: 'button',
            className: dp('dialog-danger-button'),
            onClick: () => handleRelease(),
            disabled: !canRelease,
            children: deleting ? t('release.releasing') : t('release.action'),
          }),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=ReleaseSessionDialog.js.map
