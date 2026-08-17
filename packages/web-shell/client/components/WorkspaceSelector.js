import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import { useRef, useState } from 'react';
import { FolderClosedIcon, FolderPlusIcon, LockIcon } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
/**
 * Composer workspace menu. Capability-gated creation actions and disabled
 * untrusted entries keep presentation aligned with daemon authorization.
 */
export function WorkspaceSelector({
  workspaces,
  selectedWorkspaceCwd,
  disabled,
  busy,
  scratchSupported,
  existingFolderSupported,
  className,
  onSelectWorkspace,
  onCreateScratch,
  onOpenExistingFolder,
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const menuOpenRef = useRef(false);
  const suppressTooltipRef = useRef(false);
  const selected = workspaces.find((workspace) =>
    selectedWorkspaceCwd
      ? workspace.cwd === selectedWorkspaceCwd
      : workspace.primary,
  );
  const canCreate = scratchSupported || existingFolderSupported;
  if (workspaces.length <= 1 && !canCreate) return null;
  return _jsx(TooltipProvider, {
    delayDuration: 300,
    children: _jsxs(DropdownMenu, {
      open: menuOpen,
      onOpenChange: (open) => {
        menuOpenRef.current = open;
        setMenuOpen(open);
        if (open) {
          suppressTooltipRef.current = true;
          setTooltipOpen(false);
        }
      },
      children: [
        _jsxs(Tooltip, {
          open: tooltipOpen,
          onOpenChange: (open) => {
            if (open && (menuOpen || suppressTooltipRef.current)) {
              return;
            }
            setTooltipOpen(open);
          },
          children: [
            _jsx(TooltipTrigger, {
              asChild: true,
              children: _jsx(DropdownMenuTrigger, {
                asChild: true,
                disabled: disabled || busy,
                children: _jsxs('button', {
                  type: 'button',
                  className: className,
                  'aria-label': t('sidebar.workspaceSelectLabel'),
                  onPointerEnter: () => {
                    if (!menuOpenRef.current) {
                      suppressTooltipRef.current = false;
                    }
                  },
                  onPointerLeave: () => {
                    suppressTooltipRef.current = false;
                    setTooltipOpen(false);
                  },
                  onBlur: () => {
                    if (!menuOpenRef.current) {
                      suppressTooltipRef.current = false;
                      setTooltipOpen(false);
                    }
                  },
                  children: [
                    _jsx(FolderClosedIcon, { size: 16, strokeWidth: 1.2 }),
                    _jsx('span', {
                      'data-slot': 'select-value',
                      children: selected?.label ?? '',
                    }),
                  ],
                }),
              }),
            }),
            _jsx(TooltipContent, { side: 'top', children: selected?.label }),
          ],
        }),
        _jsxs(DropdownMenuContent, {
          align: 'start',
          className: 'min-w-56',
          children: [
            _jsx(DropdownMenuRadioGroup, {
              value: selected?.id,
              onValueChange: (id) => {
                const next = workspaces.find(
                  (workspace) => workspace.id === id,
                );
                if (!next?.trusted) return;
                onSelectWorkspace(next.primary ? undefined : next.cwd);
              },
              children: workspaces.map((workspace) =>
                _jsxs(
                  DropdownMenuRadioItem,
                  {
                    value: workspace.id,
                    disabled: !workspace.trusted,
                    title: workspace.cwd,
                    children: [
                      _jsx('span', {
                        className: 'min-w-0 flex-1 truncate',
                        children: workspace.label,
                      }),
                      !workspace.trusted &&
                        _jsxs('span', {
                          className:
                            'flex items-center gap-1 text-xs text-muted-foreground',
                          children: [
                            _jsx(LockIcon, {}),
                            t('sidebar.workspaceUntrusted'),
                          ],
                        }),
                    ],
                  },
                  workspace.id,
                ),
              ),
            }),
            canCreate &&
              _jsxs(_Fragment, {
                children: [
                  _jsx(DropdownMenuSeparator, {}),
                  _jsxs(DropdownMenuSub, {
                    children: [
                      _jsxs(DropdownMenuSubTrigger, {
                        disabled: busy,
                        children: [
                          _jsx(FolderPlusIcon, {}),
                          t('sidebar.newWorkspace'),
                        ],
                      }),
                      _jsxs(DropdownMenuSubContent, {
                        children: [
                          scratchSupported &&
                            _jsx(DropdownMenuItem, {
                              onSelect: onCreateScratch,
                              children: t('sidebar.startFromScratch'),
                            }),
                          existingFolderSupported &&
                            _jsx(DropdownMenuItem, {
                              onSelect: onOpenExistingFolder,
                              children: t('sidebar.useExistingFolder'),
                            }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
          ],
        }),
      ],
    }),
  });
}
//# sourceMappingURL=WorkspaceSelector.js.map
