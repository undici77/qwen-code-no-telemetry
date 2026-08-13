import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * UserMessageBubble - Shared user message component
 *
 * Displays user messages with right-aligned styling:
 * - Subtle background (5% foreground)
 * - Pill-shaped corners
 * - Max width 80%
 * - Markdown rendering for links and code
 * - Optional file attachments with thumbnails
 * - Content badges for @mentions (sources, skills)
 * - Pending/queued states (Electron only)
 */
import * as React from 'react';
import { normalizePath, textElementsToContentBadges } from '@craft-agent/core/utils';
import { Check, Copy, Pencil, SendHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Markdown } from '../markdown';
import { FileTypeIcon, getFileTypeLabel } from './attachment-helpers';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../tooltip';
import { useTranslation } from 'react-i18next';
// Fallback text icons for badges without iconDataUrl
// Using simple characters since SVG rendering may not work in all contexts
const SKILL_ICON_TEXT = '◆';
const SOURCE_ICON_TEXT = '⊕';
const CONTEXT_ICON_TEXT = '⚙';
const COMMAND_ICON_TEXT = '/';
function formatMessageTime(timestamp) {
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp))
        return null;
    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(timestamp));
}
function MessageActionButton({ label, onClick, disabled, children, }) {
    const button = (_jsx("button", { type: "button", "aria-label": label, title: label, disabled: disabled, onMouseDown: (event) => event.preventDefault(), onClick: onClick, className: cn('inline-flex size-6 items-center justify-center rounded-[5px] text-muted-foreground transition-colors', 'hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', disabled && 'pointer-events-none opacity-40'), children: children }));
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: button }), _jsx(TooltipContent, { side: "top", children: label })] }));
}
/**
 * Check if a badge is an edit_request badge (identified by XML tag in rawText)
 */
function isEditRequestBadge(badge) {
    return badge.type === 'context' && !!badge.rawText?.includes('<edit_request>');
}
/**
 * EditRequestBadge - Standalone badge rendered above the user message bubble
 * Taller and with larger corner radius than inline badges for visual distinction
 */
function EditRequestBadge({ badge }) {
    const displayLabel = badge.collapsedLabel || badge.label;
    return (_jsx("span", { className: "inline-flex items-center h-[28px] px-2.5 rounded-[8px] bg-background shadow-minimal text-[13px] text-muted-foreground", children: displayLabel }));
}
/**
 * InlineBadge - Renders a single content badge inline with text
 * Styled to match the input field badges (bg-background with shadow)
 */
function InlineBadge({ badge }) {
    return (_jsxs("span", { className: "inline-flex items-center gap-1 h-[22px] px-1.5 mx-0.5 rounded-[5px] bg-background shadow-minimal text-[12px] align-middle", style: { verticalAlign: 'middle', transform: 'translateY(-1px)' }, children: [badge.iconDataUrl ? (_jsx("img", { src: badge.iconDataUrl, alt: "", className: "h-[12px] w-[12px] rounded-[2px] shrink-0" })) : (_jsx("span", { className: "h-[12px] w-[12px] rounded-[2px] bg-foreground/5 flex items-center justify-center text-foreground/50 shrink-0 text-[8px]", children: badge.type === 'skill' ? SKILL_ICON_TEXT : badge.type === 'context' ? CONTEXT_ICON_TEXT : SOURCE_ICON_TEXT })), _jsx("span", { className: "truncate max-w-[200px]", children: badge.label })] }));
}
/**
 * CommandBadge - Renders a slash command badge inline with text
 * Styled similarly to InlineBadge but indicates a SDK command (e.g., /compact)
 */
function CommandBadge({ badge }) {
    const displayLabel = badge.label.replace(/^\/+/, '');
    return (_jsxs("span", { className: "inline-flex items-center gap-1 h-[22px] px-1.5 mx-0.5 rounded-[5px] bg-background shadow-minimal text-[12px] align-middle", style: { verticalAlign: 'middle', transform: 'translateY(-1px)' }, children: [_jsx("span", { className: "h-[12px] w-[12px] rounded-[2px] bg-foreground/5 flex items-center justify-center text-foreground/50 shrink-0 text-[10px] font-medium", children: COMMAND_ICON_TEXT }), _jsx("span", { className: "truncate max-w-[200px]", children: displayLabel })] }));
}
/**
 * ContextBadge - Renders a context badge that collapses hidden content
 * Shows collapsed label and hides the raw content from display
 * Note: edit_request badges are handled separately by EditRequestBadge
 */
