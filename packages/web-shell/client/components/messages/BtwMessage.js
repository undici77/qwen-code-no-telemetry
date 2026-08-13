import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { useI18n } from '../../i18n';
import { Markdown } from './Markdown';
import styles from './BtwMessage.module.css';
export const BtwMessage = memo(function BtwMessage({ question, answer, isPending, }) {
    const { t } = useI18n();
    return (_jsxs("div", { className: styles.message, children: [_jsxs("div", { className: styles.content, children: [_jsxs("div", { className: styles.question, children: [_jsx("span", { className: styles.prefix, children: "/btw " }), _jsx("span", { children: question })] }), _jsx("div", { className: styles.answer, children: isPending ? (_jsx("span", { className: styles.pending, children: t('btw.answering') })) : (_jsx(Markdown, { content: answer })) })] }), _jsx("div", { className: styles.shortcuts, children: isPending ? t('btw.shortcuts.pending') : t('btw.shortcuts.done') })] }));
});
//# sourceMappingURL=BtwMessage.js.map