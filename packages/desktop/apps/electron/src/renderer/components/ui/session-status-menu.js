import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from "react-i18next";
import { Command as CommandPrimitive } from 'cmdk';
import { Archive, ArchiveRestore } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSessionStatusDisplayLabel, getStateIcon, getStateColor, getStatusIconStyle, } from '@/config/session-status-config';
// Re-export types for backwards compatibility
export { getStateIcon, getStateColor };
// ============================================================================
// Shared Styles (matching slash-command-menu)
// ============================================================================
const MENU_CONTAINER_STYLE = 'min-w-[180px] overflow-hidden rounded-[8px] bg-background text-foreground shadow-modal-small';
const MENU_LIST_STYLE = 'max-h-[240px] overflow-y-auto p-1 [&_[cmdk-list-sizer]]:space-y-px';
const MENU_ITEM_STYLE = 'flex cursor-pointer select-none items-center gap-3 rounded-[6px] px-3 py-1.5 text-[13px]';
// ============================================================================
// StateItemContent - Shared item rendering
// ============================================================================
function StateItemContent({ state }) {
    const { t } = useTranslation();
    const label = getSessionStatusDisplayLabel(state, t);
    return (_jsxs(_Fragment, { children: [_jsx("span", { className: "shrink-0 flex items-center", style: getStatusIconStyle(state), children: state.icon }), _jsx("div", { className: "flex-1 min-w-0", children: label })] }));
}
export function SessionStatusMenu({ states = [], activeState, onSelect, isArchived, onArchive, onUnarchive, className, }) {
    const { t } = useTranslation();
    const [filter, setFilter] = React.useState('');
    const inputRef = React.useRef(null);
    // Focus input when menu opens
    React.useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
        return () => clearTimeout(timer);
    }, []);
    // Find default value - prefer active state, otherwise first item
    const defaultValue = activeState || states[0]?.id;
    return (_jsxs(CommandPrimitive, { className: cn(MENU_CONTAINER_STYLE, className), defaultValue: defaultValue, children: [_jsx("div", { className: "border-b border-border/50 px-3 py-2", children: _jsx(CommandPrimitive.Input, { ref: inputRef, value: filter, onValueChange: setFilter, placeholder: t("status.filterStatuses"), className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50" }) }), _jsxs(CommandPrimitive.List, { className: MENU_LIST_STYLE, children: [_jsx(CommandPrimitive.Empty, { className: "py-3 text-center text-sm text-muted-foreground", children: t('status.noStatusFound') }), states.map((state) => {
                        const isActive = activeState === state.id;
                        const label = getSessionStatusDisplayLabel(state, t);
                        return (_jsx(CommandPrimitive.Item, { value: label, onSelect: () => onSelect(state.id), className: cn(MENU_ITEM_STYLE, 'outline-none', isActive ? 'bg-foreground/7' : 'data-[selected=true]:bg-foreground/3'), children: _jsx(StateItemContent, { state: state }) }, state.id));
                    }), !filter && (isArchived ? onUnarchive : onArchive) && (_jsxs(_Fragment, { children: [_jsx("div", { className: "border-t border-border/50 mx-2 my-1" }), _jsxs(CommandPrimitive.Item, { value: isArchived ? "unarchive" : "archive", onSelect: () => isArchived ? onUnarchive?.() : onArchive?.(), className: cn(MENU_ITEM_STYLE, 'outline-none', 'data-[selected=true]:bg-foreground/3'), children: [_jsx("span", { className: "shrink-0 flex items-center opacity-60", children: isArchived ? _jsx(ArchiveRestore, { className: "w-3.5 h-3.5" }) : _jsx(Archive, { className: "w-3.5 h-3.5" }) }), _jsx("div", { className: "flex-1 min-w-0", children: isArchived ? t('sessionMenu.unarchive') : t('sessionMenu.archive') })] })] }))] })] }));
}
//# sourceMappingURL=session-status-menu.js.map