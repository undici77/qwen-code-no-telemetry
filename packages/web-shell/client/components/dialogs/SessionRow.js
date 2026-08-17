import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import {} from 'react';
import {} from '@qwen-code/webui/daemon-react-sdk';
import { dp } from './dialogStyles';
import { useI18n } from '../../i18n';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
/**
 * A session list row shared by the resume / delete / release dialogs. Owns the
 * common shell (roving highlight, current marker, disabled state) and the
 * identical metadata line (relative time · client count · active prompt);
 * per-dialog affordances go through the `leading`/`trailing` slots.
 */
export function SessionRow({
  session,
  active,
  current,
  confirmed,
  disabled,
  currentLabel,
  optionId,
  ariaSelected,
  leading,
  trailing,
  resumeSelector,
  onClick,
  onActivate,
}) {
  const { t } = useI18n();
  const timestamp = session.updatedAt || session.createdAt;
  return _jsxs('div', {
    id: optionId,
    role: 'option',
    'aria-selected': ariaSelected ?? current,
    'aria-current': current ? 'true' : undefined,
    'aria-disabled': disabled || undefined,
    className: dp(
      'picker-item',
      'picker-session-item',
      active ? 'selected' : undefined,
      current ? 'dialog-current' : undefined,
      confirmed ? 'picker-item-confirmed' : undefined,
      disabled ? 'disabled' : undefined,
    ),
    title: current ? currentLabel : undefined,
    'data-web-shell-resume-session': resumeSelector ? '' : undefined,
    'data-session-id': resumeSelector ? session.sessionId : undefined,
    onClick: onClick,
    onMouseMove: onActivate,
    children: [
      _jsxs('div', {
        className: dp('picker-item-row'),
        children: [
          leading,
          _jsx('span', {
            className: dp('picker-item-title'),
            children: session.displayName || session.sessionId.slice(0, 8),
          }),
          trailing,
        ],
      }),
      _jsxs('div', {
        className: dp('picker-item-meta'),
        children: [
          _jsx('span', {
            children: timestamp && formatRelativeTime(timestamp, t),
          }),
          _jsx('span', {
            className: dp('picker-item-detail'),
            children: t('common.clients', { count: session.clientCount ?? 0 }),
          }),
          session.hasActivePrompt &&
            _jsx('span', {
              className: dp('picker-item-detail'),
              children: t('resume.activePrompt'),
            }),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=SessionRow.js.map
