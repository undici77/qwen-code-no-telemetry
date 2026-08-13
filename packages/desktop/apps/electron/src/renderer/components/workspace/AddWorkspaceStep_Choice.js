import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { FolderPlus, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddWorkspaceContainer, AddWorkspaceStepHeader } from './primitives';
function ChoiceCard({ icon, title, description, onClick, variant = 'secondary', }) {
    return (_jsxs("button", { onClick: onClick, className: cn('flex items-center gap-4 w-full p-4 rounded-lg text-left', 'bg-background shadow-minimal', 'transition-all duration-150', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', variant === 'primary' ? 'hover:bg-accent/5' : 'hover:bg-foreground/5'), children: [_jsx("div", { className: cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', variant === 'primary'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-foreground/5 text-foreground/70'), children: icon }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-medium text-[15px] text-foreground", children: title }), _jsx("div", { className: "text-[12px] text-muted-foreground -mt-[1px]", children: description })] })] }));
}
/**
 * AddWorkspaceStep_Choice - Initial step to choose creation method
 *
 * Two options:
 * 1. Create new workspace - Creates a fresh workspace folder
 * 2. Open folder as workspace - Use an existing folder
 */
export function AddWorkspaceStep_Choice({ onCreateNew, onOpenFolder, }) {
    const { t } = useTranslation();
    return (_jsxs(AddWorkspaceContainer, { children: [_jsx("div", { className: "mt-2" }), _jsx(AddWorkspaceStepHeader, { title: t('workspace.addWorkspace'), description: t('workspace.addWorkspaceDesc') }), _jsxs("div", { className: "mt-8 w-full space-y-3", children: [_jsx(ChoiceCard, { icon: _jsx(FolderPlus, { className: "h-5 w-5" }), title: t('workspace.createNew'), description: t('workspace.createNewDesc'), onClick: onCreateNew, variant: "primary" }), _jsx(ChoiceCard, { icon: _jsx(FolderOpen, { className: "h-5 w-5" }), title: t('workspace.openFolder'), description: t('workspace.openFolderDesc'), onClick: onOpenFolder })] })] }));
}
//# sourceMappingURL=AddWorkspaceStep_Choice.js.map