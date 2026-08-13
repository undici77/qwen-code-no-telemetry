import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useI18n } from '../i18n';
import styles from './Tips.module.css';
function pickTip(tips) {
    return tips[Math.floor(Math.random() * tips.length)] ?? '';
}
export function Tips() {
    const { t } = useI18n();
    const tips = useMemo(() => t('tips.items').split('|'), [t]);
    const tip = useMemo(() => pickTip(tips), [tips]);
    return (_jsxs("div", { className: styles.line, children: [_jsx("span", { className: styles.label, children: t('welcome.tipLabel') }), _jsx("span", { className: styles.text, children: tip })] }));
}
//# sourceMappingURL=Tips.js.map