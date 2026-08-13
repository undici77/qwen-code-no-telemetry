import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, FileDiff, ArrowUpRight } from 'lucide-react';
import { SimpleDropdown, SimpleDropdownItem } from '../ui/SimpleDropdown';
import { cn } from '../../lib/utils';
/**
 * TurnCardActionsMenu - Dropdown menu for TurnCard header actions
 *
 * Shows:
 * - "View file changes" when turn has Edit/Write activities
 * - "View turn details" always
 */
export function TurnCardActionsMenu({ onOpenDetails, onOpenMultiFileDiff, hasEditOrWriteActivities, className, }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);
    // Don't render if no actions available
    if (!onOpenDetails && !onOpenMultiFileDiff) {
        return null;
    }
    return (_jsxs(SimpleDropdown, { align: "end", onOpenChange: setIsOpen, trigger: _jsx("div", { role: "button", tabIndex: 0, className: cn("p-1 rounded-[6px] transition-opacity shrink-0", "opacity-0 group-hover:opacity-100", "bg-background shadow-minimal", "text-muted-foreground/50 hover:text-foreground", "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100", isOpen && "opacity-100 text-foreground", className), onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                }
            }, children: _jsx(MoreHorizontal, { className: "w-3 h-3" }) }), children: [onOpenMultiFileDiff && hasEditOrWriteActivities && (_jsx(SimpleDropdownItem, { onClick: onOpenMultiFileDiff, icon: _jsx(FileDiff, {}), children: t('chat.viewFileChanges') })), onOpenDetails && (_jsx(SimpleDropdownItem, { onClick: onOpenDetails, icon: _jsx(ArrowUpRight, {}), children: t('chat.viewTurnDetails') }))] }));
}
//# sourceMappingURL=TurnCardActionsMenu.js.map