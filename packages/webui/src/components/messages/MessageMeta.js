import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState, } from 'react';
import { usePlatform } from '../../context/PlatformContext.js';
import { CopyIcon } from '../icons/EditIcons.js';
import { CheckIcon } from '../icons/StatusIcons.js';
function getMessageDate(timestamp) {
    if (typeof timestamp !== 'number' ||
        !Number.isFinite(timestamp) ||
        timestamp <= 0) {
        return null;
    }
    return new Date(timestamp);
}
function formatMessageTime(timestamp) {
    const date = getMessageDate(timestamp);
    if (!date) {
        return null;
    }
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}
function formatMessageDateTime(timestamp) {
    const date = getMessageDate(timestamp);
    if (!date) {
        return undefined;
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}
export const MessageMeta = ({ timestamp, copyText, onEdit, editDisabled = false, editIcon, }) => {
    const platform = usePlatform();
    const platformCopyToClipboard = platform.copyToClipboard;
    const [copied, setCopied] = useState(false);
    const resetTimerRef = useRef(null);
    const formattedTime = formatMessageTime(timestamp);
    const canCopy = platform.features?.canCopy !== false && copyText.length > 0;
    const dateTime = formatMessageDateTime(timestamp);
    useEffect(() => () => {
        if (resetTimerRef.current !== null) {
            window.clearTimeout(resetTimerRef.current);
        }
    }, []);
    const handleCopy = useCallback(async (event) => {
        event.stopPropagation();
        if (!canCopy) {
            return;
        }
        try {
            if (platformCopyToClipboard) {
                await platformCopyToClipboard(copyText);
            }
            else {
                await navigator.clipboard.writeText(copyText);
            }
            setCopied(true);
            if (resetTimerRef.current !== null) {
                window.clearTimeout(resetTimerRef.current);
            }
            resetTimerRef.current = window.setTimeout(() => {
                setCopied(false);
                resetTimerRef.current = null;
            }, 1400);
        }
        catch (error) {
            console.error('Failed to copy message:', error);
        }
    }, [canCopy, copyText, platformCopyToClipboard]);
    if (!formattedTime && !canCopy && !onEdit) {
        return null;
    }
    return (_jsxs("div", { className: "mt-1 flex min-h-6 items-center gap-1 text-xs text-[var(--app-secondary-foreground)]", children: [formattedTime && (_jsx("time", { className: "select-none opacity-60", dateTime: dateTime, children: formattedTime })), _jsxs("div", { className: `flex items-center gap-0.5 transition-opacity focus-within:opacity-100 ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`, children: [canCopy && (_jsx("button", { type: "button", className: `inline-flex h-6 w-6 items-center justify-center rounded-sm border border-transparent bg-transparent transition-colors hover:bg-[var(--app-ghost-button-hover-background)] hover:opacity-100 focus:opacity-100 ${copied ? 'text-[#74c991] opacity-100' : ''}`, title: copied ? 'Copied' : 'Copy message', "aria-label": copied ? 'Copied' : 'Copy message', onClick: handleCopy, children: copied ? _jsx(CheckIcon, { size: 14 }) : _jsx(CopyIcon, { size: 14 }) })), onEdit && (_jsx("button", { type: "button", className: "inline-flex h-6 w-6 items-center justify-center rounded-sm border border-transparent bg-transparent transition-colors hover:bg-[var(--app-ghost-button-hover-background)] hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed disabled:opacity-30", title: "Edit message", "aria-label": "Edit message", onClick: onEdit, disabled: editDisabled, children: editIcon }))] })] }));
};
//# sourceMappingURL=MessageMeta.js.map