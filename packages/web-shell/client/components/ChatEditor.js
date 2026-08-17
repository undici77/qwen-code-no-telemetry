import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import {
  forwardRef,
  memo,
  useImperativeHandle,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import {
  DAEMON_APPROVAL_MODES,
  useOptionalWorkspace,
} from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../i18n';
import { useWebShellPortalRoot } from '../portalRoot';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { SpecularComposerEffect } from './SpecularComposerEffect';
import { useWebShellCustomization } from '../customization';
import {
  useComposerCore,
  getComposerTagDisplay,
  getComposerTagLabel,
  getComposerTagValue,
} from '../hooks/useComposerCore';
import { AtMentionPanel } from './AtMentionPanel';
import { useFileUpload } from '../hooks/useFileUpload';
import { fileReferenceInsertText } from '../hooks/useAtMentionMenu';
import { cssUrlVar } from '../utils/cssUrlVar';
import {
  getComposerTagIconUrl,
  isBuiltinComposerTagIconUrl,
} from '../utils/composerTag';
import { isSafeImageSrc } from './messages/Markdown';
import { ModeIcon } from './ModeIcon';
import { planSlashSectionRows } from '../utils/slashSectionPlan';
import { getModelDisplayName } from '../utils/modelDisplay';
import { getContextUsageLevel } from '../utils/contextUsage';
import { formatContextUsageDetail } from '../utils/formatTokenCount';
import { normalizeImageMediaType } from '../utils/imageIngestion';
import { VoiceButton } from '../voice/VoiceButton';
import { LiveVoiceButton } from '../live/LiveVoiceButton';
import {
  GitBranchChipContent,
  GitBranchIndicator,
  gitBranchAriaLabel,
} from './GitBranchIndicator';
import { GitModePopover } from './GitModePopover';
import { BranchPickerPopover } from './BranchPickerPopover';
import { WorkspaceIndicator } from './WorkspaceIndicator';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderClosedIcon,
  LoaderCircleIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import { WorkspaceSelector } from './WorkspaceSelector';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  filterToolbarDropdownItems,
  getToolbarExpansionBudget,
  getToolbarItemVisibilityWithHysteresis,
  resolveToolbarModelLabel,
} from './toolbarDropdown';
import styles from './ChatEditor.module.css';
// Dropped folders surface in `dataTransfer.files` as 0-byte Files; only the
// items API can tell them apart, and folder uploads are out of scope.
function collectDroppedFiles(dataTransfer) {
  const items = dataTransfer.items;
  if (!items || items.length === 0) {
    return Array.from(dataTransfer.files);
  }
  const files = [];
  for (const item of Array.from(items)) {
    if (item.kind !== 'file') continue;
    if (item.webkitGetAsEntry?.()?.isDirectory) continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }
  return files;
}
const ACTIVE_TOOLBAR_ACTIONS = [
  'approvalMode',
  'contextUsage',
  'gitBranch',
  'model',
  'widthMode',
  'voice',
  'workspace',
];
const ACTIVE_TOOLBAR_ACTION_SET = new Set(ACTIVE_TOOLBAR_ACTIONS);
const CHAT_EDITOR_THEME = {
  '&': {
    fontSize: '14px',
    background: 'transparent',
    border: 'none',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    maxHeight: 'var(--chat-editor-input-max-height, 300px)',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  '.cm-content': {
    padding: '0',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--chat-editor-text-primary, #e0e0e0)',
    caretColor: 'var(--chat-editor-accent-color, #4a9eff)',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-placeholder': {
    color: 'var(--chat-editor-text-dimmed, #666)',
  },
  '.cm-followup-ghost': {
    color: 'var(--chat-editor-text-dimmed, #666)',
    opacity: '0.72',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--chat-editor-selection-bg) !important',
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: 'var(--chat-editor-selection-bg) !important',
  },
  '&.cm-focused .cm-content ::selection': {
    backgroundColor: 'var(--chat-editor-selection-bg)',
    color: 'var(--chat-editor-selection-color)',
  },
  '.cm-content ::selection': {
    backgroundColor: 'var(--chat-editor-selection-bg)',
    color: 'var(--chat-editor-selection-color)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--chat-editor-accent-color, #4a9eff)',
    borderLeftWidth: '2px',
  },
};
function isTouchLikeDevice() {
  if (typeof window === 'undefined') return false;
  return (
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: none), (pointer: coarse)').matches)
  );
}
function TopComposerTag({ tag, content, tooltip, onActivate, onRemove }) {
  const anchorRef = useRef(null);
  const portalRoot = useWebShellPortalRoot();
  const hasTooltip = tooltip !== undefined && tooltip !== null;
  const tagContent = _jsx('span', {
    className: styles.tagContent,
    'data-web-shell-composer-tag-trigger': true,
    role: onActivate ? 'button' : undefined,
    tabIndex: onActivate || hasTooltip ? 0 : undefined,
    onClick: (event) => {
      if (!onActivate) return;
      event.stopPropagation();
      onActivate(
        anchorRef.current?.getBoundingClientRect() ??
          event.currentTarget.getBoundingClientRect(),
      );
    },
    onKeyDown: (event) => {
      if (!onActivate) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onActivate(
        anchorRef.current?.getBoundingClientRect() ??
          event.currentTarget.getBoundingClientRect(),
      );
    },
    children: content,
  });
  const tagElement = _jsxs('span', {
    ref: anchorRef,
    className: styles.tag,
    'data-web-shell-composer-tag': true,
    children: [
      hasTooltip
        ? _jsx(TooltipPrimitive.Trigger, {
            asChild: true,
            children: tagContent,
          })
        : tagContent,
      onRemove &&
        _jsx('button', {
          type: 'button',
          className: styles.tagRemove,
          'aria-label': `Remove ${getComposerTagDisplay(tag)}`,
          onMouseDown: (event) => event.preventDefault(),
          onClick: (event) => {
            event.stopPropagation();
            onRemove();
          },
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.stopPropagation();
              return;
            }
            if (event.key !== 'Backspace' && event.key !== 'Delete') return;
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          },
          children: '\u00D7',
        }),
    ],
  });
  if (!hasTooltip) return tagElement;
  return _jsxs(TooltipPrimitive.Root, {
    disableHoverableContent: false,
    children: [
      tagElement,
      _jsx(TooltipPrimitive.Portal, {
        container: portalRoot ?? undefined,
        children: _jsx(TooltipPrimitive.Content, {
          className: styles.tagTooltip,
          'data-web-shell-composer-tag-tooltip': true,
          sideOffset: 6,
          collisionPadding: 8,
          avoidCollisions: true,
          children: tooltip,
        }),
      }),
    ],
  });
}
function SendIcon() {
  return _jsx('svg', {
    className: styles.sendIcon,
    viewBox: '0 0 20 20',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
    children: _jsx('path', {
      d: 'M10 15.5v-11M5.5 9 10 4.5 14.5 9',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  });
}
function StopIcon() {
  return _jsx('span', { className: styles.stopIcon, 'aria-hidden': 'true' });
}
function LoadingIcon() {
  return _jsx('span', { className: styles.loadingIcon, 'aria-hidden': 'true' });
}
function QuickActionsIcon() {
  return _jsx('svg', {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    children: [7, 12, 17].flatMap((y) =>
      [7, 12, 17].map((x) =>
        _jsx(
          'circle',
          { cx: x, cy: y, r: '1.35', fill: 'currentColor' },
          `${x}-${y}`,
        ),
      ),
    ),
  });
}
function TypewriterPlaceholder({ text }) {
  const totalRuns = 2;
  const replayDelay = 3000;
  const reducedMotion = usePrefersReducedMotion();
  const [visibleText, setVisibleText] = useState(reducedMotion ? text : '');
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (reducedMotion) {
      setVisibleText(text);
      setFinished(false);
      return undefined;
    }
    let run = 0;
    let timer = 0;
    const startRun = () => {
      let index = 0;
      setVisibleText('');
      setFinished(false);
      const typeNextCharacter = () => {
        index += 1;
        setVisibleText(text.slice(0, index));
        if (index === text.length) {
          run += 1;
          setFinished(true);
          if (run < totalRuns) {
            timer = window.setTimeout(startRun, replayDelay);
          }
          return;
        }
        timer = window.setTimeout(typeNextCharacter, 45);
      };
      timer = window.setTimeout(typeNextCharacter, 45);
    };
    startRun();
    return () => window.clearTimeout(timer);
  }, [reducedMotion, text]);
  return _jsxs('span', {
    className: styles.typewriterPlaceholder,
    'data-web-shell-composer-typewriter': true,
    'aria-hidden': 'true',
    children: [
      visibleText,
      !reducedMotion &&
        _jsx('span', {
          className: `${styles.typewriterCaret} ${finished ? styles.typewriterCaretFinished : ''}`,
          children: '_',
        }),
    ],
  });
}
function WidthModeIcon({ mode }) {
  if (mode === 'wide') {
    return _jsxs('svg', {
      viewBox: '0 0 1024 1024',
      'aria-hidden': 'true',
      children: [
        _jsx('path', {
          d: 'M550.012 486.537a8.16 8.16 0 0 1 8.17-8.17h305.36l-111.88-111.89c-3.19-3.19-3.19-8.4 0-11.59l25.08-25.08c3.19-3.19 8.4-3.19 11.59 0l168.61 168.6c3.19 3.19 3.19 8.4 0 11.59l-164.47 168.67c-3.19 3.19-8.4 3.19-11.59 0l-25.61-25.61c-3.19-3.19-3.19-8.4 0-11.59l106.58-110.78-303.62 0.11c-4.52 0-8.23-3.71-8.23-8.23v-36.03z',
          fill: 'currentColor',
          transform: 'translate(-483.41 0)',
        }),
        _jsx('path', {
          d: 'M473.532 524.327a8.16 8.16 0 0 1-8.17 8.17h-305.36l111.88 111.88c3.19 3.19 3.19 8.4 0 11.59l-25.09 25.09c-3.19 3.19-8.4 3.19-11.59 0l-168.6-168.61c-3.19-3.19-3.19-8.4 0-11.59l164.47-168.67c3.19-3.19 8.4-3.19 11.59 0l25.61 25.61c3.19 3.19 3.19 8.4 0 11.59l-106.59 110.78 303.62-0.11c4.52 0 8.23 3.71 8.23 8.23v36.04z',
          fill: 'currentColor',
          transform: 'translate(483.41 0)',
        }),
      ],
    });
  }
  return _jsx('svg', {
    viewBox: '0 0 1024 1024',
    'aria-hidden': 'true',
    children: _jsx('path', {
      d: 'M473.532 524.327a8.16 8.16 0 0 1-8.17 8.17h-305.36l111.88 111.88c3.19 3.19 3.19 8.4 0 11.59l-25.09 25.09c-3.19 3.19-8.4 3.19-11.59 0l-168.6-168.61c-3.19-3.19-3.19-8.4 0-11.59l164.47-168.67c3.19-3.19 8.4-3.19 11.59 0l25.61 25.61c3.19 3.19 3.19 8.4 0 11.59l-106.59 110.78 303.62-0.11c4.52 0 8.23 3.71 8.23 8.23v36.04zM550.012 486.537a8.16 8.16 0 0 1 8.17-8.17h305.36l-111.88-111.89c-3.19-3.19-3.19-8.4 0-11.59l25.08-25.08c3.19-3.19 8.4-3.19 11.59 0l168.61 168.6c3.19 3.19 3.19 8.4 0 11.59l-164.47 168.67c-3.19 3.19-8.4 3.19-11.59 0l-25.61-25.61c-3.19-3.19-3.19-8.4 0-11.59l106.58-110.78-303.62 0.11c-4.52 0-8.23-3.71-8.23-8.23v-36.03z',
      fill: 'currentColor',
    }),
  });
}
const CONTEXT_RING_RADIUS = 6;
const CONTEXT_RING_CIRCUMFERENCE = 2 * Math.PI * CONTEXT_RING_RADIUS;
// The arc is visually capped at 100%; the numeric label keeps reporting
// real overflow.
function ContextUsageRing({ pct }) {
  const capped = Math.min(pct, 100);
  const level = getContextUsageLevel(pct);
  const valueClass =
    level === 'error'
      ? `${styles.contextRingValue} ${styles.contextRingValueError}`
      : level === 'warning'
        ? `${styles.contextRingValue} ${styles.contextRingValueWarning}`
        : styles.contextRingValue;
  return _jsxs('svg', {
    viewBox: '0 0 16 16',
    'aria-hidden': 'true',
    children: [
      _jsx('circle', {
        cx: '8',
        cy: '8',
        r: CONTEXT_RING_RADIUS,
        fill: 'none',
        strokeWidth: '2.5',
        className: styles.contextRingTrack,
      }),
      _jsx('circle', {
        cx: '8',
        cy: '8',
        r: CONTEXT_RING_RADIUS,
        fill: 'none',
        strokeWidth: '2.5',
        strokeLinecap: 'round',
        strokeDasharray: CONTEXT_RING_CIRCUMFERENCE,
        strokeDashoffset: CONTEXT_RING_CIRCUMFERENCE * (1 - capped / 100),
        transform: 'rotate(-90 8 8)',
        className: valueClass,
      }),
    ],
  });
}
function ModelIcon() {
  return _jsxs('svg', {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    children: [
      _jsx('path', {
        d: 'M12 3.5 19.4 7.8v8.4L12 20.5l-7.4-4.3V7.8L12 3.5Z',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.8',
        strokeLinejoin: 'round',
      }),
      _jsx('path', {
        d: 'm8.2 9.7 3.8 2.2 3.8-2.2M12 11.9v4.4',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.8',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
    ],
  });
}
function getQuickActionCommandName(action) {
  const text =
    action.action.type === 'run'
      ? action.action.command
      : action.action.type === 'insert'
        ? action.action.text
        : '';
  const match = text.trimStart().match(/^\/([^\s]+)/);
  return match?.[1] ?? null;
}
const QUICK_KEY_ITEMS = [
  {
    id: 'tab',
    label: 'Tab',
    descriptionKey: 'quickKeys.tab',
    event: { key: 'Tab', code: 'Tab' },
  },
  {
    id: 'escape',
    label: 'Esc',
    descriptionKey: 'quickKeys.escape',
    event: { key: 'Escape', code: 'Escape' },
  },
  {
    id: 'arrow-up',
    label: '↑',
    descriptionKey: 'quickKeys.history',
    event: { key: 'ArrowUp', code: 'ArrowUp' },
  },
  {
    id: 'arrow-down',
    label: '↓',
    descriptionKey: 'quickKeys.history',
    event: { key: 'ArrowDown', code: 'ArrowDown' },
  },
  {
    id: 'arrow-left',
    label: '←',
    descriptionKey: 'quickKeys.cursor',
    event: { key: 'ArrowLeft', code: 'ArrowLeft' },
  },
  {
    id: 'arrow-right',
    label: '→',
    descriptionKey: 'quickKeys.cursor',
    event: { key: 'ArrowRight', code: 'ArrowRight' },
  },
];
function CheckIcon() {
  return _jsx('svg', {
    viewBox: '0 0 16 16',
    'aria-hidden': 'true',
    children: _jsx('path', {
      d: 'm3 8.3 3.1 3.1L13 4.6',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '1.8',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  });
}
function getModeLabel(modeId, t) {
  const labels = {
    plan: t('mode.label.plan'),
    default: t('mode.label.default'),
    'auto-edit': t('mode.label.auto-edit'),
    auto: t('mode.label.auto'),
    yolo: t('mode.label.yolo'),
  };
  return labels[modeId] ?? modeId;
}
function getModeListLabel(modeId, t) {
  const labels = {
    plan: t('mode.listLabel.plan'),
    default: t('mode.listLabel.default'),
    'auto-edit': t('mode.listLabel.auto-edit'),
    auto: t('mode.listLabel.auto'),
    yolo: t('mode.listLabel.yolo'),
  };
  return labels[modeId] ?? getModeLabel(modeId, t);
}
function ToolbarPopover({
  open,
  items,
  activeId,
  onOpenChange,
  onSelect,
  trigger,
  tooltip,
  showCheck = false,
  searchable = false,
  searchLabel,
  noResultsLabel,
  header,
  submenu,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [collisionBoundary, setCollisionBoundary] = useState(null);
  const selectionRef = useRef(false);
  const handoffRef = useRef(false);
  const triggerRef = useRef(null);
  const submenuTriggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const returningFromSubmenuRef = useRef(false);
  const hasRichItems = items.some((item) => item.description || item.icon);
  const visibleItems = searchable
    ? filterToolbarDropdownItems(items, searchQuery)
    : items;
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSubmenuOpen(false);
      returningFromSubmenuRef.current = false;
    }
  }, [open]);
  useEffect(() => {
    if (open && submenuOpen) {
      searchInputRef.current?.focus();
      return;
    }
    if (open && returningFromSubmenuRef.current) {
      returningFromSubmenuRef.current = false;
      submenuTriggerRef.current?.focus();
    }
  }, [open, submenuOpen]);
  const hasCheckItems = hasRichItems || showCheck;
  const dropdownItems = _jsxs('div', {
    className: `${styles.dropdownList} ${
      hasRichItems ? styles.dropdownRich : showCheck ? styles.dropdownCheck : ''
    } ${searchable ? styles.dropdownListConstrained : ''}`,
    children: [
      visibleItems.map((item) =>
        _jsx(
          'button',
          {
            type: 'button',
            className: `${styles.dropdownItem} ${item.id === activeId ? styles.dropdownItemActive : ''}`,
            title: item.label,
            onClick: () => {
              selectionRef.current = true;
              onSelect(item.id);
            },
            children: hasCheckItems
              ? _jsxs(_Fragment, {
                  children: [
                    hasRichItems &&
                      _jsx('span', {
                        className: styles.dropdownItemIcon,
                        children: item.icon,
                      }),
                    _jsxs('span', {
                      className: styles.dropdownItemContent,
                      children: [
                        _jsx('span', {
                          className: styles.dropdownItemLabel,
                          children: item.label,
                        }),
                        item.description &&
                          _jsx('span', {
                            className: styles.dropdownItemDesc,
                            children: item.description,
                          }),
                      ],
                    }),
                    _jsx('span', {
                      className: styles.dropdownItemCheck,
                      children:
                        item.id === activeId ? _jsx(CheckIcon, {}) : null,
                    }),
                  ],
                })
              : item.label,
          },
          item.id,
        ),
      ),
      visibleItems.length === 0 &&
        noResultsLabel &&
        _jsx('div', {
          className: styles.dropdownEmpty,
          role: 'status',
          children: noResultsLabel(searchQuery),
        }),
    ],
  });
  const searchableItems = _jsxs(_Fragment, {
    children: [
      searchable &&
        _jsx(Input, {
          ref: searchInputRef,
          type: 'search',
          value: searchQuery,
          'aria-label': searchLabel,
          placeholder: searchLabel,
          autoComplete: 'off',
          onChange: (event) => setSearchQuery(event.target.value),
          onKeyDown: (event) => {
            if (!submenu || event.key !== 'ArrowLeft' || searchQuery) return;
            event.preventDefault();
            returningFromSubmenuRef.current = true;
            setSubmenuOpen(false);
          },
        }),
      dropdownItems,
    ],
  });
  return _jsxs(Popover, {
    open: open,
    onOpenChange: (nextOpen) => {
      if (nextOpen) {
        selectionRef.current = false;
        handoffRef.current = false;
        setCollisionBoundary(
          triggerRef.current?.closest('[data-web-shell-root]') ?? null,
        );
      }
      onOpenChange(nextOpen);
    },
    children: [
      tooltip
        ? _jsx(TooltipProvider, {
            delayDuration: 300,
            children: _jsxs(Tooltip, {
              children: [
                _jsx(TooltipTrigger, {
                  asChild: true,
                  children: _jsx(PopoverTrigger, {
                    ref: triggerRef,
                    asChild: true,
                    children: trigger,
                  }),
                }),
                _jsx(TooltipContent, { side: 'top', children: tooltip }),
              ],
            }),
          })
        : _jsx(PopoverTrigger, {
            ref: triggerRef,
            asChild: true,
            children: trigger,
          }),
      _jsx(PopoverContent, {
        side: 'top',
        align: 'start',
        collisionPadding: 8,
        collisionBoundary: collisionBoundary ?? undefined,
        'data-web-shell-toolbar-popover': true,
        'data-web-shell-reasoning-popover': submenu ? '' : undefined,
        onClick: (event) => event.stopPropagation(),
        onOpenAutoFocus: (event) => {
          if (!submenu) return;
          event.preventDefault();
          submenuTriggerRef.current?.focus();
        },
        onPointerDownOutside: (event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest('[data-web-shell-toolbar-popover-trigger]')
          ) {
            handoffRef.current = true;
          }
        },
        onCloseAutoFocus: (event) => {
          if (handoffRef.current) {
            event.preventDefault();
            handoffRef.current = false;
            return;
          }
          if (
            document.activeElement instanceof HTMLElement &&
            document.activeElement.closest('[data-web-shell-toolbar-popover]')
          ) {
            event.preventDefault();
            return;
          }
          if (!selectionRef.current) return;
          event.preventDefault();
          selectionRef.current = false;
        },
        children: submenu
          ? _jsxs(_Fragment, {
              children: [
                header,
                _jsxs('div', {
                  className: styles.dropdownSubmenuSection,
                  children: [
                    _jsx('div', {
                      className: styles.reasoningSectionTitle,
                      children: submenu.sectionLabel,
                    }),
                    _jsxs(Popover, {
                      open: submenuOpen,
                      onOpenChange: (nextOpen) => {
                        setSubmenuOpen(nextOpen);
                        if (!nextOpen) setSearchQuery('');
                      },
                      children: [
                        _jsx(PopoverTrigger, {
                          asChild: true,
                          children: _jsxs('button', {
                            type: 'button',
                            ref: submenuTriggerRef,
                            className: `${styles.dropdownItem} ${styles.dropdownSubmenuTrigger}`,
                            'data-web-shell-model-submenu-trigger': true,
                            'aria-haspopup': 'dialog',
                            'aria-expanded': submenuOpen,
                            'aria-label': submenu.triggerAriaLabel,
                            onKeyDown: (event) => {
                              if (event.key !== 'ArrowRight') return;
                              event.preventDefault();
                              setSubmenuOpen(true);
                            },
                            children: [
                              _jsx('span', {
                                title: submenu.triggerLabel,
                                children: submenu.triggerLabel,
                              }),
                              _jsx(ChevronRightIcon, { 'aria-hidden': 'true' }),
                            ],
                          }),
                        }),
                        _jsx(PopoverContent, {
                          side: 'right',
                          align: 'end',
                          alignOffset: -10,
                          sideOffset: 15,
                          collisionPadding: 8,
                          collisionBoundary: collisionBoundary ?? undefined,
                          'data-web-shell-toolbar-popover': true,
                          'data-web-shell-model-submenu': true,
                          onClick: (event) => event.stopPropagation(),
                          children: searchableItems,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            })
          : _jsxs(_Fragment, { children: [header, searchableItems] }),
      }),
    ],
  });
}
function ModelReasoningControls({ reasoning, onSelect }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const select = async (value) => {
    if (busy) return;
    setBusy(true);
    try {
      await onSelect(value);
    } catch {
      // The owning surface reports action errors.
    } finally {
      setBusy(false);
    }
  };
  return _jsxs('div', {
    className: styles.reasoningOptions,
    'data-web-shell-model-reasoning': true,
    children: [
      _jsx('div', {
        className: styles.reasoningSectionTitle,
        children: t('reasoning.options'),
      }),
      _jsxs('div', {
        className: styles.reasoningThinkingRow,
        children: [
          _jsx('span', { children: t('reasoning.thinking') }),
          _jsx(Switch, {
            checked: reasoning.enabled,
            disabled: busy,
            'aria-label': t('reasoning.thinking'),
            'data-web-shell-thinking-toggle': true,
            onCheckedChange: (enabled) =>
              void select(enabled ? reasoning.effort : 'none'),
          }),
        ],
      }),
      _jsx('div', { className: styles.reasoningDivider }),
      _jsx('div', {
        className: styles.reasoningSectionTitle,
        children: t('reasoning.effort'),
      }),
      reasoning.efforts.map((effort) =>
        _jsxs(
          'button',
          {
            type: 'button',
            className: styles.reasoningEffortRow,
            'aria-pressed': reasoning.effort === effort,
            'data-web-shell-effort': effort,
            disabled: !reasoning.enabled || busy,
            onClick: () => void select(effort),
            children: [
              _jsx('span', { children: t(`reasoning.effort.${effort}`) }),
              _jsx('span', {
                className: styles.dropdownItemCheck,
                children:
                  reasoning.effort === effort ? _jsx(CheckIcon, {}) : null,
              }),
            ],
          },
          effort,
        ),
      ),
    ],
  });
}
function SlashCommandPanel({
  menu,
  anchorRef,
  panelRef,
  detailRef,
  onClose,
  onSelect,
  onAccept,
}) {
  const itemRefs = useRef([]);
  const hoverAnchorRef = useRef(null);
  const [collisionBoundary, setCollisionBoundary] = useState(null);
  const [hoverDetail, setHoverDetail] = useState(null);
  useEffect(() => {
    itemRefs.current[menu.selectedIndex]?.scrollIntoView({
      block: 'nearest',
    });
  }, [menu.items, menu.selectedIndex]);
  useEffect(() => {
    setHoverDetail(null);
  }, [menu.items]);
  useLayoutEffect(() => {
    setCollisionBoundary(
      anchorRef.current?.closest('[data-web-shell-root]') ?? null,
    );
  }, [anchorRef]);
  useEffect(() => {
    const preserveImeEscape = (event) => {
      if (
        event.key !== 'Escape' ||
        (!event.isComposing && event.keyCode !== 229)
      ) {
        return;
      }
      Object.defineProperty(event, 'key', {
        configurable: true,
        value: 'Process',
      });
      window.addEventListener(
        'keydown',
        (currentEvent) => {
          if (currentEvent === event) Reflect.deleteProperty(event, 'key');
        },
        { once: true },
      );
    };
    window.addEventListener('keydown', preserveImeEscape, { capture: true });
    return () => {
      window.removeEventListener('keydown', preserveImeEscape, {
        capture: true,
      });
    };
  }, []);
  const rowPlans = planSlashSectionRows(menu.items, menu.kind);
  return _jsxs(_Fragment, {
    children: [
      _jsxs(Popover, {
        open: true,
        onOpenChange: (open) => {
          if (!open) onClose();
        },
        children: [
          _jsx(PopoverAnchor, { virtualRef: anchorRef }),
          _jsx(PopoverContent, {
            ref: panelRef,
            side: 'top',
            align: 'start',
            alignOffset: 16,
            sideOffset: 8,
            avoidCollisions: false,
            collisionPadding: 12,
            collisionBoundary: collisionBoundary ?? undefined,
            className:
              'duration-0 data-open:animate-none data-closed:animate-none',
            role: 'listbox',
            'data-web-shell-slash-menu': true,
            onOpenAutoFocus: (event) => event.preventDefault(),
            onCloseAutoFocus: (event) => event.preventDefault(),
            onInteractOutside: (event) => {
              const target = event.target;
              if (
                target instanceof Node &&
                (anchorRef.current?.contains(target) ||
                  detailRef.current?.contains(target))
              ) {
                event.preventDefault();
              }
            },
            onMouseDown: (event) => event.preventDefault(),
            onMouseLeave: (event) => {
              const nextTarget = event.relatedTarget;
              if (
                nextTarget instanceof Node &&
                detailRef.current?.contains(nextTarget)
              ) {
                return;
              }
              setHoverDetail(null);
            },
            children: _jsx('div', {
              className: styles.slashPanel,
              children: _jsx('div', {
                className: styles.slashPanelBody,
                children: _jsx('div', {
                  className: styles.slashList,
                  onScroll: () => setHoverDetail(null),
                  children: menu.items.map((item, index) => {
                    const plan = rowPlans[index];
                    return _jsxs(
                      'div',
                      {
                        className: styles.slashEntry,
                        children: [
                          plan.showHeader &&
                            _jsxs(_Fragment, {
                              children: [
                                plan.showDivider &&
                                  _jsx('div', {
                                    className: styles.slashSection,
                                  }),
                                _jsxs('div', {
                                  className: styles.slashSectionHeader,
                                  children: [
                                    _jsx('span', { children: item.section }),
                                    plan.count > 0
                                      ? _jsx('span', {
                                          className: styles.slashSectionCount,
                                          children: plan.count,
                                        })
                                      : null,
                                  ],
                                }),
                              ],
                            }),
                          _jsxs('button', {
                            ref: (node) => {
                              itemRefs.current[index] = node;
                            },
                            type: 'button',
                            role: 'option',
                            'aria-selected': index === menu.selectedIndex,
                            'data-has-description': item.detail
                              ? ''
                              : undefined,
                            className: `${styles.slashItem} ${
                              index === menu.selectedIndex
                                ? styles.slashItemActive
                                : ''
                            }`,
                            onMouseEnter: (event) => {
                              onSelect(index);
                              if (!item.detail) {
                                setHoverDetail(null);
                                return;
                              }
                              hoverAnchorRef.current = event.currentTarget;
                              const rowRect =
                                event.currentTarget.getBoundingClientRect();
                              const boundaryRect =
                                collisionBoundary?.getBoundingClientRect();
                              const left = boundaryRect?.left ?? 0;
                              const right =
                                boundaryRect?.right ?? window.innerWidth;
                              const top = boundaryRect?.top ?? 0;
                              const bottom =
                                boundaryRect?.bottom ?? window.innerHeight;
                              const detailWidth = Math.min(
                                320,
                                right - left - 24,
                              );
                              const side =
                                right - rowRect.right >= detailWidth + 8
                                  ? 'right'
                                  : rowRect.left - left >= detailWidth + 8
                                    ? 'left'
                                    : rowRect.top - top >=
                                        bottom - rowRect.bottom
                                      ? 'top'
                                      : 'bottom';
                              setHoverDetail({
                                label: item.label,
                                detail: item.detail,
                                side,
                              });
                            },
                            onMouseDown: (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onAccept(index);
                            },
                            children: [
                              _jsx('span', {
                                className: styles.slashCommand,
                                children: item.label,
                              }),
                              item.detail &&
                                _jsx('span', {
                                  className: styles.slashDescription,
                                  children: item.detail,
                                }),
                            ],
                          }),
                        ],
                      },
                      `${item.id}:${index}`,
                    );
                  }),
                }),
              }),
            }),
          }),
        ],
      }),
      _jsxs(Popover, {
        open: Boolean(hoverDetail),
        onOpenChange: (open) => {
          if (!open) setHoverDetail(null);
        },
        children: [
          _jsx(PopoverAnchor, { virtualRef: hoverAnchorRef }),
          hoverDetail &&
            _jsx(PopoverContent, {
              ref: detailRef,
              side: hoverDetail.side,
              align: 'start',
              sideOffset: 8,
              collisionPadding: 12,
              collisionBoundary: collisionBoundary ?? undefined,
              className:
                'duration-0 data-open:animate-none data-closed:animate-none',
              'data-web-shell-slash-detail': true,
              onOpenAutoFocus: (event) => event.preventDefault(),
              onCloseAutoFocus: (event) => event.preventDefault(),
              onMouseLeave: (event) => {
                const nextTarget = event.relatedTarget;
                if (
                  nextTarget instanceof Node &&
                  panelRef.current?.contains(nextTarget)
                ) {
                  return;
                }
                setHoverDetail(null);
              },
              children: _jsxs('div', {
                className: styles.slashDetail,
                children: [
                  _jsx('div', {
                    className: styles.slashDetailCommand,
                    children: hoverDetail.label,
                  }),
                  _jsx('div', {
                    className: styles.slashDetailText,
                    children: hoverDetail.detail,
                  }),
                ],
              }),
            }),
        ],
      }),
    ],
  });
}
function QuickActionsPanel({
  actions,
  onRun,
  onPressKey,
  showKeyHints = true,
}) {
  const { t } = useI18n();
  return _jsxs('div', {
    className: styles.quickActionsPanel,
    onMouseDown: (event) => event.stopPropagation(),
    onClick: (event) => event.stopPropagation(),
    children: [
      _jsx('div', {
        className: styles.quickActionsHeader,
        children: t('quickActions.title'),
      }),
      _jsxs('div', {
        className: styles.quickActionsLayout,
        children: [
          _jsx('div', {
            className: styles.quickActionsGrid,
            children: actions.map((action) =>
              _jsx(
                'button',
                {
                  type: 'button',
                  className: styles.quickAction,
                  onClick: () => onRun(action),
                  children: _jsx('span', {
                    className: styles.quickActionLabel,
                    children: action.label,
                  }),
                },
                action.id,
              ),
            ),
          }),
          showKeyHints &&
            _jsx('div', {
              className: styles.quickKeysGrid,
              children: QUICK_KEY_ITEMS.map((item) =>
                _jsx(
                  'button',
                  {
                    type: 'button',
                    className: styles.quickKey,
                    title: t(item.descriptionKey),
                    onMouseDown: (event) => event.preventDefault(),
                    onClick: () => onPressKey(item),
                    children: _jsx('span', {
                      className: styles.quickKeyLabel,
                      children: item.label,
                    }),
                  },
                  item.id,
                ),
              ),
            }),
        ],
      }),
    ],
  });
}
export const ChatEditor = memo(
  forwardRef(function ChatEditor(props, ref) {
    const {
      onSubmit,
      onInputTextChange,
      onAttachmentsChange,
      onCycleMode,
      onToggleShortcuts,
      onCancel,
      isRunning = false,
      isPreparing = false,
      cancelArmed = false,
      disabled = false,
      placeholderText = 'Type a message...',
      animatePlaceholder = true,
      commands,
      skills = [],
      slashCommandCategoryOrder,
      queuedMessages = [],
      onPopQueuedMessages,
      currentMode = 'default',
      sessionWorkflowEnabled = false,
      currentModel = '',
      gitBranch,
      gitWorktree,
      gitCwd,
      gitModeIntent,
      onGitModeIntentChange,
      gitStatus,
      onOpenGitDiff,
      onOpenCommit,
      workspaceName,
      workspaceTitle,
      workspaceColor,
      chatWidthMode = '1000',
      showChatWidthToggle = true,
      chatWidthToggleMin,
      visibleToolbarActions,
      tokenCount = 0,
      contextWindow = 0,
      onShowContextUsage,
      availableModels = [],
      onSelectMode,
      onSelectModel,
      reasoning,
      onSelectReasoningEffort,
      workspaces,
      selectedWorkspaceCwd,
      workspaceSelectionDisabled = false,
      onSelectWorkspace,
      scratchWorkspaceSupported = false,
      existingFolderWorkspaceSupported = false,
      workspaceMutationBusy = false,
      onCreateScratchWorkspace,
      onOpenExistingWorkspace,
      atWorkspaceCwd,
      onChatWidthModeChange,
      onFocusFooter,
      dialogOpen = false,
      followupState,
      onAcceptFollowup,
      onDismissFollowup,
      sessionId,
      sessionName,
      composerInput,
      composerInputVersion,
      builtinAtProviders,
      atProviders,
      composerTagIcons,
      voiceTarget,
      voiceStatusRevision,
      onImageIngestionNotice,
      onImagePreview,
    } = props;
    const {
      renderComposerToolbarStart: ToolbarStart,
      renderComposerToolbarEnd: ToolbarEnd,
      renderComposerToolbarRight: ToolbarRight,
      renderComposerTag,
      renderComposerTagTooltip,
      onComposerTagClick,
      parseUserMessageContent,
      fileUploadEnabled,
    } = useWebShellCustomization();
    // File-upload picker. The @ panel's "Upload file" item reports the browsed
    // directory; we click a hidden <input type="file"> so the browser treats it
    // as part of the user gesture, then upload into that directory.
    const fileInputRef = useRef(null);
    const uploadPickerTargetRef = useRef('.');
    const uploadPickerTargetKeyRef = useRef('');
    const uploadPickerRestoreRef = useRef(undefined);
    // Resolve the upload target BEFORE useComposerCore so the @ panel's upload
    // item can be capability-gated (hidden on daemons without the feature).
    const uploadWorkspace = useOptionalWorkspace();
    const uploadTarget = useMemo(() => {
      if (!uploadWorkspace) return undefined;
      // The host prop can force-disable upload even when the daemon advertises
      // the capability; it does NOT bypass the capability check. Both must
      // allow: `fileUploadEnabled === false` short-circuits, otherwise the
      // `workspace_file_upload` capability is still required.
      if (fileUploadEnabled === false) return undefined;
      const features = uploadWorkspace.capabilities?.features ?? [];
      if (!features.includes('workspace_file_upload')) return undefined;
      if (atWorkspaceCwd) {
        if (!features.includes('workspace_qualified_rest_core'))
          return undefined;
        // The selected workspace must be present exactly once and trusted.
        const matches = (uploadWorkspace.capabilities?.workspaces ?? []).filter(
          (w) => w.cwd === atWorkspaceCwd,
        );
        if (matches.length !== 1 || matches[0].trusted === false)
          return undefined;
        return {
          client: uploadWorkspace.client.workspaceByCwd(atWorkspaceCwd),
          targetKey: atWorkspaceCwd,
        };
      }
      const primaryMatches = (
        uploadWorkspace.capabilities?.workspaces ?? []
      ).filter((workspace) => workspace.primary);
      if (primaryMatches.length !== 1 || primaryMatches[0].trusted !== true)
        return undefined;
      return { client: uploadWorkspace.client, targetKey: '<primary>' };
    }, [uploadWorkspace, atWorkspaceCwd, fileUploadEnabled]);
    const uploadEnabled = uploadTarget !== undefined;
    const maxUploadBytes =
      uploadWorkspace?.capabilities?.limits?.maxWorkspaceFileUploadBytes ??
      50 * 1024 * 1024;
    const uploadTargetKey = `${sessionId ?? '<no-session>'}:${uploadTarget?.targetKey ?? '<none>'}`;
    // -- File upload ----------------------------------------------------------
    // The hook's cancel/reset granularity includes the session: ChatEditor is
    // shared across sessions (a switch swaps the doc in the same EditorView),
    // so an upload that survives a same-workspace session switch would append
    // its @file reference to the other session's draft.
    const fileUpload = useFileUpload({
      client: uploadTarget?.client,
      maxBytes: maxUploadBytes,
      targetKey: uploadTargetKey,
    });
    const triggerFilePicker = useCallback(
      (targetDir, restoreQuery) => {
        uploadPickerTargetRef.current = targetDir;
        uploadPickerTargetKeyRef.current = uploadTargetKey;
        uploadPickerRestoreRef.current = restoreQuery;
        fileInputRef.current?.click();
      },
      [uploadTargetKey],
    );
    // A pending picker restore belongs to the CURRENT target's draft. Flush
    // it before a target change (session switch, capability flip) persists or
    // replaces the doc: afterwards the editor holds another draft, and the
    // layout effect runs before the composer's passive session-swap effect
    // saves the outgoing draft. Also covers the picker being torn down while
    // the OS dialog is open — no cancel/change event will ever arrive.
    useLayoutEffect(() => {
      const restore = uploadPickerRestoreRef.current;
      uploadPickerRestoreRef.current = undefined;
      restore?.();
    }, [uploadTargetKey]);
    const core = useComposerCore({
      onSubmit,
      onInputTextChange,
      onCycleMode,
      onToggleShortcuts,
      disabled,
      placeholderText,
      commands,
      skills,
      slashCommandCategoryOrder,
      queuedMessages,
      onPopQueuedMessages,
      currentMode,
      onFocusFooter,
      dialogOpen,
      followupState,
      onAcceptFollowup,
      onDismissFollowup,
      sessionId,
      sessionName,
      composerInput,
      composerInputVersion,
      builtinAtProviders,
      atProviders,
      atWorkspaceCwd,
      composerTagIcons,
      parseUserMessageContent,
      renderComposerTag,
      renderComposerTagTooltip,
      onComposerTagClick,
      onImageIngestionNotice,
      onFileUploadRequest: uploadEnabled ? triggerFilePicker : undefined,
      workspaceUploadBusy: fileUpload.isBusy,
      editorTheme: CHAT_EDITOR_THEME,
    });
    const { t } = useI18n();
    useImperativeHandle(ref, () => core.handle, [core.handle]);
    const addComposerTags = core.addTags;
    const clearImageDragState = core.clearImageDragState;
    const insertUploadReference = useCallback(
      (path) => {
        const serialized = fileReferenceInsertText(path).trim();
        addComposerTags(
          [
            {
              id: `file:${serialized}`,
              kind: 'file',
              value: path,
              serialized,
            },
          ],
          { placement: 'inline', position: 'end' },
        );
      },
      [addComposerTags],
    );
    const uploadStatusText = (upload) => {
      switch (upload.status) {
        case 'pending':
          return t('composer.upload.pending');
        case 'uploading':
          return `${t('composer.upload.uploading')} ${Math.round(upload.progress * 100)}%`;
        case 'done':
          return upload.resultPath !== undefined &&
            upload.resultPath !== upload.targetPath
            ? `${t('composer.upload.renamed')} ${upload.resultPath}`
            : t('composer.upload.done');
        case 'error':
          return (
            upload.error ??
            (upload.errorCode === 'tooLarge'
              ? t('composer.upload.error.tooLarge', {
                  limit: `${Math.round(maxUploadBytes / (1024 * 1024))} MiB`,
                })
              : upload.errorCode === 'noDaemon'
                ? t('composer.upload.error.noDaemon')
                : upload.errorCode === 'tooManyFiles'
                  ? t('composer.upload.error.tooManyFiles', {
                      count: upload.skippedCount ?? 0,
                    })
                  : t('composer.upload.error'))
          );
      }
    };
    const [uploadDragActive, setUploadDragActive] = useState(false);
    const uploadDragDepthRef = useRef(0);
    const handleUploadDragEnter = useCallback(
      (event) => {
        if (
          !uploadEnabled ||
          disabled ||
          !event.dataTransfer.types.includes('Files')
        )
          return;
        event.preventDefault();
        uploadDragDepthRef.current += 1;
        setUploadDragActive(true);
      },
      [uploadEnabled, disabled],
    );
    const handleUploadDragOver = useCallback(
      (event) => {
        if (
          !uploadEnabled ||
          disabled ||
          !event.dataTransfer.types.includes('Files')
        )
          return;
        event.preventDefault();
      },
      [uploadEnabled, disabled],
    );
    const handleUploadDragLeave = useCallback(() => {
      if (uploadDragDepthRef.current === 0) return;
      uploadDragDepthRef.current = Math.max(0, uploadDragDepthRef.current - 1);
      if (uploadDragDepthRef.current === 0) setUploadDragActive(false);
    }, []);
    const clearUploadDragState = useCallback(() => {
      uploadDragDepthRef.current = 0;
      setUploadDragActive(false);
    }, []);
    // Shell regions outside the drop-handling surface (e.g. the upload
    // strip) must still cancel file drags; an uncancelled drop navigates
    // the tab to the file, tearing down the SPA mid-turn.
    const cancelShellFileDrag = useCallback((event) => {
      if (event.dataTransfer.types.includes('Files')) event.preventDefault();
    }, []);
    // `uploadFiles` is a stable callback from the hook; depend on it (not the
    // freshly-created `fileUpload` object) so these handlers are not rebuilt
    // on every render.
    const uploadFiles = fileUpload.uploadFiles;
    const handleUploadDrop = useCallback(
      (event) => {
        if (!event.dataTransfer.types.includes('Files')) {
          core.imageTransferHandlers.onDropCapture(event);
          return;
        }
        const files = collectDroppedFiles(event.dataTransfer);
        uploadDragDepthRef.current = 0;
        setUploadDragActive(false);
        if (disabled) {
          // Cancel the drop itself; otherwise the browser navigates the tab
          // to the dropped file, tearing down the Web Shell SPA mid-turn.
          event.preventDefault();
          return;
        }
        if (
          !uploadEnabled ||
          files.length === 0 ||
          files.every((file) => normalizeImageMediaType(file.type, file.name))
        ) {
          core.imageTransferHandlers.onDropCapture(event);
          return;
        }
        clearImageDragState();
        event.preventDefault();
        event.stopPropagation();
        uploadFiles(files, '.', insertUploadReference);
      },
      [
        core.imageTransferHandlers,
        clearImageDragState,
        disabled,
        uploadEnabled,
        uploadFiles,
        insertUploadReference,
      ],
    );
    const handleUploadPickerChange = useCallback(
      (event) => {
        const files = Array.from(event.target.files ?? []);
        const targetDir = uploadPickerTargetRef.current;
        const capturedKey = uploadPickerTargetKeyRef.current;
        const restore = uploadPickerRestoreRef.current;
        uploadPickerRestoreRef.current = undefined;
        event.target.value = '';
        // Only upload if the target workspace is unchanged since the picker
        // opened; otherwise a stale directory path would land in the newly
        // selected workspace (the hook's generation cancel only clears items
        // already queued, not this fresh call).
        if (
          files.length > 0 &&
          capturedKey !== '' &&
          capturedKey === uploadTargetKey
        ) {
          const queued = uploadFiles(files, targetDir, insertUploadReference);
          if (queued === 0) {
            // Every chosen file was rejected locally (e.g. all oversized):
            // the picker closed without any upload, so give the query back.
            restore?.();
          }
        } else {
          // The @ panel deleted the mention query before opening the picker.
          // A blocked or empty selection must give it back, like the native
          // cancel path does, instead of silently eating the typed text.
          restore?.();
        }
      },
      [uploadFiles, insertUploadReference, uploadTargetKey],
    );
    useEffect(() => {
      // React only wires `cancel` on <dialog>; the file input needs a native
      // listener. `cancel` does not bubble, so delegation cannot see it.
      const input = fileInputRef.current;
      if (!uploadEnabled || !input) return;
      const onCancel = () => {
        const restore = uploadPickerRestoreRef.current;
        uploadPickerRestoreRef.current = undefined;
        restore?.();
      };
      input.addEventListener('cancel', onCancel);
      return () => input.removeEventListener('cancel', onCancel);
    }, [uploadEnabled]);
    useEffect(() => {
      if (!uploadDragActive) return;
      window.addEventListener('dragend', clearUploadDragState);
      window.addEventListener('blur', clearUploadDragState);
      return () => {
        window.removeEventListener('dragend', clearUploadDragState);
        window.removeEventListener('blur', clearUploadDragState);
      };
    }, [clearUploadDragState, uploadDragActive]);
    useEffect(() => {
      if (disabled) clearUploadDragState();
    }, [clearUploadDragState, disabled]);
    useEffect(() => {
      onAttachmentsChange?.(core.hasAttachments);
    }, [core.hasAttachments, onAttachmentsChange]);
    const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [branchPickerOpen, setBranchPickerOpen] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(isTouchLikeDevice);
    const [typewriterSuppressed, setTypewriterSuppressed] = useState(false);
    const containerRef = useRef(null);
    const slashPanelRef = useRef(null);
    const slashDetailRef = useRef(null);
    const atPanelRef = useRef(null);
    const toolbarRef = useRef(null);
    const toolbarLeadingRef = useRef(null);
    const toolbarRightRef = useRef(null);
    const toolbarStartRef = useRef(null);
    const toolbarEndRef = useRef(null);
    const toolbarRightCustomRef = useRef(null);
    const toolbarMeasurementsRef = useRef(null);
    const [widthToggleFits, setWidthToggleFits] = useState(false);
    const [voiceActive, setVoiceActive] = useState(false);
    const [toolbarLabelVisibility, setToolbarLabelVisibility] = useState({
      workspaceSelect: false,
      workspace: false,
      gitBranch: false,
      mode: false,
      model: false,
    });
    const [lastConfirmedModelLabel, setLastConfirmedModelLabel] = useState('');
    const slashMenu = core.slashMenu;
    const closeSlashMenu = core.closeSlashMenu;
    const atMenu = core.atMenu;
    const closeAtMenu = core.closeAtMenu;
    const hasSlashMenu = Boolean(slashMenu);
    const hasAtMenu = Boolean(atMenu);
    const showTypewriterPlaceholder =
      animatePlaceholder &&
      !disabled &&
      Boolean(placeholderText) &&
      !core.hasInput() &&
      !typewriterSuppressed &&
      !core.shellMode &&
      !followupState?.isVisible;
    useEffect(() => {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const media = window.matchMedia('(hover: none), (pointer: coarse)');
      const update = () => setShowQuickActions(isTouchLikeDevice());
      update();
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }, []);
    useEffect(() => {
      if (!showQuickActions) setQuickActionsOpen(false);
    }, [showQuickActions]);
    useEffect(() => {
      if (!hasSlashMenu && !hasAtMenu) return;
      const onPointerOutside = (event) => {
        const target = event.target;
        const container = containerRef.current;
        if (
          target instanceof Node &&
          container &&
          !container.contains(target) &&
          !slashPanelRef.current?.contains(target) &&
          !slashDetailRef.current?.contains(target) &&
          !atPanelRef.current?.contains(target)
        ) {
          closeSlashMenu();
          closeAtMenu();
        }
      };
      window.addEventListener('mousedown', onPointerOutside);
      window.addEventListener('touchstart', onPointerOutside);
      return () => {
        window.removeEventListener('mousedown', onPointerOutside);
        window.removeEventListener('touchstart', onPointerOutside);
      };
    }, [hasAtMenu, hasSlashMenu, closeAtMenu, closeSlashMenu]);
    useEffect(() => {
      const container = containerRef.current;
      const minWidth = chatWidthToggleMin;
      if (!container || minWidth === undefined) {
        setWidthToggleFits(false);
        return;
      }
      const update = () => {
        setWidthToggleFits(
          container.getBoundingClientRect().width >= minWidth - 50,
        );
      };
      update();
      const resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, [chatWidthToggleMin]);
    const modeItems = useMemo(
      () =>
        DAEMON_APPROVAL_MODES.map((id) => ({
          id,
          label:
            id === 'plan' && sessionWorkflowEnabled
              ? t('mode.listLabel.planReview')
              : getModeListLabel(id, t),
          description: t(
            id === 'plan' && sessionWorkflowEnabled
              ? 'mode.desc.planReview'
              : `mode.desc.${id}`,
          ),
          icon: _jsx(ModeIcon, { mode: id }),
        })),
      [sessionWorkflowEnabled, t],
    );
    const visibleActionSet = useMemo(() => {
      if (!visibleToolbarActions) return null;
      const activeActions = visibleToolbarActions.filter((action) =>
        ACTIVE_TOOLBAR_ACTION_SET.has(action),
      );
      return new Set(activeActions);
    }, [visibleToolbarActions]);
    const showToolbarAction = (action) => {
      if (!visibleActionSet) return true;
      return visibleActionSet.has(action);
    };
    const showModeAction = showToolbarAction('approvalMode');
    const showModelAction = showToolbarAction('model');
    const commandNames = useMemo(
      () =>
        new Set(commands.map((command) => command.name.replace(/^\/+/, ''))),
      [commands],
    );
    const hasCommand = useCallback(
      (name) => commandNames.has(name),
      [commandNames],
    );
    const quickActions = useMemo(
      () =>
        [
          {
            id: 'new',
            label: t('quickActions.new'),
            action: { type: 'run', command: '/new' },
          },
          {
            id: 'resume',
            label: t('quickActions.resume'),
            action: { type: 'run', command: '/resume' },
          },
          {
            id: 'delete',
            label: t('quickActions.delete'),
            action: { type: 'run', command: '/delete' },
          },
          {
            id: 'branch',
            label: t('quickActions.branch'),
            action: { type: 'run', command: '/branch' },
          },
          {
            id: 'rewind',
            label: t('quickActions.rewind'),
            action: { type: 'run', command: '/rewind' },
          },
          {
            id: 'history-search',
            label: t('quickActions.historyQuestion'),
            action: {
              type: 'key',
              item: {
                id: 'ctrl-r',
                label: 'Ctrl+R',
                descriptionKey: 'quickKeys.searchHistory',
                event: { key: 'r', code: 'KeyR', ctrlKey: true },
              },
            },
          },
          {
            id: 'recap',
            label: t('quickActions.recap'),
            action: { type: 'run', command: '/recap' },
          },
          {
            id: 'stats',
            label: t('quickActions.stats'),
            action: { type: 'run', command: '/stats' },
          },
          {
            id: 'context',
            label: t('quickActions.context'),
            action: { type: 'run', command: '/context' },
          },
          {
            id: 'status',
            label: t('quickActions.status'),
            action: { type: 'run', command: '/status' },
          },
          {
            id: 'skills',
            label: t('quickActions.skills'),
            action: { type: 'run', command: '/skills detail' },
          },
          {
            id: 'tools',
            label: t('quickActions.tools'),
            action: { type: 'run', command: '/tools desc' },
          },
          {
            id: 'agents',
            label: t('quickActions.agents'),
            action: { type: 'run', command: '/agents' },
          },
          {
            id: 'mcp',
            label: t('quickActions.mcp'),
            action: { type: 'run', command: '/mcp' },
          },
          {
            id: 'memory',
            label: t('quickActions.memory'),
            action: { type: 'run', command: '/memory' },
          },
          {
            id: 'theme',
            label: t('quickActions.theme'),
            action: { type: 'run', command: '/theme' },
          },
          {
            id: 'shell',
            label: core.shellMode
              ? t('quickActions.exitShellMode')
              : t('quickActions.shellMode'),
            action: { type: 'shell' },
          },
          {
            id: 'goal',
            label: t('quickActions.setGoal'),
            action: { type: 'insert', text: '/goal ' },
          },
        ].filter((action) => {
          const commandName = getQuickActionCommandName(action);
          return !commandName || hasCommand(commandName);
        }),
      [core.shellMode, hasCommand, t],
    );
    const modelItems = useMemo(
      () =>
        availableModels.map((m) => ({
          id: m.id,
          label: getModelDisplayName(m.label || m.id),
          searchText: `${m.label ?? ''}\n${m.id}`,
        })),
      [availableModels],
    );
    const handleModeSelect = useCallback(
      (modeId) => {
        onSelectMode?.(modeId);
        setModeDropdownOpen(false);
        core.focus();
      },
      [onSelectMode, core],
    );
    const handleModelSelect = useCallback(
      (modelId) => {
        onSelectModel?.(modelId);
        setModelDropdownOpen(false);
        core.focus();
      },
      [onSelectModel, core],
    );
    const dispatchComposerKey = useCallback(
      (event) => {
        if (core.mobileComposer) {
          // No CodeMirror to dispatch into. History search is the one key
          // action with a non-keyboard equivalent; the rest are hidden on
          // the textarea backend.
          if (event.ctrlKey && event.key === 'r') {
            core.searchState.openHistorySearch();
          }
          return;
        }
        const view = core.viewRef.current;
        if (!view) return;
        view.focus();
        view.contentDOM.dispatchEvent(
          new KeyboardEvent('keydown', {
            ...event,
            bubbles: true,
            cancelable: true,
          }),
        );
      },
      [core],
    );
    const runQuickAction = useCallback(
      (action) => {
        setQuickActionsOpen(false);
        setModeDropdownOpen(false);
        setModelDropdownOpen(false);
        core.closeSlashMenu();
        core.closeAtMenu();
        if (action.action.type === 'insert') {
          core.insertText(action.action.text, { mode: 'replace' });
          return;
        }
        if (action.action.type === 'shell') {
          core.toggleShellMode();
          return;
        }
        if (action.action.type === 'key') {
          dispatchComposerKey(action.action.item.event);
          return;
        }
        onSubmit(action.action.command);
      },
      [core, dispatchComposerKey, onSubmit],
    );
    const pressQuickKey = useCallback(
      (item) => {
        dispatchComposerKey(item.event);
        if (item.id === 'ctrl-r') {
          setQuickActionsOpen(false);
        }
      },
      [dispatchComposerKey],
    );
    const {
      searchMode,
      searchQuery,
      searchMatches,
      searchActiveIndex,
      searchInputRef,
      searchUiRef,
      closeSearch,
      restoreSearchMatch,
      handleSearchKeyDown,
      handleSearchInput,
      handleSearchCompositionEnd,
    } = core.searchState;
    const renderComposerTagContent = (tag) => {
      const custom = renderComposerTag?.({
        tag,
        placement: 'composer',
        readonly: false,
      });
      if (custom !== undefined && custom !== null) {
        return custom;
      }
      const rawTagLabel = getComposerTagLabel(tag);
      const tagValue = getComposerTagValue(tag);
      const tagLabel = tag.kind ? '' : rawTagLabel;
      const iconUrl =
        tag.icon ?? getComposerTagIconUrl(tag.kind, composerTagIcons);
      const safeIconUrl =
        iconUrl &&
        (isBuiltinComposerTagIconUrl(iconUrl) || isSafeImageSrc(iconUrl))
          ? iconUrl
          : undefined;
      if (!tagLabel && !tagValue) {
        return _jsx('span', { className: styles.tagLabel, children: tag.id });
      }
      return _jsxs(_Fragment, {
        children: [
          safeIconUrl &&
            _jsx('span', {
              className: styles.tagIcon,
              style: cssUrlVar('--composer-tag-icon-url', safeIconUrl),
              'aria-hidden': 'true',
            }),
          tagLabel &&
            _jsx('span', { className: styles.tagLabel, children: tagLabel }),
          tagValue &&
            _jsx('span', { className: styles.tagValue, children: tagValue }),
        ],
      });
    };
    // Mode display label
    const modeLabel =
      currentMode === 'plan' && sessionWorkflowEnabled
        ? t('mode.label.planReview')
        : getModeLabel(currentMode, t);
    const currentModelLabel = currentModel
      ? (availableModels.find((model) => model.id === currentModel)?.label ??
        (currentModel.startsWith('qwen-route:')
          ? ''
          : getModelDisplayName(currentModel)))
      : '';
    const { modelLabel, modelLabelReady } = resolveToolbarModelLabel({
      currentModelLabel,
      lastConfirmedModelLabel,
    });
    const showReasoningOptions = Boolean(reasoning && onSelectReasoningEffort);
    const reasoningEffortLabel = reasoning
      ? t(`reasoning.effort.${reasoning.effort}`)
      : '';
    const modelChipLabel = showReasoningOptions
      ? `${modelLabel} · ${reasoning?.enabled ? reasoningEffortLabel : t('reasoning.thinkingOff')}`
      : modelLabel;
    const normalizedModelChipLabel = modelChipLabel.endsWith(' · ')
      ? modelLabel
      : modelChipLabel;
    const selectedWorkspace = workspaces?.find((entry) =>
      selectedWorkspaceCwd ? entry.cwd === selectedWorkspaceCwd : entry.primary,
    );
    const selectedWorkspaceLabel = selectedWorkspace?.label ?? '';
    const workspaceSelectVisible = Boolean(
      workspaces &&
        onSelectWorkspace &&
        (workspaces.length > 1 ||
          scratchWorkspaceSupported ||
          existingFolderWorkspaceSupported),
    );
    const workspaceIndicatorVisible = Boolean(
      workspaceName && showToolbarAction('workspace'),
    );
    const gitBranchVisible = Boolean(
      gitBranch && showToolbarAction('gitBranch'),
    );
    useLayoutEffect(() => {
      if (currentModelLabel && currentModelLabel !== lastConfirmedModelLabel) {
        setLastConfirmedModelLabel(currentModelLabel);
      }
    }, [currentModelLabel, lastConfirmedModelLabel]);
    const showWorkspaceSelectLabel = toolbarLabelVisibility.workspaceSelect;
    const showWorkspaceLabel = toolbarLabelVisibility.workspace;
    const showGitBranchLabel = toolbarLabelVisibility.gitBranch;
    const showModeLabel = toolbarLabelVisibility.mode;
    const showModelLabel = toolbarLabelVisibility.model;
    const showCancelButton = isRunning && !core.hasContent;
    const composerPreparing = isPreparing || core.pendingImageBatchCount > 0;
    const mobileVoiceActive = showQuickActions && voiceActive;
    useEffect(() => {
      if (mobileVoiceActive) setQuickActionsOpen(false);
    }, [mobileVoiceActive]);
    useLayoutEffect(() => {
      const toolbar = toolbarRef.current;
      const toolbarLeading = toolbarLeadingRef.current;
      const toolbarRight = toolbarRightRef.current;
      const measurements = toolbarMeasurementsRef.current;
      if (!toolbar || !toolbarLeading || !toolbarRight || !measurements) {
        return undefined;
      }
      const update = () => {
        const expansionWidth = (id) => {
          const collapsed = measurements.querySelector(
            `[data-toolbar-measure="${id}:collapsed"]`,
          );
          const expanded = measurements.querySelector(
            `[data-toolbar-measure="${id}:expanded"]`,
          );
          return Math.max(
            0,
            Math.ceil(expanded?.getBoundingClientRect().width ?? 0) -
              Math.ceil(collapsed?.getBoundingClientRect().width ?? 0),
          );
        };
        const items = [
          ...(workspaceSelectVisible
            ? [
                {
                  id: 'workspaceSelect',
                  expansionWidth: expansionWidth('workspaceSelect'),
                },
              ]
            : []),
          ...(workspaceIndicatorVisible
            ? [
                {
                  id: 'workspace',
                  expansionWidth: expansionWidth('workspace'),
                },
              ]
            : []),
          ...(gitBranchVisible
            ? [
                {
                  id: 'gitBranch',
                  expansionWidth: expansionWidth('gitBranch'),
                },
              ]
            : []),
          ...(showModeAction
            ? [
                {
                  id: 'mode',
                  expansionWidth: expansionWidth('mode'),
                },
              ]
            : []),
          ...(showModelAction
            ? [
                {
                  id: 'model',
                  expansionWidth: expansionWidth('model'),
                  ready: modelLabelReady,
                },
              ]
            : []),
        ];
        const currentExpansionWidth = items.reduce(
          (total, item) =>
            total + (toolbarLabelVisibility[item.id] ? item.expansionWidth : 0),
          0,
        );
        const currentLeadingWidth = toolbarLeading.scrollWidth;
        const gap = Math.ceil(
          Number.parseFloat(getComputedStyle(toolbar).columnGap) || 0,
        );
        const availableWidth = getToolbarExpansionBudget({
          toolbarWidth: Math.floor(toolbar.getBoundingClientRect().width),
          leadingWidth: currentLeadingWidth,
          rightWidth: Math.ceil(toolbarRight.getBoundingClientRect().width),
          currentExpansionWidth,
          gap,
        });
        const itemVisibility = getToolbarItemVisibilityWithHysteresis({
          availableWidth,
          items,
          currentVisibility: toolbarLabelVisibility,
          // Aggregate scrollWidth can differ from the sum of individually
          // rounded replicas by one pixel per item. Apply that slack only when
          // expanding so a collapsed/expanded pair cannot form a two-cycle.
          expansionMargin: items.length,
        });
        const next = {
          workspaceSelect: itemVisibility.workspaceSelect ?? false,
          workspace: itemVisibility.workspace ?? false,
          gitBranch: itemVisibility.gitBranch ?? false,
          mode: itemVisibility.mode ?? false,
          model: itemVisibility.model ?? false,
        };
        setToolbarLabelVisibility((current) => {
          const unchanged = Object.keys(next).every(
            (key) => current[key] === next[key],
          );
          return unchanged ? current : next;
        });
      };
      update();
      const resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(toolbar);
      resizeObserver.observe(toolbarLeading);
      resizeObserver.observe(toolbarRight);
      for (const child of measurements.children) {
        resizeObserver.observe(child);
      }
      const customToolbarRoots = [
        toolbarStartRef.current,
        toolbarEndRef.current,
        toolbarRightCustomRef.current,
      ].filter((element) => element !== null);
      const observeCustomToolbarContent = () => {
        for (const root of customToolbarRoots) {
          resizeObserver.observe(root);
          for (const child of root.children) {
            resizeObserver.observe(child);
          }
        }
      };
      observeCustomToolbarContent();
      const mutationObserver = new MutationObserver(() => {
        observeCustomToolbarContent();
        update();
      });
      for (const root of customToolbarRoots) {
        mutationObserver.observe(root, {
          attributes: true,
          characterData: true,
          childList: true,
          subtree: true,
        });
      }
      return () => {
        mutationObserver.disconnect();
        resizeObserver.disconnect();
      };
    }, [
      ToolbarEnd,
      ToolbarRight,
      ToolbarStart,
      disabled,
      gitBranch,
      gitBranchVisible,
      isRunning,
      modelLabelReady,
      modeLabel,
      normalizedModelChipLabel,
      sessionName,
      showModelAction,
      showModeAction,
      toolbarLabelVisibility,
      workspaceIndicatorVisible,
      workspaceName,
      workspaceSelectVisible,
      selectedWorkspaceLabel,
    ]);
    return _jsxs('div', {
      className: `${styles.editorShell} ${
        modeDropdownOpen || modelDropdownOpen
          ? styles.editorShellDropdownOpen
          : ''
      }`,
      'data-composer': true,
      'data-web-shell-composer': true,
      onDragOver: cancelShellFileDrag,
      onDrop: cancelShellFileDrag,
      children: [
        fileUpload.uploads.length > 0 &&
          _jsxs('div', {
            className: styles.uploadStrip,
            'data-web-shell-upload-strip': true,
            children: [
              _jsx('div', {
                className: styles.srOnly,
                role: 'status',
                'aria-live': 'polite',
                children: fileUpload.uploads
                  .filter(
                    (upload) =>
                      upload.status === 'done' || upload.status === 'error',
                  )
                  .map(
                    (upload) =>
                      `${upload.file.name}: ${uploadStatusText(upload)}`,
                  )
                  .join(' \u2014 '),
              }),
              fileUpload.uploads.map((upload) => {
                const busy =
                  upload.status === 'pending' || upload.status === 'uploading';
                return _jsxs(
                  'div',
                  {
                    className: styles.uploadRow,
                    'data-status': upload.status,
                    children: [
                      busy
                        ? _jsx(LoaderCircleIcon, {
                            className: styles.uploadRowSpinner,
                            'aria-hidden': 'true',
                          })
                        : _jsx(UploadIcon, { 'aria-hidden': 'true' }),
                      _jsx('span', {
                        className: styles.uploadRowName,
                        children: upload.file.name,
                      }),
                      _jsx('span', {
                        className: styles.uploadRowStatus,
                        children: uploadStatusText(upload),
                      }),
                      _jsx('button', {
                        type: 'button',
                        className: styles.uploadRowAction,
                        'aria-label': busy
                          ? t('composer.upload.cancel')
                          : t('composer.upload.dismiss'),
                        onClick: () => fileUpload.removeUpload(upload.id),
                        children: _jsx(XIcon, { 'aria-hidden': 'true' }),
                      }),
                    ],
                  },
                  upload.id,
                );
              }),
            ],
          }),
        _jsxs('div', {
          ref: containerRef,
          className: styles.container,
          'data-web-shell-composer-surface': true,
          'data-upload-drag-active': uploadDragActive || undefined,
          'data-typewriter-visible': showTypewriterPlaceholder || undefined,
          'data-image-drag-active':
            (core.imageDragActive && !uploadDragActive) || undefined,
          'aria-busy': core.pendingImageBatchCount > 0 || undefined,
          ...core.imageTransferHandlers,
          onDragEnter: handleUploadDragEnter,
          onDragOver: handleUploadDragOver,
          onDragLeave: handleUploadDragLeave,
          onDropCapture: handleUploadDrop,
          onClick: () => {
            setModeDropdownOpen(false);
            setModelDropdownOpen(false);
            setQuickActionsOpen(false);
            core.focus();
          },
          children: [
            _jsx(SpecularComposerEffect, { targetRef: containerRef }),
            uploadEnabled &&
              _jsx('input', {
                ref: fileInputRef,
                type: 'file',
                multiple: true,
                className: styles.hiddenUploadInput,
                'data-web-shell-upload-input': true,
                onChange: handleUploadPickerChange,
                tabIndex: -1,
                'aria-hidden': 'true',
              }),
            searchMode &&
              _jsxs('div', {
                ref: searchUiRef,
                className: styles.searchPanel,
                onMouseDown: (event) => event.stopPropagation(),
                onClick: (event) => event.stopPropagation(),
                children: [
                  _jsxs('div', {
                    className: styles.searchBar,
                    children: [
                      _jsx('span', {
                        className: styles.searchLabel,
                        children: t('editor.searchLabel'),
                      }),
                      _jsx('input', {
                        ref: searchInputRef,
                        className: styles.searchInput,
                        value: searchQuery,
                        onChange: handleSearchInput,
                        onCompositionEnd: handleSearchCompositionEnd,
                        onKeyDown: handleSearchKeyDown,
                        placeholder: t('editor.searchPlaceholder'),
                      }),
                    ],
                  }),
                  searchMatches.length > 0 &&
                    _jsx('div', {
                      className: styles.searchResults,
                      children: searchMatches.map((match, matchIndex) => {
                        return _jsxs(
                          'button',
                          {
                            type: 'button',
                            className: `${styles.searchResult} ${
                              matchIndex === searchActiveIndex
                                ? styles.searchResultActive
                                : ''
                            }`,
                            onMouseDown: (event) => {
                              event.preventDefault();
                              if (restoreSearchMatch) {
                                restoreSearchMatch(match);
                              } else {
                                core.replaceEditorText(match);
                              }
                              closeSearch(false);
                            },
                            children: [
                              _jsx('span', {
                                className: styles.searchResultMarker,
                                children:
                                  matchIndex === searchActiveIndex ? '›' : '',
                              }),
                              _jsx('span', {
                                className: styles.searchResultText,
                                children: match,
                              }),
                            ],
                          },
                          `${match}-${matchIndex}`,
                        );
                      }),
                    }),
                  searchMatches.length === 0 &&
                    _jsx('div', {
                      className: styles.searchEmpty,
                      children: t('editor.noHistory'),
                    }),
                ],
              }),
            _jsxs('div', {
              className: styles.content,
              children: [
                (core.composerTags.length > 0 ||
                  core.pastedImages.length > 0) &&
                  _jsxs('div', {
                    className: styles.attachments,
                    'data-web-shell-composer-attachments': true,
                    children: [
                      core.composerTags.length > 0 &&
                        _jsx(TooltipPrimitive.Provider, {
                          delayDuration: 0,
                          disableHoverableContent: false,
                          children: _jsx('div', {
                            className: styles.tags,
                            children: core.composerTags.map((tag) => {
                              const tagInfo = {
                                tag,
                                placement: 'composer',
                                readonly: false,
                              };
                              let tooltip;
                              try {
                                tooltip = renderComposerTagTooltip?.(tagInfo);
                              } catch (error) {
                                console.warn(
                                  '[WebShell] composer tag tooltip render failed',
                                  error,
                                );
                              }
                              return _jsx(
                                TopComposerTag,
                                {
                                  tag: tag,
                                  content: renderComposerTagContent(tag),
                                  tooltip: tooltip,
                                  onActivate: onComposerTagClick
                                    ? (anchorRect) =>
                                        onComposerTagClick({
                                          ...tagInfo,
                                          anchorRect,
                                        })
                                    : undefined,
                                  onRemove:
                                    tag.removable !== false
                                      ? () => {
                                          core.removeTopTag(tag.id);
                                          core.viewRef.current?.focus();
                                        }
                                      : undefined,
                                },
                                tag.id,
                              );
                            }),
                          }),
                        }),
                      core.pastedImages.length > 0 &&
                        _jsx('div', {
                          className: styles.images,
                          children: core.pastedImages.map((img, i) => {
                            const src = `data:${img.media_type};base64,${img.data}`;
                            return _jsxs(
                              'div',
                              {
                                className: styles.imageThumb,
                                children: [
                                  _jsx('img', {
                                    src: src,
                                    alt: '',
                                    onClick: onImagePreview
                                      ? () => onImagePreview(src)
                                      : undefined,
                                  }),
                                  _jsx('button', {
                                    type: 'button',
                                    className: styles.imageRemove,
                                    disabled: disabled,
                                    onClick: (e) => {
                                      e.stopPropagation();
                                      if (disabled) return;
                                      core.removeImage(i);
                                    },
                                    'aria-label': 'Remove image',
                                    children: _jsx('svg', {
                                      width: '8',
                                      height: '8',
                                      viewBox: '0 0 10 10',
                                      fill: 'none',
                                      'aria-hidden': 'true',
                                      children: _jsx('path', {
                                        d: 'M2 2l6 6M8 2l-6 6',
                                        stroke: 'currentColor',
                                        strokeWidth: '1.5',
                                        strokeLinecap: 'round',
                                      }),
                                    }),
                                  }),
                                ],
                              },
                              i,
                            );
                          }),
                        }),
                    ],
                  }),
                uploadDragActive &&
                  _jsxs('div', {
                    className: styles.uploadDropOverlay,
                    'data-web-shell-upload-drop-overlay': true,
                    children: [
                      _jsx(UploadIcon, { 'aria-hidden': 'true' }),
                      _jsx('span', { children: t('composer.upload.drop') }),
                    ],
                  }),
                core.slashMenu &&
                  _jsx(SlashCommandPanel, {
                    menu: core.slashMenu,
                    anchorRef: containerRef,
                    panelRef: slashPanelRef,
                    detailRef: slashDetailRef,
                    onClose: core.closeSlashMenu,
                    onSelect: core.selectSlashCompletion,
                    onAccept: core.acceptSlashCompletion,
                  }),
                core.atMenu &&
                  _jsx(AtMentionPanel, {
                    menu: core.atMenu,
                    anchorRef: containerRef,
                    panelRef: atPanelRef,
                    onSelect: core.selectAtCompletion,
                    onAccept: core.acceptAtCompletion,
                    onBack: () => {
                      const result = core.backAtCategories();
                      if (result === 'categories') {
                        window.setTimeout(() => core.focus(), 0);
                      }
                      return Boolean(result);
                    },
                    onSearch: core.updateAtSearch,
                    onSelectTab: core.selectAtTab,
                  }),
                _jsxs('div', {
                  className: styles.editorArea,
                  onPointerDownCapture: () => setTypewriterSuppressed(true),
                  onKeyDownCapture: () => setTypewriterSuppressed(true),
                  onBlurCapture: (event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setTypewriterSuppressed(false);
                    }
                  },
                  children: [
                    showTypewriterPlaceholder &&
                      _jsx(TypewriterPlaceholder, { text: placeholderText }),
                    core.shellMode &&
                      _jsx('span', {
                        className: styles.shellPrefix,
                        'aria-hidden': 'true',
                        children: '!',
                      }),
                    core.mobileComposer
                      ? // Touch devices get a plain textarea instead of CodeMirror:
                        // mobile virtual keyboards and IMEs interact poorly with the
                        // contenteditable editor (#5958). Enter inserts a newline
                        // natively; submission goes through the Send button.
                        _jsx('textarea', {
                          ref: core.mobileComposer.textareaRef,
                          className: styles.mobileTextarea,
                          value: core.mobileComposer.value,
                          onChange: core.mobileComposer.onChange,
                          onBlur: core.mobileComposer.onBlur,
                          placeholder: core.mobileComposer.placeholder,
                          disabled: core.disabled,
                          rows: 1,
                          enterKeyHint: 'enter',
                          autoCapitalize: 'off',
                          autoCorrect: 'off',
                          spellCheck: false,
                          'data-web-shell-composer-editor': true,
                        })
                      : _jsx('div', {
                          ref: core.containerRef,
                          'data-web-shell-composer-editor': true,
                        }),
                  ],
                }),
                _jsxs('div', {
                  ref: toolbarRef,
                  className: styles.toolbar,
                  'data-mobile-voice-active': mobileVoiceActive || undefined,
                  children: [
                    _jsxs('div', {
                      ref: toolbarLeadingRef,
                      className: styles.toolbarLeading,
                      'data-web-shell-toolbar-leading': true,
                      children: [
                        ToolbarStart &&
                          _jsx('div', {
                            ref: toolbarStartRef,
                            className: styles.toolbarStart,
                            children: _jsx(ToolbarStart, {
                              disabled: disabled,
                              isRunning: isRunning,
                              currentMode: currentMode,
                              currentModel: currentModel,
                              sessionName: sessionName,
                            }),
                          }),
                        _jsxs('div', {
                          className: styles.toolbarLeft,
                          children: [
                            workspaceSelectVisible &&
                              workspaces &&
                              onSelectWorkspace &&
                              _jsx(WorkspaceSelector, {
                                workspaces: workspaces,
                                selectedWorkspaceCwd: selectedWorkspaceCwd,
                                disabled: workspaceSelectionDisabled,
                                busy: workspaceMutationBusy,
                                scratchSupported: scratchWorkspaceSupported,
                                existingFolderSupported:
                                  existingFolderWorkspaceSupported,
                                className: `${styles.toolBtn} ${styles.workspaceSelectTrigger} ${
                                  showWorkspaceSelectLabel
                                    ? ''
                                    : styles.workspaceSelectTriggerCompact
                                }`,
                                onSelectWorkspace: onSelectWorkspace,
                                onCreateScratch:
                                  onCreateScratchWorkspace ?? (() => {}),
                                onOpenExistingFolder:
                                  onOpenExistingWorkspace ?? (() => {}),
                              }),
                            workspaceIndicatorVisible &&
                              workspaceName &&
                              _jsx(WorkspaceIndicator, {
                                name: workspaceName,
                                title: workspaceTitle ?? workspaceName,
                                color: workspaceColor,
                                compact: !showWorkspaceLabel,
                                ariaLabel: t('workspace.paneLabel', {
                                  name: workspaceName,
                                }),
                              }),
                            gitBranchVisible &&
                              gitBranch &&
                              (gitModeIntent && onGitModeIntentChange
                                ? _jsx(GitModePopover, {
                                    branch: gitBranch,
                                    compact: !showGitBranchLabel,
                                    intent: gitModeIntent,
                                    onIntentChange: onGitModeIntentChange,
                                  })
                                : _jsx(BranchPickerPopover, {
                                    open: branchPickerOpen,
                                    onOpenChange: setBranchPickerOpen,
                                    workspaceCwd: selectedWorkspace?.cwd ?? '',
                                    gitCwd: gitCwd,
                                    onOpenDiff: onOpenGitDiff,
                                    onOpenCommit: onOpenCommit,
                                    children: _jsx('button', {
                                      type: 'button',
                                      className: styles.gitBranchChipButton,
                                      'aria-label': gitBranchAriaLabel(
                                        gitBranch,
                                        gitStatus,
                                        t,
                                      ),
                                      children: _jsx(GitBranchIndicator, {
                                        branch: gitBranch,
                                        status: gitStatus,
                                        compact: !showGitBranchLabel,
                                        worktree: gitWorktree,
                                      }),
                                    }),
                                  })),
                            showModeAction &&
                              _jsx('div', {
                                className: `${styles.dropdownWrapper} ${showModeLabel ? '' : styles.dropdownWrapperCompact}`,
                                children: _jsx(ToolbarPopover, {
                                  open: modeDropdownOpen,
                                  items: modeItems,
                                  activeId: currentMode,
                                  onOpenChange: (open) => {
                                    setModeDropdownOpen(open);
                                    if (open) setModelDropdownOpen(false);
                                  },
                                  onSelect: handleModeSelect,
                                  tooltip: modeLabel,
                                  trigger: _jsxs('button', {
                                    className: `${styles.toolBtn} ${styles.modeToolBtn} ${showModeLabel ? '' : styles.toolBtnCompact}`,
                                    'data-web-shell-mode-button': true,
                                    'data-web-shell-toolbar-popover-trigger': true,
                                    onClick: (e) => {
                                      e.stopPropagation();
                                      core.closeSlashMenu();
                                      core.closeAtMenu();
                                      setQuickActionsOpen(false);
                                    },
                                    'aria-label': t('status.mode'),
                                    children: [
                                      _jsx('span', {
                                        className: styles.toolBtnModeIcon,
                                        children: _jsx(ModeIcon, {
                                          mode: currentMode,
                                        }),
                                      }),
                                      showModeLabel &&
                                        _jsx('span', {
                                          className: styles.toolBtnText,
                                          children: modeLabel,
                                        }),
                                      _jsx('span', {
                                        className: styles.toolBtnArrow,
                                        children: _jsx(ChevronDownIcon, {}),
                                      }),
                                    ],
                                  }),
                                }),
                              }),
                            showModelAction &&
                              _jsx('div', {
                                className: `${styles.dropdownWrapper} ${showModelLabel ? '' : styles.dropdownWrapperCompact}`,
                                children: _jsx(ToolbarPopover, {
                                  open: modelDropdownOpen,
                                  items: modelItems,
                                  activeId: currentModel,
                                  onOpenChange: (open) => {
                                    setModelDropdownOpen(open);
                                    if (open) setModeDropdownOpen(false);
                                  },
                                  onSelect: handleModelSelect,
                                  tooltip: modelLabel,
                                  showCheck: true,
                                  searchable: true,
                                  searchLabel: t('common.search'),
                                  noResultsLabel: (query) =>
                                    t('model.noMatch', { query }),
                                  submenu: showReasoningOptions
                                    ? {
                                        triggerLabel: modelLabel,
                                        triggerAriaLabel: `${t('model.select')}: ${modelLabel}`,
                                        sectionLabel: t('model.section'),
                                      }
                                    : undefined,
                                  header:
                                    showReasoningOptions &&
                                    reasoning &&
                                    onSelectReasoningEffort
                                      ? _jsx(ModelReasoningControls, {
                                          reasoning: reasoning,
                                          onSelect: onSelectReasoningEffort,
                                        })
                                      : undefined,
                                  trigger: _jsxs('button', {
                                    className: `${styles.toolBtn} ${styles.modelToolBtn} ${showModelLabel ? '' : styles.toolBtnCompact}`,
                                    'data-web-shell-model-button': true,
                                    'data-web-shell-toolbar-popover-trigger': true,
                                    onClick: (e) => {
                                      e.stopPropagation();
                                      core.closeSlashMenu();
                                      core.closeAtMenu();
                                      setQuickActionsOpen(false);
                                    },
                                    'aria-label': `${t('model.select')}: ${normalizedModelChipLabel}`,
                                    title: normalizedModelChipLabel,
                                    children: [
                                      _jsx('span', {
                                        className: styles.toolBtnModelIcon,
                                        children: _jsx(ModelIcon, {}),
                                      }),
                                      showModelLabel &&
                                        _jsx('span', {
                                          className: styles.toolBtnText,
                                          children: normalizedModelChipLabel,
                                        }),
                                      _jsx('span', {
                                        className: styles.toolBtnArrow,
                                        children: _jsx(ChevronDownIcon, {}),
                                      }),
                                    ],
                                  }),
                                }),
                              }),
                            ToolbarEnd &&
                              _jsx('div', {
                                ref: toolbarEndRef,
                                className: styles.toolbarEnd,
                                children: _jsx(ToolbarEnd, {
                                  disabled: disabled,
                                  isRunning: isRunning,
                                  currentMode: currentMode,
                                  currentModel: currentModel,
                                  sessionName: sessionName,
                                }),
                              }),
                          ],
                        }),
                      ],
                    }),
                    _jsxs('div', {
                      ref: toolbarRightRef,
                      className: styles.toolbarRight,
                      children: [
                        showQuickActions &&
                          quickActions.length > 0 &&
                          _jsx('button', {
                            className: `${styles.toolBtn} ${styles.quickActionsBtn}`,
                            'data-hide-during-mobile-voice': true,
                            onClick: (e) => {
                              e.stopPropagation();
                              core.closeSlashMenu();
                              core.closeAtMenu();
                              setModeDropdownOpen(false);
                              setModelDropdownOpen(false);
                              setQuickActionsOpen((value) => !value);
                            },
                            'aria-expanded': quickActionsOpen,
                            'aria-label': t('quickActions.open'),
                            title: t('quickActions.open'),
                            'data-tooltip': t('quickActions.open'),
                            children: _jsx('span', {
                              className: styles.toolBtnIcon,
                              children: _jsx(QuickActionsIcon, {}),
                            }),
                          }),
                        ToolbarRight &&
                          _jsx('div', {
                            ref: toolbarRightCustomRef,
                            className: styles.toolbarRightCustom,
                            'data-hide-during-mobile-voice': true,
                            children: _jsx(ToolbarRight, {
                              disabled: disabled,
                              isRunning: isRunning,
                              currentMode: currentMode,
                              currentModel: currentModel,
                              sessionName: sessionName,
                            }),
                          }),
                        showChatWidthToggle &&
                          widthToggleFits &&
                          showToolbarAction('widthMode') &&
                          _jsx('button', {
                            className: `${styles.toolBtn} ${styles.widthModeBtn}`,
                            'data-hide-during-mobile-voice': true,
                            onClick: (e) => {
                              e.stopPropagation();
                              onChatWidthModeChange?.(
                                chatWidthMode === 'wide' ? '1000' : 'wide',
                              );
                            },
                            disabled: !onChatWidthModeChange,
                            'aria-label':
                              chatWidthMode === 'wide'
                                ? t('settings.option.ui.chatWidth.1000')
                                : t('settings.option.ui.chatWidth.wide'),
                            title:
                              chatWidthMode === 'wide'
                                ? t('settings.option.ui.chatWidth.1000')
                                : t('settings.option.ui.chatWidth.wide'),
                            'data-tooltip':
                              chatWidthMode === 'wide'
                                ? t('settings.option.ui.chatWidth.1000')
                                : t('settings.option.ui.chatWidth.wide'),
                            children: _jsx('span', {
                              className: styles.toolBtnIcon,
                              children: _jsx(WidthModeIcon, {
                                mode: chatWidthMode,
                              }),
                            }),
                          }),
                        showToolbarAction('contextUsage') &&
                          contextWindow > 0 &&
                          tokenCount > 0 &&
                          _jsx(TooltipProvider, {
                            delayDuration: 300,
                            children: _jsxs(Tooltip, {
                              children: [
                                _jsx(TooltipTrigger, {
                                  asChild: true,
                                  children: _jsx('button', {
                                    className: `${styles.toolBtn} ${styles.contextUsageBtn}`,
                                    'data-hide-during-mobile-voice': true,
                                    'data-web-shell-context-usage': true,
                                    onClick: (e) => {
                                      e.stopPropagation();
                                      onShowContextUsage?.();
                                    },
                                    disabled: !onShowContextUsage,
                                    'aria-label': t('status.contextUsed', {
                                      pct: (
                                        (tokenCount / contextWindow) *
                                        100
                                      ).toFixed(1),
                                    }),
                                    children: _jsx('span', {
                                      className: styles.toolBtnIcon,
                                      children: _jsx(ContextUsageRing, {
                                        pct: (tokenCount / contextWindow) * 100,
                                      }),
                                    }),
                                  }),
                                }),
                                _jsx(TooltipContent, {
                                  side: 'top',
                                  children: formatContextUsageDetail(
                                    tokenCount,
                                    contextWindow,
                                  ),
                                }),
                              ],
                            }),
                          }),
                        showToolbarAction('voice') &&
                          _jsxs(_Fragment, {
                            children: [
                              _jsx(LiveVoiceButton, {}),
                              _jsx(VoiceButton, {
                                disabled: disabled,
                                onActiveChange: setVoiceActive,
                                target: voiceTarget,
                                statusRevision: voiceStatusRevision,
                                onInsert: (text) => {
                                  const existing = core.getText();
                                  const sep =
                                    existing && !/\s$/.test(existing)
                                      ? ' '
                                      : '';
                                  core.insertText(`${sep}${text} `);
                                  core.focus();
                                },
                              }),
                            ],
                          }),
                        _jsx('button', {
                          className:
                            composerPreparing || showCancelButton
                              ? `${styles.sendBtn} ${styles.sendBtnRunning}${cancelArmed ? ` ${styles.sendBtnArmed}` : ''}`
                              : styles.sendBtn,
                          disabled: composerPreparing
                            ? true
                            : showCancelButton
                              ? !onCancel
                              : !core.canSubmit,
                          'data-web-shell-composer-submit': true,
                          onClick: (e) => {
                            e.stopPropagation();
                            if (composerPreparing) {
                              return;
                            }
                            if (showCancelButton) {
                              onCancel?.();
                              return;
                            }
                            core.submitText();
                          },
                          'aria-label': composerPreparing
                            ? t('common.loading')
                            : showCancelButton
                              ? cancelArmed
                                ? t('stream.cancelArmed')
                                : t('stream.cancel')
                              : t('editor.send'),
                          title:
                            isRunning && cancelArmed
                              ? t('stream.cancelArmed')
                              : undefined,
                          children: composerPreparing
                            ? _jsx(LoadingIcon, {})
                            : showCancelButton
                              ? cancelArmed
                                ? _jsx('span', {
                                    className: styles.escLabel,
                                    'aria-hidden': 'true',
                                    children: 'Esc',
                                  })
                                : _jsx(StopIcon, {})
                              : _jsx(SendIcon, {}),
                        }),
                        _jsx('span', {
                          role: 'status',
                          'aria-live': 'polite',
                          className: styles.srOnly,
                          children:
                            isRunning && cancelArmed
                              ? t('stream.cancelArmed')
                              : '',
                        }),
                      ],
                    }),
                  ],
                }),
                _jsxs('div', {
                  ref: toolbarMeasurementsRef,
                  className: styles.toolbarMeasurements,
                  'aria-hidden': 'true',
                  children: [
                    workspaceSelectVisible &&
                      selectedWorkspace &&
                      _jsxs(_Fragment, {
                        children: [
                          _jsxs('span', {
                            'data-toolbar-measure': 'workspaceSelect:collapsed',
                            className: `${styles.toolBtn} ${styles.workspaceSelectTrigger} ${styles.workspaceSelectTriggerCompact}`,
                            children: [
                              _jsx(FolderClosedIcon, {
                                size: 16,
                                strokeWidth: 1.2,
                              }),
                              _jsx('span', {
                                className: styles.toolBtnText,
                                children: selectedWorkspaceLabel,
                              }),
                              _jsx('span', {
                                className: styles.toolBtnArrow,
                                children: _jsx(ChevronDownIcon, {}),
                              }),
                            ],
                          }),
                          _jsxs('span', {
                            'data-toolbar-measure': 'workspaceSelect:expanded',
                            className: `${styles.toolBtn} ${styles.workspaceSelectTrigger}`,
                            children: [
                              _jsx(FolderClosedIcon, {
                                size: 16,
                                strokeWidth: 1.2,
                              }),
                              _jsx('span', {
                                className: styles.toolBtnText,
                                children: selectedWorkspaceLabel,
                              }),
                              _jsx('span', {
                                className: styles.toolBtnArrow,
                                children: _jsx(ChevronDownIcon, {}),
                              }),
                            ],
                          }),
                        ],
                      }),
                    workspaceIndicatorVisible &&
                      workspaceName &&
                      _jsxs(_Fragment, {
                        children: [
                          _jsxs('span', {
                            'data-toolbar-measure': 'workspace:collapsed',
                            className: `${styles.workspaceChip} ${styles.workspaceChipCompact}`,
                            children: [
                              _jsx('span', {
                                className: styles.workspaceChipIcon,
                              }),
                              _jsx('span', {
                                className: styles.workspaceChipText,
                                children: workspaceName,
                              }),
                            ],
                          }),
                          _jsxs('span', {
                            'data-toolbar-measure': 'workspace:expanded',
                            className: styles.workspaceChip,
                            children: [
                              _jsx('span', {
                                className: styles.workspaceChipIcon,
                              }),
                              _jsx('span', {
                                className: styles.workspaceChipText,
                                children: workspaceName,
                              }),
                            ],
                          }),
                        ],
                      }),
                    gitBranchVisible &&
                      gitBranch &&
                      _jsxs(_Fragment, {
                        children: [
                          _jsx('span', {
                            'data-toolbar-measure': 'gitBranch:collapsed',
                            className: `${styles.gitBranchChip} ${styles.gitBranchChipCompact}`,
                            children: _jsx(GitBranchChipContent, {
                              branch: gitBranch,
                              status: gitStatus,
                              compact: true,
                              worktree: gitWorktree,
                            }),
                          }),
                          _jsx('span', {
                            'data-toolbar-measure': 'gitBranch:expanded',
                            className: styles.gitBranchChip,
                            children: _jsx(GitBranchChipContent, {
                              branch: gitBranch,
                              status: gitStatus,
                              compact: false,
                              worktree: gitWorktree,
                            }),
                          }),
                        ],
                      }),
                    _jsxs('span', {
                      'data-toolbar-measure': 'mode:collapsed',
                      className: `${styles.toolBtn} ${styles.modeToolBtn} ${styles.toolBtnCompact}`,
                      children: [
                        _jsx('span', {
                          className: styles.toolBtnModeIcon,
                          children: _jsx(ModeIcon, { mode: currentMode }),
                        }),
                        _jsx('span', {
                          className: styles.toolBtnText,
                          children: modeLabel,
                        }),
                        _jsx('span', {
                          className: styles.toolBtnArrow,
                          children: _jsx(ChevronDownIcon, {}),
                        }),
                      ],
                    }),
                    _jsxs('span', {
                      'data-toolbar-measure': 'mode:expanded',
                      className: `${styles.toolBtn} ${styles.modeToolBtn}`,
                      children: [
                        _jsx('span', {
                          className: styles.toolBtnModeIcon,
                          children: _jsx(ModeIcon, { mode: currentMode }),
                        }),
                        _jsx('span', {
                          className: styles.toolBtnText,
                          children: modeLabel,
                        }),
                        _jsx('span', {
                          className: styles.toolBtnArrow,
                          children: _jsx(ChevronDownIcon, {}),
                        }),
                      ],
                    }),
                    _jsxs('span', {
                      'data-toolbar-measure': 'model:collapsed',
                      className: `${styles.toolBtn} ${styles.modelToolBtn} ${styles.toolBtnCompact}`,
                      children: [
                        _jsx('span', {
                          className: styles.toolBtnModelIcon,
                          children: _jsx(ModelIcon, {}),
                        }),
                        _jsx('span', {
                          className: styles.toolBtnText,
                          children: normalizedModelChipLabel,
                        }),
                        _jsx('span', {
                          className: styles.toolBtnArrow,
                          children: _jsx(ChevronDownIcon, {}),
                        }),
                      ],
                    }),
                    _jsxs('span', {
                      'data-toolbar-measure': 'model:expanded',
                      className: `${styles.toolBtn} ${styles.modelToolBtn}`,
                      children: [
                        _jsx('span', {
                          className: styles.toolBtnModelIcon,
                          children: _jsx(ModelIcon, {}),
                        }),
                        _jsx('span', {
                          className: styles.toolBtnText,
                          children: normalizedModelChipLabel,
                        }),
                        _jsx('span', {
                          className: styles.toolBtnArrow,
                          children: _jsx(ChevronDownIcon, {}),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        showQuickActions &&
          quickActionsOpen &&
          quickActions.length > 0 &&
          _jsx(QuickActionsPanel, {
            actions: quickActions,
            onRun: runQuickAction,
            onPressKey: pressQuickKey,
            showKeyHints: !core.mobileComposer,
          }),
      ],
    });
  }),
);
//# sourceMappingURL=ChatEditor.js.map
