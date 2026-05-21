import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { t } from '../../../../i18n/index.js';
import { useConfig } from '../../../contexts/ConfigContext.js';
import { MCPOAuthProvider, MCPOAuthTokenStorage, getErrorMessage, } from '@qwen-code/qwen-code-core';
import { appEvents, AppEvent } from '../../../../utils/events.js';
import { osc8Hyperlink, supportsHyperlinks, wrapForMultiplexer, } from '../../../utils/osc8.js';
const AUTO_BACK_DELAY_MS = 2000;
const COPY_FEEDBACK_MS = 2000;
/**
 * Copy a string to the user's clipboard using the OSC 52 terminal escape
 * sequence. Works through SSH and most web terminals (iTerm2, Windows
 * Terminal, xterm.js-based emulators) without spawning a subprocess.
 * Returns true if the sequence was written to a TTY; false otherwise.
 * A return of true does not guarantee the terminal accepted the write —
 * some terminals disable OSC 52 by default.
 */
function copyToClipboardViaOsc52(text) {
    const base64 = Buffer.from(text, 'utf8').toString('base64');
    const seq = wrapForMultiplexer(`\x1b]52;c;${base64}\x07`);
    const stream = process.stderr.isTTY
        ? process.stderr
        : process.stdout.isTTY
            ? process.stdout
            : null;
    if (!stream)
        return false;
    try {
        stream.write(seq);
        return true;
    }
    catch {
        return false;
    }
}
export const AuthenticateStep = ({ server, onBack, }) => {
    const config = useConfig();
    const [authState, setAuthState] = useState('idle');
    const [messages, setMessages] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [authUrl, setAuthUrl] = useState(null);
    const [copyState, setCopyState] = useState({ status: 'idle' });
    const isRunning = useRef(false);
    const runAuthentication = useCallback(async () => {
        if (!server || !config || isRunning.current)
            return;
        isRunning.current = true;
        setAuthState('authenticating');
        setMessages([]);
        setErrorMessage(null);
        try {
            setMessages([
                t("Starting OAuth authentication for MCP server '{{name}}'...", {
                    name: server.name,
                }),
            ]);
            let oauthConfig = server.config.oauth;
            if (!oauthConfig) {
                oauthConfig = { enabled: false };
            }
            const mcpServerUrl = server.config.httpUrl || server.config.url;
            const authProvider = new MCPOAuthProvider(new MCPOAuthTokenStorage());
            await authProvider.authenticate(server.name, oauthConfig, mcpServerUrl, appEvents);
            setMessages((prev) => [
                ...prev,
                t("Successfully authenticated and refreshed tools for '{{name}}'.", {
                    name: server.name,
                }),
            ]);
            // Trigger tool re-discovery to pick up authenticated server
            const toolRegistry = config.getToolRegistry();
            if (toolRegistry) {
                setMessages((prev) => [
                    ...prev,
                    t("Re-discovering tools from '{{name}}'...", {
                        name: server.name,
                    }),
                ]);
                await toolRegistry.discoverToolsForServer(server.name);
                // Show discovered tool count
                const discoveredTools = toolRegistry.getToolsByServer(server.name);
                setMessages((prev) => [
                    ...prev,
                    t("Discovered {{count}} tool(s) from '{{name}}'.", {
                        count: String(discoveredTools.length),
                        name: server.name,
                    }),
                ]);
            }
            // Update the client with the new tools
            const geminiClient = config.getGeminiClient();
            if (geminiClient) {
                await geminiClient.setTools();
            }
            setMessages((prev) => [
                ...prev,
                t('Authentication complete. Returning to server details...'),
            ]);
            setAuthState('success');
        }
        catch (error) {
            setErrorMessage(getErrorMessage(error));
            setAuthState('error');
        }
        finally {
            isRunning.current = false;
        }
    }, [server, config]);
    // Subscribe to OAuth events for the lifetime of this component. Keeping
    // the subscription tied to mount/unmount (rather than to runAuthentication's
    // async flow) ensures listeners are released immediately on unmount even if
    // the authentication promise is still pending.
    useEffect(() => {
        const displayListener = (message) => {
            const text = typeof message === 'string' ? message : t(message.key, message.params);
            setMessages((prev) => [...prev, text]);
        };
        const authUrlListener = (url) => {
            setAuthUrl(url);
        };
        appEvents.on(AppEvent.OauthDisplayMessage, displayListener);
        appEvents.on(AppEvent.OauthAuthUrl, authUrlListener);
        return () => {
            appEvents.removeListener(AppEvent.OauthDisplayMessage, displayListener);
            appEvents.removeListener(AppEvent.OauthAuthUrl, authUrlListener);
        };
    }, []);
    useEffect(() => {
        runAuthentication();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Auto-navigate back after authentication succeeds
    useEffect(() => {
        if (authState !== 'success')
            return;
        const timer = setTimeout(() => {
            onBack();
        }, AUTO_BACK_DELAY_MS);
        return () => clearTimeout(timer);
    }, [authState, onBack]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onBack();
            return;
        }
        if (key.name === 'c' &&
            !key.ctrl &&
            !key.meta &&
            !key.paste &&
            authUrl &&
            authState === 'authenticating') {
            const ok = copyToClipboardViaOsc52(authUrl);
            setCopyState({
                status: ok ? 'copied' : 'unsupported',
                nonce: Date.now(),
            });
        }
    }, { isActive: true });
    useEffect(() => {
        if (copyState.status === 'idle')
            return;
        const timer = setTimeout(() => setCopyState({ status: 'idle' }), COPY_FEEDBACK_MS);
        return () => clearTimeout(timer);
        // Depend on the nonce so repeated presses reset the timer.
    }, [copyState]);
    if (!server) {
        return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('No server selected') }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Box, { children: _jsxs(Text, { color: theme.text.secondary, children: [t('Server:'), " ", server.name] }) }), messages.length > 0 && (_jsx(Box, { flexDirection: "column", children: messages.map((msg, i) => (_jsx(Text, { color: theme.text.secondary, children: msg }, i))) })), authState === 'error' && errorMessage && (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: errorMessage }) })), authUrl && (_jsx(Box, { children: _jsx(Text, { color: theme.text.accent, children: supportsHyperlinks() ? osc8Hyperlink(authUrl) : authUrl }) })), _jsxs(Box, { flexDirection: "column", children: [authState === 'authenticating' && (_jsx(Text, { color: theme.text.secondary, children: t('Authenticating... Please complete the login in your browser.') })), authState === 'authenticating' && authUrl && (_jsx(Text, { bold: copyState.status === 'idle', color: copyState.status === 'copied'
                            ? theme.status.success
                            : copyState.status === 'unsupported'
                                ? theme.status.warning
                                : theme.text.accent, children: copyState.status === 'copied'
                            ? t('Copy request sent to your terminal. If paste is empty, copy the URL above manually.')
                            : copyState.status === 'unsupported'
                                ? t('Cannot write to terminal — copy the URL above manually.')
                                : t('Press c to copy the authorization URL to your clipboard.') })), authState === 'success' && (_jsx(Text, { color: theme.status.success, children: t('Authentication successful.') }))] })] }));
};
//# sourceMappingURL=AuthenticateStep.js.map