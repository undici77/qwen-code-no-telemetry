import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n';
import { useWebShellPortalRoot } from '../portalRoot';
import styles from './ToastHost.module.css';
export function ToastHost({ toasts, onDismiss, elevated = false }) {
  const portalRoot = useWebShellPortalRoot();
  if (toasts.length === 0) return null;
  const host = _jsx('div', {
    className: `${styles.host} ${elevated ? styles.hostElevated : ''}`,
    role: 'status',
    'aria-live': 'polite',
    'data-web-shell-toast-host': true,
    children: toasts.map((toast) =>
      _jsx(ToastItem, { toast: toast, onDismiss: onDismiss }, toast.id),
    ),
  });
  // While elevated the host must share the portal root's stacking context:
  // in shadow-DOM portal mode the fullscreen drawer surface is sealed inside
  // the portal host (z = --web-shell-portal-root-z-index), so a toast left in
  // the app tree paints beneath it for its whole auto-dismiss lifetime.
  if (elevated && portalRoot) return createPortal(host, portalRoot);
  return host;
}
function ToastItem({ toast, onDismiss }) {
  const { t } = useI18n();
  useEffect(() => {
    // Schedule against the deadline, not a fresh duration: toggling
    // `elevated` moves the host between the app tree and the portal root,
    // remounting this item, and a full new timer per remount would keep a
    // toast on screen indefinitely across repeated toggles.
    const delay = Math.max(0, toast.dismissAt - Date.now());
    const timer = window.setTimeout(() => onDismiss(toast.id), delay);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id, toast.dismissAt]);
  return _jsxs('div', {
    className: `${styles.toast} ${styles[toast.tone]}`,
    'data-web-shell-toast': true,
    'data-tone': toast.tone,
    children: [
      _jsx('div', { className: styles.message, children: toast.message }),
      _jsx('button', {
        type: 'button',
        className: styles.close,
        onClick: () => onDismiss(toast.id),
        'aria-label': t('toast.dismiss'),
        title: t('toast.dismissShort'),
        children: 'x',
      }),
    ],
  });
}
//# sourceMappingURL=ToastHost.js.map
