import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import styles from './ChatEditor.module.css';
import accentStyles from './WorkspaceAccent.module.css';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
function WorkspaceFolderIcon() {
  return _jsx('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': 'true',
    children: _jsx('path', {
      d: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2h7A1.5 1.5 0 0 1 19 8.5v8A1.5 1.5 0 0 1 17.5 18h-13A1.5 1.5 0 0 1 3 16.5Z',
      stroke: 'currentColor',
      strokeWidth: '1.8',
      strokeLinejoin: 'round',
    }),
  });
}
/**
 * A compact, non-interactive chip naming the workspace a split-view pane's
 * session belongs to. Mirrors {@link GitBranchIndicator}; both sit in the
 * composer toolbar. Shown only on a multi-workspace daemon (the pane composer
 * opts into the `workspace` toolbar action) so it's clear which workspace a
 * message goes to. The full cwd stays in a hover tooltip — matching the git
 * branch chip — so it's still discoverable once the name ellipsizes or
 * collapses to an icon on a narrow (split-screen / mobile) composer.
 *
 * A stable per-workspace `color` (same palette as the pane header and the
 * sidebar session-group dots) tints the folder icon and the chip background, so
 * the chip stays distinguishable from other panes' chips even in the icon-only
 * compact state — where every workspace would otherwise show the same folder.
 */
export function WorkspaceIndicator({
  name,
  title,
  ariaLabel,
  color,
  compact = false,
}) {
  const className = [
    styles.workspaceChip,
    compact ? styles.workspaceChipCompact : '',
    color ? accentStyles[color] : '',
    color ? styles.workspaceChipAccented : '',
  ]
    .filter(Boolean)
    .join(' ');
  return _jsx(TooltipProvider, {
    delayDuration: 300,
    children: _jsxs(Tooltip, {
      children: [
        _jsx(TooltipTrigger, {
          asChild: true,
          children: _jsxs('output', {
            className: className,
            'aria-label': ariaLabel,
            'data-web-shell-workspace': true,
            'data-web-shell-workspace-title': title,
            children: [
              _jsx('span', {
                className: styles.workspaceChipIcon,
                children: _jsx(WorkspaceFolderIcon, {}),
              }),
              _jsx('span', {
                className: styles.workspaceChipText,
                children: name,
              }),
            ],
          }),
        }),
        _jsx(TooltipContent, { side: 'top', children: title }),
      ],
    }),
  });
}
//# sourceMappingURL=WorkspaceIndicator.js.map
