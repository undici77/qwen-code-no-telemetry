import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { createContext, useEffect, useRef, useState } from 'react';
import { Maximize2Icon, Minimize2Icon, XIcon } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useTheme, WebShellThemeId } from '../../themeContext';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import styles from './DialogShell.module.css';
const sizeClass = {
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[720px]',
  xl: 'sm:max-w-[900px]',
};
const FOCUSABLE_SELECTOR = [
  'a[href]:not([hidden])',
  'button:not([disabled]):not([hidden])',
  'input:not([disabled]):not([hidden])',
  'select:not([disabled]):not([hidden])',
  'textarea:not([disabled]):not([hidden])',
  '[tabindex]:not([tabindex="-1"]):not([hidden])',
].join(',');
function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
}
const shellStack = [];
export const DialogShellIdContext = createContext(null);
export function isTopDialogShellId(shellId) {
  if (shellId === null) return true;
  return shellStack[shellStack.length - 1] === shellId;
}
export function DialogShell({
  title,
  subtitle,
  size = 'md',
  allowFullscreen = false,
  dismissible = true,
  onClose,
  children,
}) {
  const { t } = useI18n();
  const theme = useTheme();
  const [fullscreen, setFullscreen] = useState(false);
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [previouslyFocused] = useState(() =>
    typeof document !== 'undefined' ? document.activeElement : null,
  );
  const backdropPressStartedRef = useRef(false);
  const backdropPressEndedRef = useRef(false);
  const shellIdRef = useRef(null);
  if (shellIdRef.current === null) shellIdRef.current = {};
  useEffect(() => {
    const shellId = shellIdRef.current;
    shellStack.push(shellId);
    const preserveImeEscape = (event) => {
      if (
        event.key !== 'Escape' ||
        (!event.isComposing && event.keyCode !== 229) ||
        !isTopDialogShellId(shellId)
      ) {
        return;
      }
      // Radix handles Escape on document capture and otherwise prevents the
      // native IME cancellation. Mask it only for Radix, then restore it before
      // the event continues to the focused input.
      Object.defineProperty(event, 'key', {
        configurable: true,
        value: 'Process',
      });
      document.addEventListener(
        'keydown',
        (currentEvent) => {
          if (currentEvent === event) Reflect.deleteProperty(event, 'key');
        },
        { capture: true, once: true },
      );
    };
    window.addEventListener('keydown', preserveImeEscape, { capture: true });
    return () => {
      window.removeEventListener('keydown', preserveImeEscape, {
        capture: true,
      });
      const index = shellStack.indexOf(shellId);
      if (index >= 0) shellStack.splice(index, 1);
      if (shellStack.length === 0) {
        previouslyFocused?.focus?.();
        return;
      }
      const scopes = Array.from(
        document.querySelectorAll('[data-keyboard-scope]'),
      );
      const topPanel = scopes[scopes.length - 1];
      const preferred = getFocusable(topPanel).find(
        (element) => !element.hasAttribute('data-dialog-close'),
      );
      (preferred ?? topPanel)?.focus();
    };
  }, [previouslyFocused]);
  const handleBackdropMouseDown = (event) => {
    backdropPressStartedRef.current = event.target === event.currentTarget;
    backdropPressEndedRef.current = false;
  };
  const handleBackdropMouseUp = (event) => {
    backdropPressEndedRef.current = event.target === event.currentTarget;
  };
  const handleBackdropClick = (event) => {
    const shouldClose =
      backdropPressStartedRef.current &&
      backdropPressEndedRef.current &&
      event.target === event.currentTarget;
    backdropPressStartedRef.current = false;
    backdropPressEndedRef.current = false;
    if (shouldClose && dismissible) onClose();
  };
  const themeClass =
    theme === WebShellThemeId.Light ? styles.themeLight : styles.themeDark;
  return _jsx(Dialog, {
    open: true,
    onOpenChange: (open) => {
      if (!open && dismissible) onClose();
    },
    children: _jsx(DialogShellIdContext.Provider, {
      value: shellIdRef.current,
      children: _jsxs(DialogContent, {
        ref: panelRef,
        showCloseButton: false,
        overlayProps: {
          onMouseDown: handleBackdropMouseDown,
          onMouseUp: handleBackdropMouseUp,
          onClick: handleBackdropClick,
        },
        className: `${themeClass} ${theme === WebShellThemeId.Dark ? 'dark' : ''} flex max-h-[min(80vh,calc(100vh-48px))] flex-col gap-0 overflow-hidden p-0 font-mono text-sm ${
          fullscreen
            ? 'h-[calc(100vh-32px)] max-h-[calc(100vh-32px)] max-w-[calc(100vw-32px)] sm:max-w-[calc(100vw-32px)]'
            : sizeClass[size]
        }`,
        'aria-label': title,
        'data-keyboard-scope': true,
        'data-web-shell-dialog': true,
        'data-web-shell-dialog-title': title,
        onPointerDownOutside: (event) => event.preventDefault(),
        onEscapeKeyDown: (event) => {
          if (event.defaultPrevented) return;
          if (event.isComposing || event.keyCode === 229) {
            return;
          }
          if (!isTopDialogShellId(shellIdRef.current)) {
            return;
          }
          event.preventDefault();
          if (dismissible) onCloseRef.current();
        },
        onOpenAutoFocus: (event) => {
          event.preventDefault();
          const preferred = getFocusable(panelRef.current).find(
            (element) => !element.hasAttribute('data-dialog-close'),
          );
          (preferred ?? panelRef.current)?.focus();
        },
        onCloseAutoFocus: (event) => event.preventDefault(),
        children: [
          _jsxs(DialogHeader, {
            className:
              'flex-row items-center gap-2 border-b px-4 py-2.5 text-left',
            children: [
              _jsxs('div', {
                className: 'min-w-0 flex-1',
                children: [
                  _jsx(DialogTitle, { children: title }),
                  subtitle &&
                    _jsx(DialogDescription, {
                      className: 'mt-0.5 text-xs',
                      children: subtitle,
                    }),
                ],
              }),
              allowFullscreen &&
                _jsx(Button, {
                  type: 'button',
                  variant: 'ghost',
                  size: 'icon-sm',
                  onClick: () => setFullscreen((value) => !value),
                  'aria-label': t(
                    fullscreen ? 'common.exitFullscreen' : 'common.fullscreen',
                  ),
                  'aria-pressed': fullscreen,
                  title: t(
                    fullscreen ? 'common.exitFullscreen' : 'common.fullscreen',
                  ),
                  children: fullscreen
                    ? _jsx(Minimize2Icon, {})
                    : _jsx(Maximize2Icon, {}),
                }),
              dismissible &&
                _jsx(DialogClose, {
                  asChild: true,
                  children: _jsx(Button, {
                    type: 'button',
                    variant: 'ghost',
                    size: 'icon-sm',
                    'aria-label': t('common.close'),
                    title: t('common.close'),
                    'data-dialog-close': true,
                    children: _jsx(XIcon, {}),
                  }),
                }),
            ],
          }),
          _jsx('div', {
            className: 'flex min-h-0 flex-1 flex-col overflow-y-auto p-4',
            'data-dialog-fullscreen': fullscreen ? '' : undefined,
            children: children,
          }),
        ],
      }),
    }),
  });
}
//# sourceMappingURL=DialogShell.js.map
