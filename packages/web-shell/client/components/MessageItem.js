import { jsx as _jsx } from "react/jsx-runtime";
import { memo, useContext } from 'react';
import { CompactModeContext } from '../App';
import { useI18n } from '../i18n';
import { ErrorBoundary } from './ErrorBoundary';
import { MessageTimestamp } from './MessageTimestamp';
import { UserMessage } from './messages/UserMessage';
import { AssistantMessage, ThinkingMessage, } from './messages/AssistantMessage';
import { SystemMessage } from './messages/SystemMessage';
import { ToolGroup } from './messages/ToolGroup';
import { PlanMessage } from './messages/PlanMessage';
import { BtwMessage } from './messages/BtwMessage';
import { UserShellMessage } from './messages/UserShellMessage';
import { InsightProgress } from './InsightProgress';
import { InsightReady } from './InsightReady';
export const MessageItem = memo(function MessageItem({ message, pendingApproval, onShowContextDetail, onImagePreview, workspaceCwd, isLatest = false, showRetryHint = false, onRetryClick, sendFailed = false, onRetrySend, onBranchSession, showAssistantActions = false, showAssistantBranch = false, isLocateFlashing = false, assistantTurnFooterInfo, generateContent, }) {
    const { t } = useI18n();
    const compactMode = useContext(CompactModeContext);
    const body = (() => {
        switch (message.role) {
            case 'user':
                return (_jsx(UserMessage, { content: message.content, images: message.images, inputAnnotations: message.inputAnnotations, isLocateFlashing: isLocateFlashing, sendFailed: sendFailed, onRetrySend: onRetrySend, onImagePreview: onImagePreview }));
            case 'assistant':
                return (_jsx(AssistantMessage, { content: message.content, isStreaming: message.isStreaming, timestamp: message.timestamp, onBranchSession: onBranchSession, showFooterActions: showAssistantActions, showBranchAction: showAssistantBranch, isLocateFlashing: isLocateFlashing, customFooterInfo: assistantTurnFooterInfo }));
            case 'thinking':
                return (_jsx(ThinkingMessage, { messageId: message.id, content: message.content, isStreaming: message.isStreaming, timestamp: message.timestamp, isLocateFlashing: isLocateFlashing, generateContent: generateContent }));
            case 'tool_group':
                return (_jsx(ToolGroup, { tools: message.tools, pendingApproval: pendingApproval, workspaceCwd: workspaceCwd, isLocateFlashing: isLocateFlashing }));
            case 'plan':
                return (_jsx(PlanMessage, { id: message.id, todos: message.todos, isLocateFlashing: isLocateFlashing }));
            case 'system':
                return (_jsx(SystemMessage, { content: message.content, variant: message.variant, source: message.source, data: message.data, onShowContextDetail: onShowContextDetail, isLatest: isLatest, showRetryHint: showRetryHint && message.retryable === true, onRetryClick: onRetryClick }));
            case 'user_shell':
                return (_jsx(UserShellMessage, { command: message.command, output: message.output }));
            case 'btw':
                return (_jsx(BtwMessage, { question: message.question, answer: message.answer, isPending: message.isPending }));
            case 'insight_progress':
                return (_jsx(InsightProgress, { progress: {
                        stage: message.stage,
                        progress: message.progress,
                        detail: message.detail,
                    } }));
            case 'insight_ready':
                return _jsx(InsightReady, { path: message.path });
            case 'insight_error':
                return (_jsx("div", { style: { color: 'var(--error-color, #e06c75)' }, children: message.error }));
            default:
                return null;
        }
    })();
    if (body === null)
        return null;
    // Isolate each message's render: a throw in Markdown/KaTeX/Mermaid/a tool
    // panel degrades to an inline notice rather than white-screening the whole
    // (embeddable) transcript. `resetKeys={[message]}` lets a streamed/edited/
    // retried update recover on its own; a stable broken message stays on the
    // fallback without looping.
    const safeBody = (_jsx(ErrorBoundary, { label: `message:${message.role}`, resetKeys: [message], fallback: _jsx(MessageRenderError, { align: message.role === 'user' ? 'end' : 'start' }), children: body }));
    // Re-enable text selection on every message row so users can long-press /
    // drag-select reply text. The blanket `html * { user-select: none }` in
    // standalone.css disables selection on UI chrome (native-app feel); this
    // attribute opts the message subtree back in, including descendants
    // (Markdown body, code blocks, tool panels, sub-messages).
    //
    // `display: contents` keeps this wrapper out of layout: several parents
    // (e.g. MessageTimestamp's chat row) are flex containers whose items used
    // to be the message body itself. A plain div here becomes the flex item
    // instead and shrinks to its content width, squeezing user chat bubbles
    // (whose max-width: 80% then resolves against the shrunken wrapper) so
    // even short messages wrap mid-word. The user-select re-enable rule
    // matches `[data-user-selectable] *`, so the boxless wrapper does not
    // affect it.
    const selectableSafeBody = (_jsx("div", { "data-user-selectable": "true", style: { display: 'contents' }, children: safeBody }));
    if (message.role === 'assistant') {
        if (showAssistantActions) {
            return selectableSafeBody;
        }
        return (_jsx(MessageTimestamp, { timestamp: message.timestamp, children: selectableSafeBody }));
    }
    // The cancellation marker is a right-aligned, full-width turn-terminal row;
    // a hover timestamp would overlap its text, so skip the MessageTimestamp
    // wrapper. The data-user-selectable div is still applied for consistency.
    if (message.role === 'system' && message.source === 'prompt_cancelled') {
        return selectableSafeBody;
    }
    return (_jsx(MessageTimestamp, { timestamp: message.timestamp, chatMode: message.role === 'user', toolGroupSpacing: message.role === 'tool_group' && compactMode, copyText: message.role === 'user' ? message.content : undefined, copyTitle: t('common.copy'), children: selectableSafeBody }));
}, areMessageItemPropsEqual);
// Aligns with the message it replaces: user messages are right-aligned bubbles,
// so the notice sits on the right too and still reads as that user turn's prompt
// (a left-aligned notice would look like it belongs to the previous turn's
// output). Assistant and other rows are left-aligned, matching their layout.
function MessageRenderError({ align }) {
    const { t } = useI18n();
    return (_jsx("div", { role: "alert", style: {
            display: 'flex',
            justifyContent: align === 'end' ? 'flex-end' : 'flex-start',
        }, children: _jsx("span", { style: {
                color: 'var(--error-color, #e06c75)',
                fontSize: '0.85em',
                opacity: 0.85,
            }, children: t('message.renderError') }) }));
}
function areMessageItemPropsEqual(prev, next) {
    if (prev.pendingApproval?.id !== next.pendingApproval?.id)
        return false;
    if (prev.onShowContextDetail !== next.onShowContextDetail)
        return false;
    if (prev.onImagePreview !== next.onImagePreview)
        return false;
    if (prev.workspaceCwd !== next.workspaceCwd)
        return false;
    if (prev.isLatest !== next.isLatest)
        return false;
    if (prev.showRetryHint !== next.showRetryHint)
        return false;
    if (prev.onRetryClick !== next.onRetryClick)
        return false;
    if (prev.sendFailed !== next.sendFailed)
        return false;
    if (prev.onRetrySend !== next.onRetrySend)
        return false;
    if (prev.onBranchSession !== next.onBranchSession)
        return false;
    if (prev.showAssistantActions !== next.showAssistantActions)
        return false;
    if (prev.showAssistantBranch !== next.showAssistantBranch)
        return false;
    if (prev.isLocateFlashing !== next.isLocateFlashing)
        return false;
    if (prev.generateContent !== next.generateContent)
        return false;
    if (!areAssistantTurnFooterInfosEqual(prev.assistantTurnFooterInfo, next.assistantTurnFooterInfo)) {
        return false;
    }
    return areMessagesEqual(prev.message, next.message);
}
function areAssistantTurnFooterInfosEqual(prev, next) {
    if (prev === next)
        return true;
    if (!prev || !next)
        return false;
    return (prev.turnId === next.turnId &&
        prev.message.id === next.message.id &&
        prev.message.content === next.message.content &&
        prev.message.isStreaming === next.message.isStreaming &&
        prev.message.timestamp === next.message.timestamp);
}
function areMessagesEqual(prev, next) {
    if (prev === next)
        return true;
    if (prev.id !== next.id || prev.role !== next.role)
        return false;
    if (prev.timestamp !== next.timestamp)
        return false;
    switch (prev.role) {
        case 'user':
            return (next.role === 'user' &&
                prev.content === next.content &&
                stableImagesEqual(prev.images, next.images));
        case 'assistant':
            return (next.role === 'assistant' &&
                prev.content === next.content &&
                prev.isStreaming === next.isStreaming);
        case 'thinking':
            return (next.role === 'thinking' &&
                prev.content === next.content &&
                prev.isStreaming === next.isStreaming);
        case 'system':
            return (next.role === 'system' &&
                prev.content === next.content &&
                prev.variant === next.variant &&
                prev.retryable === next.retryable &&
                prev.source === next.source &&
                prev.data === next.data);
        case 'user_shell':
            return (next.role === 'user_shell' &&
                prev.command === next.command &&
                prev.output === next.output &&
                prev.cwd === next.cwd);
        case 'btw':
            return (next.role === 'btw' &&
                prev.question === next.question &&
                prev.answer === next.answer &&
                prev.isPending === next.isPending);
        case 'insight_progress':
            return (next.role === 'insight_progress' &&
                prev.stage === next.stage &&
                prev.progress === next.progress &&
                prev.detail === next.detail);
        case 'insight_ready':
            return next.role === 'insight_ready' && prev.path === next.path;
        case 'insight_error':
            return next.role === 'insight_error' && prev.error === next.error;
        case 'plan':
            return next.role === 'plan' && areTodosEqual(prev.todos, next.todos);
        case 'tool_group':
            return (next.role === 'tool_group' &&
                prev.tools.length === next.tools.length &&
                prev.tools.every((tool, index) => areToolCallsEqual(tool, next.tools[index])));
        default:
            return false;
    }
}
function areTodosEqual(prev, next) {
    return (prev.length === next.length &&
        prev.every((todo, index) => {
            const other = next[index];
            return (other &&
                todo.id === other.id &&
                todo.content === other.content &&
                todo.status === other.status &&
                todo.priority === other.priority);
        }));
}
function areToolCallsEqual(prev, next) {
    if (!next)
        return false;
    return (prev.callId === next.callId &&
        prev.toolName === next.toolName &&
        prev.status === next.status &&
        prev.title === next.title &&
        prev.kind === next.kind &&
        prev.startTime === next.startTime &&
        prev.endTime === next.endTime &&
        prev.subContent === next.subContent &&
        stableJson(prev.args) === stableJson(next.args) &&
        stableJson(prev.rawOutput) === stableJson(next.rawOutput) &&
        stableJson(prev.locations) === stableJson(next.locations) &&
        stableJson(prev.content) === stableJson(next.content) &&
        areToolListsEqual(prev.subTools, next.subTools));
}
function areToolListsEqual(prev, next) {
    if (!prev && !next)
        return true;
    if (!prev || !next || prev.length !== next.length)
        return false;
    return prev.every((tool, index) => areToolCallsEqual(tool, next[index]));
}
const jsonCache = new WeakMap();
function stableImagesEqual(a, b) {
    if (a === b)
        return true;
    if (!a || !b || a.length !== b.length)
        return false;
    return a.every((img, i) => img.data === b[i].data && img.mimeType === b[i].mimeType);
}
function stableJson(value) {
    if (value === undefined)
        return '';
    if (value !== null && typeof value === 'object') {
        let cached = jsonCache.get(value);
        if (cached !== undefined)
            return cached;
        try {
            cached = JSON.stringify(value);
        }
        catch {
            cached = String(value);
        }
        jsonCache.set(value, cached);
        return cached;
    }
    try {
        return JSON.stringify(value);
    }
    catch {
        return String(value);
    }
}
//# sourceMappingURL=MessageItem.js.map