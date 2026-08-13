import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import * as Sentry from '@sentry/electron/renderer';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
/**
 * Keeps chat input failures local to the composer area so the rest of the chat
 * page remains usable. This is intentionally narrower than the root Sentry
 * boundary because malformed drafts or future composer bugs should not blank the
 * entire app.
 */
export class InputErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error('[InputErrorBoundary] Composer crashed:', error);
        Sentry.captureException(error, {
            tags: { errorSource: 'chat-input' },
            extra: {
                sessionId: this.props.sessionId,
                componentStack: info.componentStack,
            },
        });
    }
    componentDidUpdate(prevProps) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }
    retry = () => {
        this.setState({ hasError: false });
    };
    clearDraftAndRetry = () => {
        this.props.onClearDraft?.();
        this.setState({ hasError: false });
    };
    render() {
        if (!this.state.hasError)
            return this.props.children;
        return (_jsx(InputErrorFallback, { onRetry: this.retry, onClearDraft: this.clearDraftAndRetry }));
    }
}
function InputErrorFallback({ onRetry, onClearDraft, }) {
    const { t } = useTranslation();
    return (_jsx("div", { className: "rounded-[12px] border border-destructive/20 bg-background px-4 py-4 shadow-minimal", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive", children: _jsx(AlertCircle, { className: "h-4 w-4" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium text-foreground", children: t('chat.inputFailedTitle') }), _jsx("p", { className: "mt-1 text-xs text-foreground/60", children: t('chat.inputFailedDescription') }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [_jsxs(Button, { type: "button", size: "sm", variant: "secondary", onClick: onRetry, children: [_jsx(RefreshCw, { className: "h-4 w-4" }), t('common.retry')] }), _jsxs(Button, { type: "button", size: "sm", variant: "outline", onClick: onClearDraft, children: [_jsx(Trash2, { className: "h-4 w-4" }), t('chat.clearDraft')] }), _jsx(Button, { type: "button", size: "sm", variant: "ghost", onClick: () => window.location.reload(), children: t('common.reload') })] })] })] }) }));
}
//# sourceMappingURL=InputErrorBoundary.js.map