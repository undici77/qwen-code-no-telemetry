import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '../../i18n';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, } from '../ui/dropdown-menu';
import styles from './WebShellSidebar.module.css';
const COLLISION_PADDING = 8;
export function SessionDetailsSubmenu({ session, label, completedUnread, onError, getCollisionBoundary, }) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const copyAttemptRef = useRef(0);
    const currentSessionIdRef = useRef(session.sessionId);
    currentSessionIdRef.current = session.sessionId;
    const collisionBoundary = open ? getCollisionBoundary() : null;
    useEffect(() => {
        setCopied(false);
    }, [session.sessionId]);
    useEffect(() => () => {
        copyAttemptRef.current += 1;
    }, []);
    const handleOpenChange = useCallback((nextOpen) => {
        if (!nextOpen) {
            copyAttemptRef.current += 1;
        }
        setCopied(false);
        setOpen(nextOpen);
    }, []);
    const copySessionId = useCallback(async () => {
        const sessionId = session.sessionId;
        const copyAttempt = ++copyAttemptRef.current;
        try {
            if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
                throw new Error('Clipboard API is unavailable');
            }
            await navigator.clipboard.writeText(sessionId);
            if (copyAttemptRef.current !== copyAttempt ||
                currentSessionIdRef.current !== sessionId) {
                return;
            }
            setCopied(true);
        }
        catch (error) {
            if (copyAttemptRef.current !== copyAttempt ||
                currentSessionIdRef.current !== sessionId) {
                return;
            }
            setCopied(false);
            onError(error, t('sidebar.copySessionIdFailed'));
        }
    }, [onError, session.sessionId, t]);
    return (_jsxs(DropdownMenuSub, { open: open, onOpenChange: handleOpenChange, children: [_jsxs(DropdownMenuSubTrigger, { children: [_jsx(InfoIcon, {}), t('sidebar.details')] }), _jsx(DropdownMenuSubContent, { avoidCollisions: true, collisionBoundary: collisionBoundary ?? undefined, collisionPadding: COLLISION_PADDING, 
                // Radix's optimized strategy does not observe the non-portal WebShell root.
                updatePositionStrategy: "always", className: cn(styles.sessionDetailsContent, 'min-w-0 p-3'), children: _jsxs("div", { className: styles.tooltipContent, children: [_jsx("div", { className: styles.tooltipTitle, title: label, children: label }), _jsxs("div", { className: styles.tooltipTags, children: [session.hasActivePrompt && (_jsx("span", { className: `${styles.tooltipTag} ${styles.tooltipTagRunning}`, children: t('sidebar.running') })), completedUnread && (_jsx("span", { className: `${styles.tooltipTag} ${styles.tooltipTagNew}`, children: t('sidebar.completedUnread') })), _jsx("span", { className: styles.tooltipTag, children: t('sidebar.clients', { count: session.clientCount ?? 0 }) })] }), _jsxs("div", { className: styles.sessionDetailsIdRow, children: [_jsx("span", { className: styles.sessionDetailsId, title: session.sessionId, children: session.sessionId }), _jsx(DropdownMenuItem, { className: cn(styles.sessionDetailsCopyButton, 'cursor-pointer'), "aria-label": t('sidebar.copySessionId'), title: t('sidebar.copySessionId'), onSelect: (event) => {
                                        event.preventDefault();
                                        void copySessionId();
                                    }, children: copied ? (_jsx(CheckIcon, { "aria-hidden": "true" })) : (_jsx(CopyIcon, { "aria-hidden": "true" })) })] }), _jsx("span", { className: styles.sessionDetailsCopied, role: "status", "aria-live": "polite", children: copied ? t('sidebar.sessionIdCopied') : '' })] }) })] }));
}
//# sourceMappingURL=SessionDetailsSubmenu.js.map