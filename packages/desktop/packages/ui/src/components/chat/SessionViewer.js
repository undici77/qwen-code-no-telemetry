import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { CHAT_LAYOUT, CHAT_CLASSES } from '../../lib/layout';
import { PlatformProvider } from '../../context';
import { TurnCard } from './TurnCard';
import { UserMessageBubble } from './UserMessageBubble';
import { SystemMessage } from './SystemMessage';
import { groupMessagesByTurn, storedToMessage, getAssistantTurnUiKey, } from './turn-utils';
/**
 * CraftAgentLogo - The Qwen Code "C" logo for branding
 */
function CraftAgentLogo({ className }) {
    return (_jsx("svg", { className: className, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("g", { transform: "translate(3.4502, 3)", fill: "currentColor", children: _jsx("path", { d: "M3.17890888,3.6 L3.17890888,0 L16,0 L16,3.6 L3.17890888,3.6 Z M9.642,7.2 L9.64218223,10.8 L0,10.8 L0,3.6 L16,3.6 L16,7.2 L9.642,7.2 Z M3.17890888,18 L3.178,14.4 L0,14.4 L0,10.8 L16,10.8 L16,18 L3.17890888,18 Z", fillRule: "nonzero" }) }) }));
}
/**
 * SessionViewer - Read-only session transcript viewer component
 */
export function SessionViewer({ session, mode = 'readonly', platformActions = {}, className, onTurnClick, onActivityClick, defaultExpanded = false, header, footer, sessionFolderPath, }) {
    // Convert StoredMessage[] to Message[] and group into turns
    const turns = useMemo(() => groupMessagesByTurn(session.messages.map(storedToMessage)), [session.messages]);
    // Track expanded turns (for controlled state)
    const [expandedTurns, setExpandedTurns] = useState(() => {
        // Default: all turns collapsed, can override with defaultExpanded prop
        if (defaultExpanded) {
            return new Set(turns
                .map((turn, index) => turn.type === 'assistant' ? getAssistantTurnUiKey(turn, index) : null)
                .filter((key) => !!key));
        }
        return new Set();
    });
    // Track expanded activity groups
    const [expandedActivityGroups, setExpandedActivityGroups] = useState(new Set());
    const handleExpandedChange = useCallback((turnId, expanded) => {
        setExpandedTurns(prev => {
            const next = new Set(prev);
            if (expanded) {
                next.add(turnId);
            }
            else {
                next.delete(turnId);
            }
            return next;
        });
    }, []);
    const handleExpandedActivityGroupsChange = useCallback((groups) => {
        setExpandedActivityGroups(groups);
    }, []);
    const handleOpenActivityDetails = useCallback((activity) => {
        if (onActivityClick) {
            onActivityClick(activity);
        }
        else if (platformActions.onOpenActivityDetails) {
            platformActions.onOpenActivityDetails(session.id, activity.id);
        }
    }, [onActivityClick, platformActions, session.id]);
    const handleOpenTurnDetails = useCallback((turnId) => {
        if (onTurnClick) {
            onTurnClick(turnId);
        }
        else if (platformActions.onOpenTurnDetails) {
            platformActions.onOpenTurnDetails(session.id, turnId);
        }
    }, [onTurnClick, platformActions, session.id]);
    return (_jsx(PlatformProvider, { actions: platformActions, children: _jsxs("div", { className: cn("flex flex-col h-full", className), children: [header && (_jsx("div", { className: "shrink-0 border-b", children: header })), _jsx("div", { className: "flex-1 min-h-0", style: {
                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 32px, black calc(100% - 32px), transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 32px, black calc(100% - 32px), transparent 100%)'
                    }, children: _jsx("div", { className: "h-full overflow-y-auto", children: _jsxs("div", { className: cn(CHAT_LAYOUT.maxWidth, "mx-auto", CHAT_LAYOUT.containerPadding, CHAT_LAYOUT.messageSpacing), children: [turns.map((turn, index) => {
                                    if (turn.type === 'user') {
                                        return (_jsx("div", { className: CHAT_LAYOUT.userMessagePadding, children: _jsx(UserMessageBubble, { content: turn.message.content, attachments: turn.message.attachments, textElements: turn.message.textElements, onUrlClick: platformActions.onOpenUrl, onFileClick: platformActions.onOpenFile }) }, turn.message.id));
                                    }
                                    if (turn.type === 'system') {
                                        const msgType = turn.message.role === 'error' ? 'error' :
                                            turn.message.role === 'warning' ? 'warning' :
                                                turn.message.role === 'info' ? 'info' : 'system';
                                        return (_jsx(SystemMessage, { content: turn.message.content, type: msgType }, turn.message.id));
                                    }
                                    if (turn.type === 'assistant') {
                                        const assistantUiKey = getAssistantTurnUiKey(turn, index);
                                        return (_jsx(TurnCard, { turnId: turn.turnId, activities: turn.activities, response: turn.response, intent: turn.intent, isStreaming: turn.isStreaming, isComplete: turn.isComplete, isExpanded: expandedTurns.has(assistantUiKey), onExpandedChange: (expanded) => handleExpandedChange(assistantUiKey, expanded), onOpenFile: platformActions.onOpenFile, onOpenUrl: platformActions.onOpenUrl, onPopOut: platformActions.onOpenMarkdownPreview, onOpenDetails: () => handleOpenTurnDetails(turn.turnId), onOpenActivityDetails: handleOpenActivityDetails, todos: turn.todos, expandedActivityGroups: expandedActivityGroups, onExpandedActivityGroupsChange: handleExpandedActivityGroupsChange, hasEditOrWriteActivities: turn.activities.some(a => a.toolName === 'Edit' || a.toolName === 'Write'), onOpenMultiFileDiff: platformActions.onOpenMultiFileDiff
                                                ? () => platformActions.onOpenMultiFileDiff(session.id, turn.turnId)
                                                : undefined, sessionFolderPath: sessionFolderPath, annotationInteractionMode: mode === 'readonly' ? 'tooltip-only' : 'interactive' }, assistantUiKey));
                                    }
                                    return null;
                                }), _jsx("div", { className: CHAT_CLASSES.brandingContainer, children: _jsx(CraftAgentLogo, { className: "w-8 h-8 text-[#9570BE]/40" }) })] }) }) }), footer && (_jsx("div", { className: "shrink-0 border-t", children: footer }))] }) }));
}
//# sourceMappingURL=SessionViewer.js.map