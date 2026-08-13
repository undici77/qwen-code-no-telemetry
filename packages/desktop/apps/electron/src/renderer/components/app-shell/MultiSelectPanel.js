import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MultiSelectPanel - Panel shown when multiple items are selected.
 *
 * Displays the selection count and optional batch action buttons.
 * Used for sessions (with status/label/archive actions), sources, and skills.
 */
import * as React from 'react';
import { Archive, Tag, CheckCircle2, Send } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { isMac } from '@/lib/platform';
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSeparator, StyledDropdownMenuSubContent, StyledDropdownMenuSubTrigger, DropdownMenuSub, } from '@/components/ui/styled-dropdown';
import { LabelMenuItems, StatusMenuItems } from './SessionMenuParts';
import { FEATURE_FLAGS } from '@craft-agent/shared/feature-flags';
export function MultiSelectPanel({ count, entityType = 'session', sessionStatuses = [], activeStatusId, onSetStatus, labels = [], appliedLabelIds = new Set(), onToggleLabel, onArchive, onSendToWorkspace, onClearSelection, className, }) {
    const { t } = useTranslation();
    const clickLabel = t('multiSelect.click');
    const commandClick = (_jsxs(KbdGroup, { children: [_jsx(Kbd, { children: isMac ? '⌘' : 'Ctrl' }), _jsx(Kbd, { children: clickLabel })] }));
    const shiftClick = (_jsxs(KbdGroup, { children: [_jsx(Kbd, { children: "\u21E7" }), _jsx(Kbd, { children: clickLabel })] }));
    return (_jsxs("div", { className: cn('flex flex-col items-center justify-center h-full gap-6 p-8', className), children: [_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center", children: _jsx("span", { className: "text-2xl font-semibold text-accent", children: count }) }), _jsx("h2", { className: "text-lg font-medium text-foreground", children: t(`multiSelect.selected.${entityType}`, { count }) }), _jsxs("div", { className: "text-sm text-foreground/50 flex flex-col items-center gap-1", children: [_jsx("span", { children: _jsx(Trans, { i18nKey: "multiSelect.selectionHint", components: {
                                        cmdClick: commandClick,
                                        shiftClick,
                                    } }) }), _jsx("span", { children: _jsx(Trans, { i18nKey: "multiSelect.clearSelection", components: { kbd: _jsx(Kbd, {}) } }) })] })] }), _jsxs("div", { className: "flex flex-wrap justify-center gap-2", children: [onSetStatus && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "gap-2 bg-background shadow-minimal hover:bg-foreground/[0.03]", children: [_jsx(CheckCircle2, { className: "w-4 h-4" }), t('multiSelect.changeStatus')] }) }), _jsx(StyledDropdownMenuContent, { align: "center", children: _jsx(StatusMenuItems, { sessionStatuses: sessionStatuses, activeStateId: activeStatusId ?? undefined, onSelect: onSetStatus, menu: { MenuItem: StyledDropdownMenuItem } }) })] })), FEATURE_FLAGS.sessionLabelsUi &&
                        onToggleLabel &&
                        labels.length > 0 && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "gap-2 bg-background shadow-minimal hover:bg-foreground/[0.03]", children: [_jsx(Tag, { className: "w-4 h-4" }), t('multiSelect.setLabels')] }) }), _jsx(StyledDropdownMenuContent, { align: "center", className: "min-w-[220px]", children: _jsx(LabelMenuItems, { labels: labels, appliedLabelIds: appliedLabelIds, onToggle: onToggleLabel, menu: {
                                        MenuItem: StyledDropdownMenuItem,
                                        Separator: StyledDropdownMenuSeparator,
                                        Sub: DropdownMenuSub,
                                        SubTrigger: StyledDropdownMenuSubTrigger,
                                        SubContent: StyledDropdownMenuSubContent,
                                    } }) })] })), onSendToWorkspace && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: onSendToWorkspace, className: "gap-2 bg-background shadow-minimal hover:bg-foreground/[0.03]", children: [_jsx(Send, { className: "w-4 h-4" }), t('sessionMenu.sendToWorkspace')] })), onArchive && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: onArchive, className: "gap-2 bg-background shadow-minimal hover:bg-foreground/[0.03]", children: [_jsx(Archive, { className: "w-4 h-4" }), t('sessionMenu.archive')] }))] })] }));
}
//# sourceMappingURL=MultiSelectPanel.js.map