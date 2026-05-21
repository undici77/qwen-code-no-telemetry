import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
export function AuthInProgress({ onTimeout, }) {
    const [timedOut, setTimedOut] = useState(false);
    useKeypress((key) => {
        if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
            onTimeout();
        }
    }, { isActive: true });
    useEffect(() => {
        const timer = setTimeout(() => {
            setTimedOut(true);
            onTimeout();
        }, 180000);
        return () => clearTimeout(timer);
    }, [onTimeout]);
    return (_jsx(Box, { borderStyle: "single", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: timedOut ? (_jsx(Text, { color: theme.status.error, children: t('Authentication timed out. Please try again.') })) : (_jsx(Box, { children: _jsxs(Text, { children: [_jsx(Spinner, { type: "dots" }), ' ', t('Waiting for auth... (Press ESC or CTRL+C to cancel)')] }) })) }));
}
//# sourceMappingURL=AuthInProgress.js.map