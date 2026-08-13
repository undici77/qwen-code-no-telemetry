import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { useI18n } from '../../i18n';
import styles from './UserShellMessage.module.css';
export const UserShellMessage = memo(function UserShellMessage({ command, output, }) {
    const { t } = useI18n();
    return (_jsxs("div", { className: styles.message, children: [_jsxs("div", { className: styles.header, children: [_jsx("span", { className: styles.status, children: "\u2713" }), _jsx("span", { className: styles.name, children: t('shell.command') }), command && _jsx("span", { className: styles.command, children: command })] }), output && _jsx("pre", { className: styles.output, children: output })] }));
});
//# sourceMappingURL=UserShellMessage.js.map