function ContextBadge({ badge }) {
    const { t } = useTranslation();
    const displayLabel = badge.collapsedLabel || badge.label;
    return (_jsxs("span", { className: "inline-flex items-center gap-1 h-[22px] px-1.5 mr-1 rounded-[5px] bg-background shadow-minimal text-[12px] align-middle", style: { verticalAlign: 'middle', transform: 'translateY(-1px)' }, title: t('chat.contextBadge'), children: [_jsx("span", { className: "h-[12px] w-[12px] rounded-[2px] bg-foreground/5 flex items-center justify-center text-foreground/50 shrink-0 text-[8px]", children: CONTEXT_ICON_TEXT }), _jsx("span", { className: "truncate max-w-[200px] text-muted-foreground", children: displayLabel })] }));
}
/** Known code file extensions for picking the code file icon */
const CODE_EXTENSIONS = new Set([
    'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
    'py', 'rs', 'go', 'java', 'rb', 'swift', 'kt',
    'c', 'cpp', 'h', 'hpp', 'cs',
    'css', 'scss', 'less', 'html', 'vue', 'svelte',
    'json', 'yaml', 'yml', 'toml', 'xml',
    'sh', 'bash', 'zsh', 'fish',
    'md', 'mdx',
    'sql', 'graphql', 'proto',
]);
/** Returns the appropriate file/folder SVG icon based on badge type and file extension */
function FileBadgeIcon({ badge }) {
    if (badge.type === 'folder') {
        return (_jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round", className: "shrink-0 text-muted-foreground", children: _jsx("path", { d: "M20.5 10C20.5 9.07003 20.5 8.60504 20.3978 8.22354C20.1204 7.18827 19.3117 6.37962 18.2765 6.10222C17.895 6 17.43 6 16.5 6H13.1008C12.4742 6 12.1609 6 11.8739 5.91181C11.6824 5.85298 11.5009 5.76572 11.3353 5.65295C11.0871 5.48389 10.8914 5.23926 10.5 4.75L10.4095 4.63693C10.107 4.25881 9.9558 4.06975 9.7736 3.92674C9.54464 3.74703 9.27921 3.61946 8.99585 3.55294C8.77037 3.5 8.52825 3.5 8.04402 3.5C6.60485 3.5 5.88527 3.5 5.32008 3.74178C4.61056 4.0453 4.0453 4.61056 3.74178 5.32008C3.5 5.88527 3.5 6.60485 3.5 8.04402V10M9.46502 20.5H14.535C16.9102 20.5 18.0978 20.5 18.9301 19.8113C19.7624 19.1226 19.9846 17.9559 20.429 15.6227L20.8217 13.5613C21.1358 11.9121 21.2929 11.0874 20.843 10.5437C20.393 10 19.5536 10 17.8746 10H6.12537C4.44643 10 3.60696 10 3.15704 10.5437C2.70713 11.0874 2.8642 11.9121 3.17835 13.5613L3.57099 15.6227C4.01541 17.9559 4.23763 19.1226 5.06992 19.8113C5.90221 20.5 7.08981 20.5 9.46502 20.5Z" }) }));
    }
    // Check if it's a code file
    const ext = badge.label.split('.').pop()?.toLowerCase();
    const isCode = ext ? CODE_EXTENSIONS.has(ext) : false;
    if (isCode) {
        // Code file icon (document with < > brackets)
        return (_jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className: "shrink-0 text-muted-foreground", children: _jsx("path", { d: "M10.5 2.5C12.1569 2.5 13.5 3.84315 13.5 5.5V6.1C13.5 6.4716 13.5 6.6574 13.5246 6.81287C13.6602 7.66865 14.3313 8.33983 15.1871 8.47538C15.3426 8.5 15.5284 8.5 15.9 8.5H16.5C18.1569 8.5 19.5 9.84315 19.5 11.5M10.5 12.8799C9.70024 13.2985 9.10807 13.8275 8.64232 14.5478C8.51063 14.7515 8.44479 14.8533 8.44489 15.0011C8.44498 15.1488 8.51099 15.2506 8.643 15.4542C9.1095 16.1736 9.70167 16.7028 10.5 17.1225M13.5 12.8799C14.2998 13.2985 14.8919 13.8275 15.3577 14.5478C15.4894 14.7515 15.5552 14.8533 15.5551 15.0011C15.555 15.1488 15.489 15.2506 15.357 15.4542C14.8905 16.1736 14.2983 16.7028 13.5 17.1225M10.9645 2.5H10.6678C8.64635 2.5 7.63561 2.5 6.84835 2.85692C5.96507 3.25736 5.25736 3.96507 4.85692 4.84835C4.5 5.63561 4.5 6.64635 4.5 8.66781V14C4.5 17.2875 4.5 18.9312 5.40796 20.0376C5.57418 20.2401 5.75989 20.4258 5.96243 20.592C7.06878 21.5 8.71252 21.5 12 21.5C15.2875 21.5 16.9312 21.5 18.0376 20.592C18.2401 20.4258 18.4258 20.2401 18.592 20.0376C19.5 18.9312 19.5 17.2875 19.5 14V11.0355C19.5 10.0027 19.5 9.48628 19.4176 8.99414C19.2671 8.09576 18.9141 7.24342 18.3852 6.50177C18.0955 6.09549 17.7303 5.73032 17 5C16.2697 4.26968 15.9045 3.90451 15.4982 3.6148C14.7566 3.08595 13.9042 2.7329 13.0059 2.58243C12.5137 2.5 11.9973 2.5 10.9645 2.5Z" }) }));
    }
    // Generic file icon (document with folded corner)
    return (_jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className: "shrink-0 text-muted-foreground", children: _jsx("path", { d: "M10.5 2.5C12.1569 2.5 13.5 3.84315 13.5 5.5V6.1C13.5 6.4716 13.5 6.6574 13.5246 6.81287C13.6602 7.66865 14.3313 8.33983 15.1871 8.47538C15.3426 8.5 15.5284 8.5 15.9 8.5H16.5C18.1569 8.5 19.5 9.84315 19.5 11.5M9 16H15M9 12H10M10.9645 2.5H10.6678C8.64635 2.5 7.63561 2.5 6.84835 2.85692C5.96507 3.25736 5.25736 3.96507 4.85692 4.84835C4.5 5.63561 4.5 6.64635 4.5 8.66781V14C4.5 17.2875 4.5 18.9312 5.40796 20.0376C5.57418 20.2401 5.75989 20.4258 5.96243 20.592C7.06878 21.5 8.71252 21.5 12 21.5C15.2875 21.5 16.9312 21.5 18.0376 20.592C18.2401 20.4258 18.4258 20.2401 18.592 20.0376C19.5 18.9312 19.5 17.2875 19.5 14V11.0355C19.5 10.0027 19.5 9.48628 19.4176 8.99414C19.2671 8.09576 18.9141 7.24342 18.3852 6.50177C18.0955 6.09549 17.7303 5.73032 17 5C16.2697 4.26968 15.9045 3.90451 15.4982 3.6148C14.7566 3.08595 13.9042 2.7329 13.0059 2.58243C12.5137 2.5 11.9973 2.5 10.9645 2.5Z" }) }));
}
/**
 * InlineFileBadge - File/folder badge for inline display within text.
 * Shows proper icon (folder, code file, or generic file) with Tooltip for full path.
 * Optionally clickable when onFileClick is provided.
 */
