import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Info_Page
 *
 * Compound page layout component for Info pages.
 * Handles loading, error, and empty states with consistent styling.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@craft-agent/ui';
import { cn } from '@/lib/utils';
import { CHAT_LAYOUT } from '@/config/layout';
function Info_PageRoot({ children, loading, error, empty, className, }) {
    const { t } = useTranslation();
    // Extract header from children for consistent structure
    let header = null;
    const otherChildren = [];
    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === Info_PageHeader) {
            header = child;
        }
        else {
            otherChildren.push(child);
        }
    });
    // Loading state
    if (loading) {
        return (_jsxs("div", { className: cn('h-full flex flex-col', className), children: [header, _jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsx(Spinner, { className: "text-lg text-muted-foreground" }) })] }));
    }
    // Error state
    if (error) {
        return (_jsxs("div", { className: cn('h-full flex flex-col', className), children: [header, _jsxs("div", { className: "flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground p-4", children: [_jsx(AlertCircle, { className: "h-10 w-10 text-destructive" }), _jsx("p", { className: "text-sm font-medium", children: t('common.errorLoadingContent') }), _jsx("p", { className: "text-xs text-center max-w-md", children: error })] })] }));
    }
    // Empty state
    if (empty) {
        return (_jsxs("div", { className: cn('h-full flex flex-col', className), children: [header, _jsx("div", { className: "flex-1 flex items-center justify-center text-muted-foreground", children: _jsx("p", { className: "text-sm", children: empty }) })] }));
    }
    // Normal content
    return (_jsxs("div", { className: cn('h-full flex flex-col', className), children: [header, otherChildren] }));
}
function Info_PageHeader({ className, ...props }) {
    return _jsx(PanelHeader, { className: className, ...props });
}
function Info_PageHero({ avatar, title, tagline, className }) {
    return (_jsxs("div", { className: cn('flex items-start gap-3', className), children: [_jsx("div", { className: "h-[32px] w-[32px] shrink-0 mt-[2px] rounded-[4px] ring-1 ring-border/30 overflow-hidden", children: avatar }), _jsxs("div", { className: "flex-1 min-w-0", children: [title && (_jsx("h2", { className: "text-base font-semibold text-foreground leading-tight", children: title })), tagline && (_jsx("p", { className: cn('text-sm text-foreground/60 leading-snug line-clamp-1', title ? 'mt-0.5' : 'mt-0'), children: tagline }))] })] }));
}
function Info_PageContent({ children, className }) {
    return (_jsx("div", { className: "relative flex-1 min-h-0", children: _jsx("div", { className: "h-full", style: {
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 32px, black calc(100% - 32px), transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 32px, black calc(100% - 32px), transparent 100%)'
            }, children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: cn(CHAT_LAYOUT.maxWidth, 'mx-auto px-5 pt-6 pb-10'), children: _jsx("div", { className: cn('space-y-6', className), children: children }) }) }) }) }));
}
export const Info_Page = Object.assign(Info_PageRoot, {
    Header: Info_PageHeader,
    Hero: Info_PageHero,
    Content: Info_PageContent,
});
//# sourceMappingURL=Info_Page.js.map