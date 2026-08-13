import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './InsightProgress.module.css';
import { useI18n } from '../i18n';
export function InsightReady({ path }) {
    const { t } = useI18n();
    return (_jsxs("div", { className: `${styles.progress} ${styles.done}`, children: [_jsx("span", { className: styles.icon, children: "\u2713" }), _jsx("span", { className: styles.stage, children: t('insight.ready') }), _jsx("span", { className: styles.path, children: path })] }));
}
//# sourceMappingURL=InsightReady.js.map