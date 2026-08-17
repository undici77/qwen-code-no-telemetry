import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { FolderXIcon } from 'lucide-react';
import { Button } from './ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty';
export function WorkspaceUnavailableState({
  title,
  description,
  actionLabel,
  onAction,
  theme,
  icon,
}) {
  return _jsx('div', {
    'data-web-shell-root': true,
    'data-web-shell-shadcn': true,
    className: `flex min-h-48 w-full items-center justify-center p-4 ${theme === 'dark' ? 'dark' : ''}`,
    children: _jsxs(Empty, {
      className: 'border',
      children: [
        _jsxs(EmptyHeader, {
          children: [
            _jsx(EmptyMedia, {
              variant: 'icon',
              children: icon ?? _jsx(FolderXIcon, {}),
            }),
            _jsx(EmptyTitle, { children: title }),
            _jsx(EmptyDescription, { children: description }),
          ],
        }),
        _jsx(EmptyContent, {
          children: _jsx(Button, { onClick: onAction, children: actionLabel }),
        }),
      ],
    }),
  });
}
//# sourceMappingURL=WorkspaceUnavailableState.js.map
