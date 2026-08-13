import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Link from 'ink-link';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
export function QwenOAuthProgress({ onTimeout, onCancel, deviceAuth, authStatus, authMessage, }) {
    const defaultTimeout = deviceAuth?.expires_in || 300; // Default 5 minutes
    const [timeRemaining, setTimeRemaining] = useState(defaultTimeout);
    const [dots, setDots] = useState('...');
    useKeypress((key) => {
        if (authStatus === 'timeout' || authStatus === 'error') {
            onCancel();
        }
        else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
            onCancel();
        }
    }, { isActive: true });
    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onTimeout]);
    // Animated dots — cycle through fixed-width patterns to avoid layout shift
    useEffect(() => {
        const dotFrames = ['.  ', '.. ', '...'];
        let frameIndex = 0;
        const dotsTimer = setInterval(() => {
            frameIndex = (frameIndex + 1) % dotFrames.length;
            setDots(dotFrames[frameIndex]);
        }, 500);
        return () => clearInterval(dotsTimer);
    }, []);
    // Handle timeout state
    if (authStatus === 'timeout') {
        return (_jsxs(Box, { borderStyle: "single", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, color: theme.status.error, children: t('Qwen OAuth Authentication Timeout') }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: authMessage ||
                            t('OAuth token expired (over {{seconds}} seconds). Please select authentication method again.', {
                                seconds: defaultTimeout.toString(),
                            }) }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Press any key to return to authentication type selection.') }) })] }));
    }
    if (authStatus === 'error') {
        return (_jsxs(Box, { borderStyle: "single", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, color: theme.status.error, children: t('Qwen OAuth Authentication Error') }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: authMessage ||
                            t('An error occurred during authentication. Please try again.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Press any key to return to authentication type selection.') }) })] }));
    }
    // Show loading state when no device auth is available yet
    if (!deviceAuth) {
        return (_jsxs(Box, { borderStyle: "single", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, children: t('Qwen OAuth Authentication') }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { children: t('Waiting for Qwen OAuth authentication...') }), _jsxs(Text, { children: [t('Time remaining:'), " ", formatTime(timeRemaining)] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Esc to cancel') }) })] }));
    }
    return (_jsxs(Box, { borderStyle: "single", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, children: t('Qwen OAuth Authentication') }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: t('Please visit this URL to authorize:') }) }), _jsx(Link, { url: deviceAuth.verification_uri_complete || '', fallback: false, children: _jsx(Text, { color: theme.text.link, bold: true, children: deviceAuth.verification_uri_complete }) }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { children: [t('Waiting for authorization'), dots] }), _jsxs(Text, { children: [t('Time remaining:'), " ", formatTime(timeRemaining)] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Esc to cancel') }) })] }));
}
//# sourceMappingURL=QwenOAuthProgress.js.map