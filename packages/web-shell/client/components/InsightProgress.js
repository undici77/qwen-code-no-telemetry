import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import styles from './InsightProgress.module.css';
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧'];
export function InsightProgress({ progress }) {
  const { stage, progress: percent, detail, isComplete, error } = progress;
  const [frame, setFrame] = useState(0);
  const width = 30;
  const completedWidth = Math.round((percent / 100) * width);
  const remainingWidth = width - completedWidth;
  const bar =
    '█'.repeat(Math.max(0, completedWidth)) +
    '░'.repeat(Math.max(0, remainingWidth));
  useEffect(() => {
    if (isComplete || error) return;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, 120);
    return () => clearInterval(id);
  }, [isComplete, error]);
  if (error) {
    return _jsxs('div', {
      className: `${styles.progress} ${styles.error}`,
      children: [
        _jsx('span', { className: styles.icon, children: '\u2715' }),
        _jsx('span', { className: styles.stage, children: stage }),
        _jsx('div', { className: styles.detail, children: error }),
      ],
    });
  }
  if (isComplete) {
    return _jsxs('div', {
      className: `${styles.progress} ${styles.done}`,
      children: [
        _jsx('span', { className: styles.icon, children: '\u2713' }),
        _jsx('span', { className: styles.stage, children: stage }),
      ],
    });
  }
  return _jsxs('div', {
    className: styles.progress,
    children: [
      _jsx('span', {
        className: styles.spinner,
        children: SPINNER_FRAMES[frame],
      }),
      _jsx('span', { className: styles.bar, children: bar }),
      _jsxs('span', {
        className: styles.stage,
        children: [stage, detail ? ` (${detail})` : ''],
      }),
    ],
  });
}
//# sourceMappingURL=InsightProgress.js.map
