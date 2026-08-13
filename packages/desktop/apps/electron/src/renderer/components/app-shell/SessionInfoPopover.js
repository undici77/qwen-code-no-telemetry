import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { useAppShellContext, useSession } from '@/context/AppShellContext';
import { cn } from '@/lib/utils';
import { SessionFilesSection } from '../right-sidebar/SessionFilesSection';
const DEFAULT_POPOVER_CONTENT_CLASS = 'w-[360px] h-[460px] min-w-[200px] max-w-[420px] overflow-hidden rounded-[8px] bg-background text-foreground shadow-modal-small p-0';
const DEFAULT_DRAWER_CONTENT_CLASS = [
    'data-[vaul-drawer-direction=bottom]:inset-x-2',
    'data-[vaul-drawer-direction=bottom]:bottom-2',
    'data-[vaul-drawer-direction=bottom]:mt-0',
    'data-[vaul-drawer-direction=bottom]:max-h-[min(82vh,42rem)]',
    'overflow-hidden rounded-[14px] border border-border/60 bg-background shadow-modal-small',
].join(' ');
export function SessionInfoPopover({ sessionId, sessionFolderPath, trigger, side = 'top', align = 'end', sideOffset = 6, contentClassName, presentation = 'popover', }) {
    const [open, setOpen] = React.useState(false);
    const handleOpenChange = React.useCallback((nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            requestAnimationFrame(() => {
                window.dispatchEvent(new CustomEvent('craft:focus-input', {
                    detail: { sessionId },
                }));
            });
        }
    }, [sessionId]);
    if (presentation === 'drawer') {
        return (_jsxs(Drawer, { open: open, onOpenChange: handleOpenChange, direction: "bottom", children: [_jsx(DrawerTrigger, { asChild: true, children: trigger }), _jsxs(DrawerContent, { className: cn(DEFAULT_DRAWER_CONTENT_CLASS, contentClassName), onOpenAutoFocus: (e) => {
                        e.preventDefault();
                    }, children: [_jsx(DrawerHeader, { className: "border-b border-border/50 px-4 py-3 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left", children: _jsx(DrawerTitle, { className: "text-sm font-medium", children: "Session info" }) }), _jsx("div", { className: "flex-1 min-h-0 overflow-hidden", children: _jsx(SessionInfoPopoverContent, { sessionId: sessionId, sessionFolderPath: sessionFolderPath }) })] })] }));
    }
    return (_jsxs(Popover, { open: open, onOpenChange: handleOpenChange, children: [_jsx(PopoverTrigger, { asChild: true, children: trigger }), _jsx(PopoverContent, { className: contentClassName ?? DEFAULT_POPOVER_CONTENT_CLASS, side: side, align: align, sideOffset: sideOffset, onOpenAutoFocus: (e) => {
                    e.preventDefault();
                }, onCloseAutoFocus: (e) => {
                    e.preventDefault();
                }, children: _jsx(SessionInfoPopoverContent, { sessionId: sessionId, sessionFolderPath: sessionFolderPath }) })] }));
}
function SessionInfoPopoverContent({ sessionId, sessionFolderPath }) {
    const { t } = useTranslation();
    const session = useSession(sessionId);
    const { onRenameSession } = useAppShellContext();
    const [name, setName] = React.useState('');
    const renameTimeoutRef = React.useRef(null);
    React.useEffect(() => {
        setName(session?.name || '');
    }, [session?.name]);
    React.useEffect(() => {
        return () => {
            if (renameTimeoutRef.current) {
                clearTimeout(renameTimeoutRef.current);
            }
        };
    }, []);
    const handleNameChange = React.useCallback((e) => {
        const newName = e.target.value;
        setName(newName);
        if (renameTimeoutRef.current) {
            clearTimeout(renameTimeoutRef.current);
        }
        renameTimeoutRef.current = setTimeout(() => {
            const trimmed = newName.trim();
            if (trimmed) {
                onRenameSession(sessionId, trimmed);
            }
        }, 500);
    }, [onRenameSession, sessionId]);
    return (_jsxs("div", { className: "h-full min-h-0 flex flex-col", children: [_jsxs("div", { className: "shrink-0 p-3 border-b border-border/50", children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground block mb-1.5 select-none", children: t("chat.title") }), _jsx("div", { className: "rounded-lg bg-foreground-2 has-[:focus]:bg-background shadow-minimal transition-colors", children: _jsx(Input, { value: name, onChange: handleNameChange, placeholder: t("chat.titlePlaceholder"), className: "h-9 py-2 text-sm border-0 shadow-none bg-transparent focus-visible:ring-0" }) })] }), _jsx("div", { className: "flex-1 min-h-0 overflow-hidden", children: _jsx(SessionFilesSection, { sessionId: sessionId, sessionFolderPath: sessionFolderPath, hideHeader: false, className: "h-full min-h-0" }) })] }));
}
//# sourceMappingURL=SessionInfoPopover.js.map