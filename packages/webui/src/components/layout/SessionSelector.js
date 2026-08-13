import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useState, useRef, useEffect } from 'react';
import { getTimeAgo, groupSessionsByDate, } from '../../utils/sessionGrouping.js';
import { SearchIcon } from '../icons/NavigationIcons.js';
/**
 * SessionSelector component
 *
 * Features:
 * - Sessions grouped by date (Today, Yesterday, This Week, Older)
 * - Search filtering
 * - Infinite scroll to load more sessions
 * - Click outside to close
 * - Active session highlighting
 *
 * @example
 * ```tsx
 * <SessionSelector
 *   visible={true}
 *   sessions={sessions}
 *   currentSessionId="abc123"
 *   searchQuery=""
 *   onSearchChange={(q) => setQuery(q)}
 *   onSelectSession={(id) => loadSession(id)}
 *   onClose={() => setVisible(false)}
 * />
 * ```
 */
export const SessionSelector = ({ visible, sessions, currentSessionId, searchQuery, onSearchChange, onSelectSession, onRenameSession, onDeleteSession, onClose, hasMore = false, isLoading = false, onLoadMore, }) => {
    const [renamingSessionId, setRenamingSessionId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [originalRenameValue, setOriginalRenameValue] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const renameInputRef = useRef(null);
    const isCancelingRenameRef = useRef(false);
    useEffect(() => {
        if (renamingSessionId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingSessionId]);
    const handleRenameSubmit = (sessionId) => {
        const trimmed = renameValue.trim();
        if (trimmed && trimmed !== originalRenameValue && onRenameSession) {
            onRenameSession(sessionId, trimmed);
        }
        setRenamingSessionId(null);
        setRenameValue('');
        setOriginalRenameValue('');
    };
    if (!visible) {
        return null;
    }
    const hasNoSessions = sessions.length === 0;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "session-selector-backdrop fixed top-0 left-0 right-0 bottom-0 z-[999] bg-transparent", onClick: onClose }), _jsxs("div", { className: "session-dropdown fixed bg-[var(--app-menu-background)] rounded-[var(--corner-radius-small)] w-[min(400px,calc(100vw-32px))] max-h-[min(500px,50vh)] flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.1)] z-[1000] outline-none text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)]", tabIndex: -1, style: {
                    top: '30px',
                    left: '10px',
                }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "session-search p-2 flex items-center gap-2", children: [_jsx(SearchIcon, { className: "session-search-icon w-4 h-4 opacity-50 flex-shrink-0 text-[var(--app-primary-foreground)]" }), _jsx("input", { type: "text", className: "session-search-input flex-1 bg-transparent border-none outline-none text-[var(--app-menu-foreground)] text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)] p-0 placeholder:text-[var(--app-input-placeholder-foreground)] placeholder:opacity-60", placeholder: "Search sessions\u2026", "aria-label": "Search sessions", value: searchQuery, onChange: (e) => onSearchChange(e.target.value) })] }), _jsxs("div", { className: "session-list-content overflow-y-auto flex-1 select-none p-2", onScroll: (e) => {
                            const el = e.currentTarget;
                            const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
                            if (distanceToBottom < 48 && hasMore && !isLoading) {
                                onLoadMore?.();
                            }
                        }, children: [hasNoSessions ? (_jsx("div", { className: "p-5 text-center text-[var(--app-secondary-foreground)]", style: {
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: 'var(--app-secondary-foreground)',
                                }, children: searchQuery ? 'No matching sessions' : 'No sessions available' })) : (groupSessionsByDate(sessions).map((group) => (_jsxs(Fragment, { children: [_jsx("div", { className: "session-group-label p-1 px-2 text-[var(--app-primary-foreground)] opacity-50 text-[0.9em] font-medium [&:not(:first-child)]:mt-2", children: group.label }), _jsx("div", { className: "session-group flex flex-col gap-[2px]", children: group.sessions.map((session) => {
                                            const sessionId = session.id ||
                                                session.sessionId ||
                                                '';
                                            const title = session.title ||
                                                session.name ||
                                                'Untitled';
                                            const lastUpdated = session.lastUpdated ||
                                                session.startTime ||
                                                '';
                                            const isActive = sessionId === currentSessionId;
                                            if (renamingSessionId === sessionId) {
                                                return (_jsx("div", { className: "session-item flex items-center py-1.5 px-2 rounded-md", children: _jsx("input", { ref: renameInputRef, type: "text", maxLength: 200, className: "flex-1 bg-[var(--vscode-input-background,var(--app-input-background))] text-[var(--vscode-input-foreground,var(--app-primary-foreground))] border-2 border-[var(--vscode-focusBorder)] rounded px-2 py-1 text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)] outline-none min-w-0 shadow-[0_0_0_1px_var(--vscode-focusBorder)]", value: renameValue, onChange: (e) => setRenameValue(e.target.value), onKeyDown: (e) => {
                                                            if (e.key === 'Enter') {
                                                                handleRenameSubmit(sessionId);
                                                            }
                                                            else if (e.key === 'Escape') {
                                                                isCancelingRenameRef.current = true;
                                                                setRenamingSessionId(null);
                                                                setRenameValue('');
                                                                setOriginalRenameValue('');
                                                            }
                                                        }, onBlur: () => {
                                                            if (isCancelingRenameRef.current) {
                                                                isCancelingRenameRef.current = false;
                                                                return;
                                                            }
                                                            handleRenameSubmit(sessionId);
                                                        } }) }, sessionId));
                                            }
                                            return (_jsxs("div", { className: `session-item group flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-100 hover:bg-[var(--app-list-hover-background)] ${isActive
                                                    ? 'active bg-[var(--app-list-active-background)] text-[var(--app-list-active-foreground)] font-[600]'
                                                    : 'text-[var(--app-primary-foreground)]'}`, onClick: () => {
                                                    onSelectSession(sessionId);
                                                    onClose();
                                                }, children: [_jsx("span", { className: "session-item-title flex-1 overflow-hidden text-ellipsis whitespace-nowrap min-w-0 text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)]", children: title }), _jsxs("span", { className: "flex items-center gap-1 flex-shrink-0 ml-2", children: [(onRenameSession || onDeleteSession) && (_jsxs("span", { className: `items-center gap-0.5 ${confirmDeleteId === sessionId ? 'flex' : 'hidden group-hover:flex'}`, children: [onRenameSession && (_jsx("button", { type: "button", className: "p-0.5 bg-transparent border-none cursor-pointer opacity-50 hover:opacity-100 text-[var(--app-primary-foreground)] rounded", title: "Rename", onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            setRenamingSessionId(sessionId);
                                                                            setRenameValue(title);
                                                                            setOriginalRenameValue(title);
                                                                        }, children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "currentColor", children: _jsx("path", { d: "M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3 1.45 1.45-2.96 1.55zm3.83-2.06L4.47 9.76l8-8 1.77 1.77-8 8z" }) }) })), onDeleteSession &&
                                                                        !isActive &&
                                                                        (confirmDeleteId === sessionId ? (_jsx("button", { type: "button", className: "px-1.5 py-0.5 bg-[var(--vscode-inputValidation-errorBackground,#5a1d1d)] border border-[var(--vscode-inputValidation-errorBorder,#be1100)] cursor-pointer text-[var(--vscode-errorForeground,#f48771)] rounded text-[11px] leading-tight", title: "Click to confirm delete", onClick: (e) => {
                                                                                e.stopPropagation();
                                                                                setConfirmDeleteId(null);
                                                                                onDeleteSession(sessionId);
                                                                            }, onBlur: () => setConfirmDeleteId(null), children: "Delete?" })) : (_jsx("button", { type: "button", className: "p-0.5 bg-transparent border-none cursor-pointer opacity-50 hover:opacity-100 text-[var(--app-primary-foreground)] rounded", title: "Delete", onClick: (e) => {
                                                                                e.stopPropagation();
                                                                                setConfirmDeleteId(sessionId);
                                                                            }, children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "currentColor", children: _jsx("path", { d: "M10 3h3v1h-1v9l-1 1H5l-1-1V4H3V3h3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1zM9 2H7v1h2V2zM5 4v9h6V4H5zm2 2h1v5H7V6zm3 0h-1v5h1V6z" }) }) })))] })), _jsx("span", { className: "session-item-time opacity-60 text-[0.9em]", children: getTimeAgo(lastUpdated) })] })] }, sessionId));
                                        }) })] }, group.label)))), hasMore && (_jsx("div", { className: "p-2 text-center opacity-60 text-[0.9em]", children: isLoading ? 'Loading…' : '' }))] })] })] }));
};
//# sourceMappingURL=SessionSelector.js.map