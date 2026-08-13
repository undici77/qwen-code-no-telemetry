import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { useKeypress } from '../hooks/useKeypress.js';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';
const EXIT_INDEX = 0;
const CONTINUE_INDEX = 1;
export const SettingsCorruptedDialog = ({ corruptedPath, wasRecovered, onExit, onContinue }) => {
    const [selectedIndex, setSelectedIndex] = useState(EXIT_INDEX);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onContinue();
            return;
        }
        if (key.ctrl && key.name === 'c') {
            onExit();
            return;
        }
        if (key.name === 'up') {
            setSelectedIndex(EXIT_INDEX);
        }
        if (key.name === 'down') {
            setSelectedIndex(CONTINUE_INDEX);
        }
        if (key.name === 'return') {
            if (selectedIndex === EXIT_INDEX) {
                onExit();
            }
            else {
                onContinue();
            }
        }
    }, { isActive: true });
    const continueLabel = wasRecovered
        ? t('Continue with recovered settings (esc)')
        : t('Continue with empty settings (esc)');
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.status.error, padding: 1, width: "100%", marginLeft: 1, children: [_jsxs(Box, { marginBottom: 1, flexDirection: "column", children: [_jsxs(Text, { children: [_jsx(Text, { color: theme.status.error, children: '> ' }), _jsx(Text, { bold: true, color: theme.status.error, children: t('Settings file corrupted') })] }), _jsx(Text, { color: theme.text.secondary, children: t('Your settings file had invalid JSON. A copy of the corrupted file has been saved for reference.') }), _jsx(Text, { color: theme.text.secondary, children: corruptedPath })] }), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { children: selectedIndex === EXIT_INDEX ? (_jsx(Text, { color: theme.status.success, children: '> ' })) : ('  ') }), _jsx(Text, { color: selectedIndex === EXIT_INDEX
                                    ? theme.status.success
                                    : theme.text.primary, children: t('Exit and restore corrupted file') })] }), _jsxs(Box, { children: [_jsx(Text, { children: selectedIndex === CONTINUE_INDEX ? (_jsx(Text, { color: theme.status.success, children: '> ' })) : ('  ') }), _jsx(Text, { color: selectedIndex === CONTINUE_INDEX
                                    ? theme.status.success
                                    : theme.text.primary, children: continueLabel })] })] })] }));
};
//# sourceMappingURL=SettingsCorruptedDialog.js.map