function InlineFileBadge({ badge, onFileClick }) {
    // Strip .craft-agent workspace/session path prefix for cleaner tooltip display
    // e.g. "/Users/.../workspaces/{id}/sessions/{id}/plans/foo.md" → "plans/foo.md"
    const rawPath = badge.filePath || badge.label;
    const tooltipPath = normalizePath(rawPath).replace(/^.*\.craft-agent\/workspaces\/[^/]+\/(sessions\/[^/]+\/)?/, '');
    const isClickable = !!badge.filePath && !!onFileClick;
    const badgeContent = (_jsxs("span", { role: isClickable ? 'button' : undefined, onClick: () => isClickable && onFileClick(badge.filePath), className: cn("inline-flex items-center gap-1 h-[22px] px-1.5 mx-0.5 rounded-[5px] bg-background shadow-minimal text-[12px] align-middle", isClickable && "hover:bg-foreground/5 transition-colors cursor-pointer"), style: { verticalAlign: 'middle', transform: 'translateY(-1px)' }, children: [_jsx(FileBadgeIcon, { badge: badge }), _jsx("span", { className: "truncate max-w-[200px]", children: badge.label })] }));
    // Wrap with Tooltip to show full path on hover
    return (_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: badgeContent }), _jsx(TooltipContent, { side: "top", children: tooltipPath })] }) }));
}
/**
 * Render content with badges inserted at their positions.
 * Text segments between badges are rendered as Markdown.
 *
 * Context badges (type='context') are special:
 * - They completely hide the marked content range
 * - They show a collapsed badge with the collapsedLabel
 * - Used for EditPopover metadata that shouldn't be visible to users
 *
 * File badges (type='file') render inline as clickable badges:
 * - Used for plan execution messages where file path appears inline with text
 */
