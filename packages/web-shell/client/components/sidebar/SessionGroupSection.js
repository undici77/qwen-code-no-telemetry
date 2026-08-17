import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import styles from './WebShellSidebar.module.css';
export function SessionGroupSection({
  label,
  count,
  expanded,
  color,
  children,
  onToggle,
  onRename,
  onDelete,
  renameLabel,
  deleteLabel,
  actionsDisabled,
}) {
  const colorClass = color?.startsWith('#')
    ? styles.groupColorCustom
    : color
      ? styles[`groupColor${color[0].toUpperCase()}${color.slice(1)}`]
      : styles.sessionGroupDotMuted;
  const dotStyle = color?.startsWith('#')
    ? { '--session-group-custom-color': color }
    : undefined;
  return _jsxs('section', {
    className: styles.sessionGroupSection,
    'aria-label': label,
    children: [
      _jsxs('div', {
        className: styles.sessionGroupHeaderRow,
        children: [
          _jsxs('button', {
            type: 'button',
            className: styles.sessionGroupHeader,
            'aria-expanded': expanded,
            onClick: onToggle,
            children: [
              _jsx('span', {
                className: `${styles.sessionGroupDot} ${colorClass}`,
                style: dotStyle,
                'aria-hidden': 'true',
              }),
              _jsx('span', {
                className: styles.sessionGroupTitle,
                children: label,
              }),
              _jsxs('span', {
                className: styles.sessionGroupCount,
                children: ['\u00B7 ', count],
              }),
              _jsx('span', {
                className: styles.sessionGroupChevron,
                'aria-hidden': 'true',
                children: expanded
                  ? _jsx(ChevronDownIcon, {})
                  : _jsx(ChevronRightIcon, {}),
              }),
            ],
          }),
          (onRename || onDelete) &&
            _jsxs('div', {
              className: styles.sessionGroupHeaderActions,
              children: [
                onRename &&
                  _jsx('button', {
                    className: styles.sessionGroupActionButton,
                    type: 'button',
                    title: renameLabel,
                    'aria-label': renameLabel,
                    disabled: actionsDisabled,
                    onClick: onRename,
                    children: _jsx(PencilIcon, {}),
                  }),
                onDelete &&
                  _jsx('button', {
                    className: styles.sessionGroupActionButton,
                    type: 'button',
                    title: deleteLabel,
                    'aria-label': deleteLabel,
                    disabled: actionsDisabled,
                    onClick: onDelete,
                    children: _jsx(Trash2Icon, {}),
                  }),
              ],
            }),
        ],
      }),
      expanded &&
        _jsx('div', { className: styles.sessionGroupList, children: children }),
    ],
  });
}
//# sourceMappingURL=SessionGroupSection.js.map
