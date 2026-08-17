import { jsxs as _jsxs, jsx as _jsx } from 'react/jsx-runtime';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dp } from './dialogStyles';
import { useConnection } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { useListboxKeyboard } from '../../hooks/useListboxKeyboard';
import { useFilterInput } from '../../hooks/useFilterInput';
import { SessionRow } from './SessionRow';
import { useScopedSessions } from '../../hooks/useScopedSessions';
const LIST_ID = 'delete-session-list';
const optionId = (index) => `${LIST_ID}-opt-${index}`;
export function DeleteSessionDialog({
  onDeleted,
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
    deleteSession,
    deleteSessions,
  } = useScopedSessions(workspaceCwd, {
    autoLoad: true,
    maxAgeMs: 1_000,
  });
  const currentSessionId = connection.sessionId;
  const [deleting, setDeleting] = useState(false);
  // `selectedIdx` is the keyboard/hover cursor (roving highlight, -1 = none —
  // see ResumeDialog for the rationale); `selectedIds` is the multi-select set
  // marked for deletion (shown by the [x] checkbox).
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { filterValue: filterQuery, inputProps } = useFilterInput(() => {
    setSelectedIdx(-1);
    setSelectedIds(new Set());
  });
  const [message, setMessage] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    if (sessionsError) setMessage(sessionsError.message);
  }, [sessionsError]);
  const filtered = useMemo(
    () =>
      filterQuery
        ? sessions.filter((s) => {
            const q = filterQuery.toLowerCase();
            return (
              (s.displayName || '').toLowerCase().includes(q) ||
              s.sessionId.toLowerCase().includes(q)
            );
          })
        : sessions,
    [sessions, filterQuery],
  );
  const toggleSelection = useCallback(
    (sessionId) => {
      if (sessionId === currentSessionId) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(sessionId)) {
          next.delete(sessionId);
        } else {
          next.add(sessionId);
        }
        return next;
      });
    },
    [currentSessionId],
  );
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const filteredSet = new Set(filtered.map((s) => s.sessionId));
    setSelectedIds((prev) => {
      const pruned = new Set([...prev].filter((id) => filteredSet.has(id)));
      return pruned.size === prev.size ? prev : pruned;
    });
  }, [filtered, selectedIds.size]);
  useEffect(() => {
    if (selectedIdx >= filtered.length && filtered.length > 0) {
      setSelectedIdx(filtered.length - 1);
    }
  }, [filtered.length, selectedIdx]);
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  // Enter toggles the cursor row's checkbox; the actual (destructive) delete
  // still requires pressing the danger button — mirroring the click behaviour.
  const { keyboardMode } = useListboxKeyboard({
    itemCount: filtered.length,
    activeIndex: selectedIdx,
    onActiveIndexChange: setSelectedIdx,
    onConfirm: (index) => {
      const session = filtered[index];
      if (session) toggleSelection(session.sessionId);
    },
  });
  const handleDelete = useCallback(() => {
    if (deleting) return;
    if (selectedIds.size > 0) {
      const filteredSet = new Set(filtered.map((s) => s.sessionId));
      const idsToDelete = Array.from(selectedIds).filter((id) =>
        filteredSet.has(id),
      );
      if (idsToDelete.length === 0) return;
      setDeleting(true);
      deleteSessions(idsToDelete)
        .then((res) => {
          const succeeded = res.removed.length + res.notFound.length;
          const failed = res.errors.length;
          if (failed > 0 && succeeded > 0) {
            onError(
              new Error(
                t('delete.partialFail', {
                  removed: succeeded,
                  failed,
                  detail: res.errors[0].error,
                }),
              ),
            );
            onClose();
            return;
          }
          if (failed > 0) {
            setMessage(
              t('delete.allFailed', {
                count: failed,
                reason: res.errors[0].error,
              }),
            );
            setDeleting(false);
            setSelectedIds(new Set());
            return;
          }
          if (succeeded === 0) {
            setMessage(t('delete.nonRemoved'));
            setDeleting(false);
            setSelectedIds(new Set());
            return;
          }
          onDeleted([...res.removed, ...res.notFound]);
          onClose();
        })
        .catch((error) => {
          onError(error);
          setDeleting(false);
        });
      return;
    }
    const session = filtered[selectedIdx];
    if (!session) return;
    if (session.sessionId === currentSessionId) {
      setMessage(t('delete.cannotCurrent'));
      return;
    }
    setDeleting(true);
    deleteSession(session.sessionId)
      .then((removed) => {
        if (!removed) {
          setMessage(t('delete.notFound'));
          setDeleting(false);
          return;
        }
        onDeleted([session.sessionId]);
        onClose();
      })
      .catch((error) => {
        onError(error);
        setDeleting(false);
      });
  }, [
    currentSessionId,
    deleteSession,
    deleteSessions,
    deleting,
    filtered,
    onClose,
    onDeleted,
    onError,
    selectedIdx,
    selectedIds,
    t,
  ]);
  const hasSelection = selectedIds.size > 0;
  const canDelete = !deleting && !loading && hasSelection;
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
              selectedIdx >= 0 && selectedIdx < filtered.length
                ? optionId(selectedIdx)
                : undefined,
            ...inputProps,
            placeholder: '',
          }),
          _jsx('span', {
            className: dp('picker-search-hint'),
            children:
              message ||
              (deleting
                ? t('delete.deleting')
                : loading
                  ? t('common.loading')
                  : hasSelection
                    ? t('delete.selected', { count: selectedIds.size })
                    : filterQuery
                      ? t('delete.matches', { count: filtered.length })
                      : ''),
          }),
        ],
      }),
      _jsx('div', { className: dp('picker-sep') }),
      _jsxs('div', {
        id: LIST_ID,
        role: 'listbox',
        'aria-multiselectable': 'true',
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
            sessionsError &&
            _jsx('div', {
              className: dp('picker-empty'),
              children: sessionsError.message,
            }),
          !loading &&
            !sessionsError &&
            filtered.length === 0 &&
            _jsx('div', {
              className: dp('picker-empty'),
              children: filterQuery
                ? t('delete.noMatch', { query: filterQuery })
                : t('delete.none'),
            }),
          !loading &&
            filtered.map((s, i) => {
              const isCurrent = s.sessionId === currentSessionId;
              const isChecked = selectedIds.has(s.sessionId);
              return _jsx(
                SessionRow,
                {
                  session: s,
                  optionId: optionId(i),
                  active: i === selectedIdx,
                  ariaSelected: isChecked,
                  current: false,
                  disabled: isCurrent,
                  leading: _jsx('span', {
                    className: dp(
                      'picker-item-checkbox',
                      isChecked ? 'picker-item-checkbox-checked' : undefined,
                    ),
                    children: isChecked ? '[x] ' : '[ ] ',
                  }),
                  trailing: isCurrent
                    ? _jsx('span', {
                        className: dp('picker-item-badge'),
                        children: t('resume.current'),
                      })
                    : undefined,
                  onClick: () => {
                    setSelectedIdx(i);
                    if (!isCurrent) toggleSelection(s.sessionId);
                  },
                  onActivate: () => setSelectedIdx(i),
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
            onClick: handleDelete,
            disabled: !canDelete,
            children: deleting ? t('delete.deleting') : t('delete.action'),
          }),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=DeleteSessionDialog.js.map
