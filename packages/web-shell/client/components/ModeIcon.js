import { jsx as _jsx } from 'react/jsx-runtime';
import autoIconUrl from '../assets/icons/auto.svg';
import defaultIconUrl from '../assets/icons/default.svg';
import editIconUrl from '../assets/icons/edit.svg';
import planIconUrl from '../assets/icons/plan.svg';
import yoloIconUrl from '../assets/icons/yolo.svg';
import { cssUrlVar } from '../utils/cssUrlVar';
import styles from './ModeIcon.module.css';
const modeIconUrls = {
  auto: autoIconUrl,
  'auto-edit': editIconUrl,
  default: defaultIconUrl,
  plan: planIconUrl,
  yolo: yoloIconUrl,
};
export function ModeIcon({ mode }) {
  const iconUrl = modeIconUrls[mode];
  if (iconUrl) {
    return _jsx('span', {
      className: styles.icon,
      style: cssUrlVar('--mode-icon-url', iconUrl),
      'aria-hidden': 'true',
    });
  }
  return _jsx('svg', {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    children: _jsx('path', {
      d: 'M6 18c.7-2.7 2.2-4 4.5-4H12M7 6h10M7 10h7M17.5 14.5l2 2-2 2',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '1.8',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  });
}
//# sourceMappingURL=ModeIcon.js.map
