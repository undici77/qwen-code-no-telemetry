import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';
import { useKeypress } from '../hooks/useKeypress.js';
export function ExternalAuthProgress({ title, message, detail, onCancel, }) {
    useKeypress((key) => {
        if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
            onCancel?.();
        }
    }, { isActive: Boolean(onCancel) });
    return (_jsxs(Box, { borderStyle: "single", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, children: title }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { children: message }), detail ? _jsx(Text, { color: theme.text.secondary, children: detail }) : null] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('Please wait while authentication completes...') }), onCancel ? (_jsx(Text, { color: theme.text.secondary, children: t('Esc to cancel') })) : null] })] }));
}
//# sourceMappingURL=ExternalAuthProgress.js.map