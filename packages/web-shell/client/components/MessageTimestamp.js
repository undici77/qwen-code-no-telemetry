import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from 'react/jsx-runtime';
import { useCallback, useState } from 'react';
import styles from './MessageTimestamp.module.css';
/**
 * Wraps a rendered history message and reveals its wall-clock time as a
 * CSS-only tooltip on hover.
 */
export function MessageTimestamp({
  timestamp,
  children,
  chatMode = false,
  toolGroupSpacing = false,
  copyText,
  copyTitle = 'Copy',
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (!copyText) return;
    void navigator.clipboard
      ?.writeText(copyText)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }, [copyText]);
  if (timestamp === undefined && !copyText && !toolGroupSpacing) {
    return _jsx(_Fragment, { children: children });
  }
  const copyButton = copyText
    ? _jsx('button', {
        type: 'button',
        className: styles.copyButton,
        title: copyTitle,
        'aria-label': copyTitle,
        onClick: handleCopy,
        children: copied ? _jsx(CheckIcon, {}) : _jsx(CopyIcon, {}),
      })
    : null;
  const rowClassName = chatMode
    ? styles.chatRow
    : toolGroupSpacing
      ? `${styles.row} ${styles.toolGroupSpacing}`
      : styles.row;
  if (timestamp === undefined) {
    return _jsxs('div', {
      className: rowClassName,
      children: [children, copyButton],
    });
  }
  return _jsxs('div', {
    className: rowClassName,
    children: [
      children,
      chatMode
        ? _jsxs('span', {
            className: styles.chatActions,
            children: [
              _jsx('span', {
                className: styles.chatTip,
                'aria-hidden': 'true',
                children: formatTimestamp(timestamp),
              }),
              copyButton,
            ],
          })
        : _jsx('span', {
            className: styles.tip,
            'aria-hidden': 'true',
            children: formatTimestamp(timestamp),
          }),
    ],
  });
}
function CopyIcon() {
  return _jsxs('svg', {
    viewBox: '0 0 16 16',
    'aria-hidden': 'true',
    children: [
      _jsx('path', {
        d: 'M5.2 4.4V3.2c0-.7.5-1.2 1.2-1.2h5.4c.7 0 1.2.5 1.2 1.2v5.4c0 .7-.5 1.2-1.2 1.2h-1.2',
        fill: 'none',
        stroke: 'currentColor',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: '1.3',
      }),
      _jsx('rect', {
        x: '3',
        y: '5.2',
        width: '7.8',
        height: '7.8',
        rx: '1.2',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.3',
      }),
    ],
  });
}
function CheckIcon() {
  return _jsx('svg', {
    viewBox: '0 0 16 16',
    'aria-hidden': 'true',
    children: _jsx('path', {
      d: 'm3.5 8.3 3 3L12.8 5',
      fill: 'none',
      stroke: 'currentColor',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '1.6',
    }),
  });
}
/**
 * Local-time clock, dropping the date only for same-day timestamps:
 * - same day → `HH:mm:ss`
 * - earlier  → `yyyy-MM-dd HH:mm:ss`
 *
 * Fixed order and zero-padded (unlike toLocaleString) so stacked timestamps
 * align. `now` is injectable so the branch logic is unit-testable without
 * depending on the wall clock.
 */
export function formatTimestamp(ts, now = new Date()) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  const hms = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return hms;
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hms}`;
}
//# sourceMappingURL=MessageTimestamp.js.map
