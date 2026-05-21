import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import { ArenaSessionStatus, createDebugLogger, } from '@qwen-code/qwen-code-core';
import { theme } from '../../semantic-colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { MessageType } from '../../types.js';
import { DescriptiveRadioButtonSelect } from '../shared/DescriptiveRadioButtonSelect.js';
const debugLogger = createDebugLogger('ARENA_STOP_DIALOG');
export function ArenaStopDialog({ config, addItem, closeArenaDialog, }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const pushMessage = useCallback((result) => {
        const item = {
            type: result.messageType === 'info' ? MessageType.INFO : MessageType.ERROR,
            text: result.content,
        };
        addItem(item, Date.now());
        try {
            const chatRecorder = config.getChatRecordingService();
            chatRecorder?.recordSlashCommand({
                phase: 'result',
                rawCommand: '/arena stop',
                outputHistoryItems: [{ ...item }],
            });
        }
        catch {
            // Best-effort recording
        }
    }, [addItem, config]);
    const onStop = useCallback(async (action) => {
        if (isProcessing)
            return;
        setIsProcessing(true);
        closeArenaDialog();
        const mgr = config.getArenaManager();
        if (!mgr) {
            pushMessage({
                messageType: 'error',
                content: 'No running Arena session found.',
            });
            return;
        }
        try {
            const sessionStatus = mgr.getSessionStatus();
            if (sessionStatus === ArenaSessionStatus.RUNNING ||
                sessionStatus === ArenaSessionStatus.INITIALIZING) {
                pushMessage({
                    messageType: 'info',
                    content: 'Stopping Arena agents…',
                });
                await mgr.cancel();
            }
            await mgr.waitForSettled();
            pushMessage({
                messageType: 'info',
                content: 'Cleaning up Arena resources…',
            });
            if (action === 'preserve') {
                await mgr.cleanupRuntime();
            }
            else {
                await mgr.cleanup();
            }
            config.setArenaManager(null);
            if (action === 'preserve') {
                pushMessage({
                    messageType: 'info',
                    content: 'Arena session stopped. Worktrees and session files were preserved. ' +
                        'Use /arena select --discard to manually clean up later.',
                });
            }
            else {
                pushMessage({
                    messageType: 'info',
                    content: 'Arena session stopped. All Arena resources (including Git worktrees) were cleaned up.',
                });
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            debugLogger.error('Failed to stop Arena session:', error);
            pushMessage({
                messageType: 'error',
                content: `Failed to stop Arena session: ${message}`,
            });
        }
    }, [isProcessing, closeArenaDialog, config, pushMessage]);
    const configPreserve = config.getAgentsSettings().arena?.preserveArtifacts ?? false;
    const items = useMemo(() => [
        {
            key: 'cleanup',
            value: 'cleanup',
            title: _jsx(Text, { children: "Stop and clean up" }),
            description: (_jsx(Text, { color: theme.text.secondary, children: "Remove all worktrees and session files" })),
        },
        {
            key: 'preserve',
            value: 'preserve',
            title: _jsx(Text, { children: "Stop and preserve artifacts" }),
            description: (_jsx(Text, { color: theme.text.secondary, children: "Keep worktrees and session files for later inspection" })),
        },
    ], []);
    const defaultIndex = configPreserve ? 1 : 0;
    useKeypress((key) => {
        if (key.name === 'escape') {
            closeArenaDialog();
        }
    }, { isActive: !isProcessing });
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, color: theme.text.primary, children: "Stop Arena Session" }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: "Choose what to do with Arena artifacts:" }) }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(DescriptiveRadioButtonSelect, { items: items, initialIndex: defaultIndex, onSelect: (action) => {
                        onStop(action);
                    }, isFocused: !isProcessing, showNumbers: false }) }), configPreserve && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, dimColor: true, children: "Default: preserve (agents.arena.preserveArtifacts is enabled)" }) })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: "Enter to confirm, Esc to cancel" }) })] }));
}
//# sourceMappingURL=ArenaStopDialog.js.map