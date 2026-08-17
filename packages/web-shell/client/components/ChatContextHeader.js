import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { LayoutListIcon, PanelRightIcon } from 'lucide-react';
import { useI18n } from '../i18n';
import styles from './ChatContextHeader.module.css';
export function ChatContextHeader({
  content,
  environmentOpen,
  environmentAvailable,
  rightPanelOpen,
  rightPanelAvailable,
  onToggleEnvironment,
  onToggleRightPanel,
}) {
  const { t } = useI18n();
  return _jsxs('header', {
    className: styles.header,
    'data-testid': 'chat-context-header',
    children: [
      _jsx('div', { className: styles.content, children: content }),
      _jsxs('div', {
        className: styles.actions,
        children: [
          environmentAvailable &&
            _jsx('button', {
              type: 'button',
              className: styles.action,
              'data-web-shell-environment-toggle': true,
              'aria-label': t('chatHeader.toggleEnvironment'),
              'aria-pressed': environmentOpen,
              title: t('chatHeader.toggleEnvironment'),
              onClick: onToggleEnvironment,
              children: _jsx(LayoutListIcon, {}),
            }),
          rightPanelAvailable &&
            _jsx('button', {
              type: 'button',
              className: styles.action,
              'aria-label': t('chatHeader.toggleRightPanel'),
              'aria-pressed': rightPanelOpen,
              title: t('chatHeader.toggleRightPanel'),
              onClick: onToggleRightPanel,
              children: _jsx(PanelRightIcon, {}),
            }),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=ChatContextHeader.js.map
