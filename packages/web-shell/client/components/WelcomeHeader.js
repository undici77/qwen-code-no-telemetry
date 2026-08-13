import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n';
import styles from './WelcomeHeader.module.css';
export function WelcomeHeader(props) {
    void props;
    const { t } = useI18n();
    return (_jsxs("div", { className: styles.header, children: [_jsxs("div", { className: styles.titleRow, children: [_jsx("span", { children: t('welcome.titlePrefix') }), _jsx("span", { className: styles.title, children: "Qwen Code" })] }), _jsx("div", { className: styles.subtitle, children: t('welcome.prompt') })] }));
}
//# sourceMappingURL=WelcomeHeader.js.map