function renderContentWithBadges(content, badges, onUrlClick, onFileClick) {
    if (badges.length === 0) {
        return (_jsx(Markdown, { mode: "minimal", onUrlClick: onUrlClick, onFileClick: onFileClick, className: "text-sm [&_a]:underline [&_code]:bg-foreground/10 [&_p]:whitespace-pre-wrap", children: content }));
    }
    // Sort badges by start position
    const sortedBadges = [...badges].sort((a, b) => a.start - b.start);
    const elements = [];
    let lastEnd = 0;
    sortedBadges.forEach((badge, i) => {
        // Add text before this badge
        if (badge.start > lastEnd) {
            const textBefore = content.slice(lastEnd, badge.start);
            if (textBefore.trim()) {
                elements.push(_jsx(Markdown, { mode: "minimal", onUrlClick: onUrlClick, onFileClick: onFileClick, className: "inline text-sm [&_a]:underline [&_code]:bg-foreground/10 [&_p]:whitespace-pre-wrap [&_p]:inline", children: textBefore }, `text-${i}`));
            }
        }
        // Context badges hide content and show collapsed label
        // Command badges show SDK commands like /compact
        // File badges show clickable file references inline
        // Source/skill badges show inline with the original text
        // Note: edit_request badges are filtered out and rendered above the bubble separately
        if (badge.type === 'context') {
            elements.push(_jsx(ContextBadge, { badge: badge }, `badge-${i}`));
        }
        else if (badge.type === 'command') {
            elements.push(_jsx(CommandBadge, { badge: badge }, `badge-${i}`));
        }
        else if (badge.type === 'file' || badge.type === 'folder') {
            elements.push(_jsx(InlineFileBadge, { badge: badge, onFileClick: onFileClick }, `badge-${i}`));
        }
        else {
            elements.push(_jsx(InlineBadge, { badge: badge }, `badge-${i}`));
        }
        lastEnd = badge.end;
    });
    // Add remaining text after last badge
    if (lastEnd < content.length) {
        const textAfter = content.slice(lastEnd);
        if (textAfter.trim()) {
            elements.push(_jsx(Markdown, { mode: "minimal", onUrlClick: onUrlClick, onFileClick: onFileClick, className: "inline text-sm [&_a]:underline [&_code]:bg-foreground/10 [&_p]:whitespace-pre-wrap [&_p]:inline", children: textAfter }, "text-end"));
        }
    }
    // Use <p> to match Markdown's block-level line-height behavior
    return _jsx("p", { className: "text-sm", children: elements });
}
export function UserMessageBubble({ content, className, onUrlClick, onFileClick, attachments, textElements, isPending, isQueued, compactMode, timestamp, onCopy, onEdit, canEdit, }) {
    const { t } = useTranslation();
    const hasAttachments = attachments && attachments.length > 0;
    const [isEditing, setIsEditing] = React.useState(false);
    const [draft, setDraft] = React.useState(content);
    const [isSaving, setIsSaving] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const copyResetTimeoutRef = React.useRef(null);
    const resolvedBadges = React.useMemo(() => textElementsToContentBadges(content, textElements), [content, textElements]);
    // Separate edit_request badges (rendered above bubble) from other badges (rendered inline)
    const editRequestBadges = resolvedBadges?.filter(isEditRequestBadge) ?? [];
    const inlineBadges = resolvedBadges?.filter(b => !isEditRequestBadge(b)) ?? [];
    const hasEditRequestBadges = editRequestBadges.length > 0;
    const hasInlineBadges = inlineBadges.length > 0;
    // Strip edit_request content from the displayed text
    // Each badge has start/end positions marking where to remove content
    let displayContent = content;
    if (hasEditRequestBadges) {
        // Sort badges by start position descending so we can remove from end to start
        // (this preserves positions for earlier removals)
        const sortedBadges = [...editRequestBadges].sort((a, b) => b.start - a.start);
        for (const badge of sortedBadges) {
            displayContent = displayContent.slice(0, badge.start) + displayContent.slice(badge.end);
        }
        displayContent = displayContent.trim();
    }
    const messageTime = formatMessageTime(timestamp);
    const dateTime = typeof timestamp === 'number' && Number.isFinite(timestamp)
        ? new Date(timestamp).toISOString()
        : undefined;
    const visibleContent = displayContent.trim();
    const showCopyAction = !!onCopy && !compactMode;
    const showEditAction = !!onEdit && !!canEdit && !compactMode;
    const showMetaRow = !compactMode && (!!messageTime || showCopyAction || showEditAction);
    React.useEffect(() => {
        if (!isEditing)
            setDraft(visibleContent);
    }, [isEditing, visibleContent]);
    React.useEffect(() => {
        setCopied(false);
    }, [visibleContent]);
    React.useEffect(() => {
        return () => {
            if (copyResetTimeoutRef.current)
                clearTimeout(copyResetTimeoutRef.current);
        };
    }, []);
    const handleCancelEdit = React.useCallback(() => {
        setDraft(visibleContent);
        setIsEditing(false);
    }, [visibleContent]);
    React.useEffect(() => {
        if (isEditing && !showEditAction)
            handleCancelEdit();
    }, [handleCancelEdit, isEditing, showEditAction]);
    const handleSaveEdit = React.useCallback(async () => {
        if (!onEdit || isSaving)
            return;
        const nextContent = draft.trim();
        if (!nextContent || nextContent === visibleContent) {
            handleCancelEdit();
            return;
        }
        setIsSaving(true);
        try {
            await onEdit(nextContent);
            setIsEditing(false);
        }
        catch {
            // Caller owns user-facing error handling; keep the draft open for correction.
        }
        finally {
            setIsSaving(false);
        }
    }, [draft, handleCancelEdit, isSaving, onEdit, visibleContent]);
    const handleEditKeyDown = React.useCallback((event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            handleCancelEdit();
        }
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void handleSaveEdit();
        }
    }, [handleCancelEdit, handleSaveEdit]);
    const handleCopy = React.useCallback(async () => {
        if (!onCopy)
            return;
        try {
            await onCopy(visibleContent);
            setCopied(true);
            if (copyResetTimeoutRef.current)
                clearTimeout(copyResetTimeoutRef.current);
            copyResetTimeoutRef.current = setTimeout(() => setCopied(false), 1600);
        }
        catch {
            // Caller owns user-facing error handling.
        }
    }, [onCopy, visibleContent]);
    return (_jsxs("div", { className: cn("flex flex-col items-end gap-3 w-full", className), children: [hasAttachments && (_jsx("div", { className: "flex gap-2 justify-end max-w-[80%] flex-wrap", children: attachments.map((att, i) => {
                    const isImage = att.type === 'image';
                    const hasThumbnail = !!att.thumbnailBase64;
                    return (_jsx("div", { className: "shrink-0 cursor-pointer hover:opacity-80 transition-opacity", onClick: () => att.storedPath && onFileClick?.(att.storedPath), title: t('chat.clickToOpen', { name: att.name }), children: isImage ? (
                        /* IMAGE: Square thumbnail only */
                        _jsx("div", { className: "h-14 w-14 rounded-[8px] overflow-hidden bg-background shadow-minimal", children: hasThumbnail ? (_jsx("img", { src: `data:image/png;base64,${att.thumbnailBase64}`, alt: att.name, className: "h-full w-full object-cover" })) : (_jsx("div", { className: "h-full w-full flex items-center justify-center", children: _jsx(FileTypeIcon, { type: att.type, mimeType: att.mimeType, className: "h-5 w-5" }) })) })) : (
                        /* DOCUMENT: Bubble with thumbnail/icon + 2-line text */
                        _jsxs("div", { className: "flex items-center gap-2.5 rounded-[8px] bg-user-message-bubble pl-1.5 pr-3 py-1.5", children: [_jsx("div", { className: "h-11 w-8 rounded-[6px] overflow-hidden bg-background shadow-minimal flex items-center justify-center shrink-0", children: hasThumbnail ? (_jsx("img", { src: `data:image/png;base64,${att.thumbnailBase64}`, alt: att.name, className: "h-full w-full object-cover object-top" })) : (_jsx(FileTypeIcon, { type: att.type, mimeType: att.mimeType, className: "h-5 w-5" })) }), _jsxs("div", { className: "flex flex-col min-w-0 max-w-[120px]", children: [_jsx("span", { className: "text-xs font-medium line-clamp-2 break-all", title: att.name, children: att.name }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: getFileTypeLabel(att.type, att.mimeType, att.name) })] })] })) }, att.id || i));
                }) })), hasEditRequestBadges && (_jsx("div", { className: "flex gap-2 justify-end max-w-[80%] flex-wrap", children: editRequestBadges.map((badge, i) => (_jsx(EditRequestBadge, { badge: badge }, `edit-badge-${i}`))) })), isEditing ? (_jsxs("div", { className: "flex w-[min(80%,42rem)] flex-col items-end gap-2", children: [_jsx("textarea", { value: draft, onChange: (event) => setDraft(event.target.value), onKeyDown: handleEditKeyDown, autoFocus: true, rows: Math.min(8, Math.max(2, draft.split('\n').length)), className: cn('w-full resize-y rounded-[16px] bg-user-message-bubble px-5 py-3.5 text-sm leading-relaxed text-foreground', 'outline-none ring-1 ring-foreground/10 transition-shadow focus:ring-2 focus:ring-ring/40') }), _jsx(TooltipProvider, { children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(MessageActionButton, { label: t('common.cancel'), onClick: handleCancelEdit, disabled: isSaving, children: _jsx(X, { className: "size-3.5" }) }), _jsx(MessageActionButton, { label: isSaving ? t('settings.input.sending') : t('shortcuts.sendMessage'), onClick: () => void handleSaveEdit(), disabled: isSaving || draft.trim().length === 0, children: _jsx(SendHorizontal, { className: "size-3.5" }) })] }) })] })) : (_jsxs("div", { className: "group/message flex max-w-[80%] flex-col items-end gap-1", children: [_jsx("div", { className: cn("w-fit max-w-full bg-user-message-bubble rounded-[16px] break-words min-w-0 select-text [&_p]:m-0", compactMode ? "px-4 py-2" : "px-5 py-3.5", isPending && "animate-shimmer"), children: hasInlineBadges
                            ? renderContentWithBadges(displayContent, inlineBadges, onUrlClick, onFileClick)
                            : (_jsx(Markdown, { mode: "minimal", onUrlClick: onUrlClick, onFileClick: onFileClick, className: "text-sm [&_a]:underline [&_code]:bg-foreground/10 [&_p]:whitespace-pre-wrap", children: displayContent })) }), showMetaRow && (_jsx(TooltipProvider, { children: _jsxs("div", { className: "flex h-5 items-center justify-end gap-1.5 pr-0.5 text-[11px] font-medium tabular-nums text-muted-foreground/70 opacity-0 pointer-events-none transition-opacity duration-150 select-none group-hover/message:pointer-events-auto group-hover/message:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100", children: [messageTime && (_jsx("time", { dateTime: dateTime, children: messageTime })), showCopyAction && (_jsx(MessageActionButton, { label: copied ? t('common.copied') : t('common.copy'), onClick: () => { void handleCopy(); }, children: copied ? _jsx(Check, { className: "size-3.5" }) : _jsx(Copy, { className: "size-3.5" }) })), showEditAction && (_jsx(MessageActionButton, { label: t('common.edit'), onClick: () => setIsEditing(true), children: _jsx(Pencil, { className: "size-3.5" }) }))] }) }))] })), isQueued && (_jsx("span", { className: "text-[10px] text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full", children: "queued" }))] }));
}
//# sourceMappingURL=UserMessageBubble.js.map