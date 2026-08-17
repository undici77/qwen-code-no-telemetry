import { jsxs as _jsxs, jsx as _jsx } from 'react/jsx-runtime';
import { useState, useEffect, useRef } from 'react';
import { dp } from './dialogStyles';
import { useConnection } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { useListboxKeyboard } from '../../hooks/useListboxKeyboard';
import { useFilterInput } from '../../hooks/useFilterInput';
import { SessionRow } from './SessionRow';
import { useScopedSessions } from '../../hooks/useScopedSessions';
const LIST_ID = 'resume-session-list';
const optionId = (index) => `${LIST_ID}-opt-${index}`;
export function ResumeDialog({ onSelect, onClose, workspaceCwd }) {
  const { t } = useI18n();
  const connection = useConnection();
  const { sessions, loading, error } = useScopedSessions(workspaceCwd, {
    autoLoad: true,
    maxAgeMs: 1_000,
  });
  const currentSessionId = connection.sessionId;
  // -1 = no highlight. The dialog opens with nothing highlighted and resets to
  // none on filter edits, so Enter in the search box cannot confirm a row the
  // user didn't pick — the highlight only appears once they press ↓/↑ or hover.
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const { filterValue: filterQuery, inputProps } = useFilterInput(() =>
    setSelectedIdx(-1),
  );
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const filtered = filterQuery
    ? sessions.filter((s) => {
        const q = filterQuery.toLowerCase();
        return (
          (s.displayName || '').toLowerCase().includes(q) ||
          s.sessionId.toLowerCase().includes(q)
        );
      })
    : sessions;
  // Keep selection in bounds
  useEffect(() => {
    if (selectedIdx >= filtered.length && filtered.length > 0) {
      setSelectedIdx(filtered.length - 1);
    }
  }, [filtered.length, selectedIdx]);
  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);
  const confirm = (index) => {
    const session = filtered[index];
    if (!session) return;
    onSelect(session.sessionId);
    onClose();
  };
  const { keyboardMode } = useListboxKeyboard({
    itemCount: filtered.length,
    activeIndex: selectedIdx,
    onActiveIndexChange: setSelectedIdx,
    onConfirm: confirm,
  });
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return _jsxs('div', {
    className: dp('picker', 'picker-in-shell'),
    'data-web-shell-resume-dialog': true,
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
            error &&
            _jsx('div', {
              className: dp('picker-empty'),
              children: error.message || t('resume.failedToLoad'),
            }),
          !loading &&
            !error &&
            filtered.length === 0 &&
            _jsx('div', {
              className: dp('picker-empty'),
              children: filterQuery
                ? t('resume.noMatch', { query: filterQuery })
                : t('resume.none'),
            }),
          !loading &&
            filtered.map((s, index) =>
              _jsx(
                SessionRow,
                {
                  session: s,
                  optionId: optionId(index),
                  active: index === selectedIdx,
                  current: s.sessionId === currentSessionId,
                  currentLabel: t('resume.current'),
                  resumeSelector: true,
                  onClick: () => confirm(index),
                  onActivate: () => setSelectedIdx(index),
                },
                s.sessionId,
              ),
            ),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=ResumeDialog.js.map
