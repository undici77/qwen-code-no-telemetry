import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * HeaderMenu
 *
 * A "..." dropdown menu for panel headers with built-in Open in New Window action.
 * Pass page-specific menu items as children; they appear above the separator.
 * Optionally includes a "Learn More" link to documentation when helpFeature is provided.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, AppWindow, ExternalLink } from 'lucide-react';
import { HeaderIconButton } from './HeaderIconButton';
import { DropdownMenu, DropdownMenuTrigger, } from './dropdown-menu';
import { StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSeparator, } from './styled-dropdown';
import { getDocUrl } from '@craft-agent/shared/docs/doc-links';
export function HeaderMenu({ route, children, helpFeature }) {
    const { t } = useTranslation();
    const handleOpenInNewWindow = async () => {
        const separator = route.includes('?') ? '&' : '?';
        const url = `craftagents://${route}${separator}window=focused`;
        try {
            await window.electronAPI?.openUrl(url);
        }
        catch (error) {
            console.error('[HeaderMenu] openUrl failed:', error);
        }
    };
    const handleLearnMore = helpFeature ? () => {
        window.electronAPI?.openUrl(getDocUrl(helpFeature));
    } : undefined;
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(HeaderIconButton, { icon: _jsx(MoreHorizontal, { className: "h-4 w-4" }) }) }), _jsxs(StyledDropdownMenuContent, { align: "end", children: [children, children && _jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: handleOpenInNewWindow, children: [_jsx(AppWindow, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("sessionMenu.openInNewWindow") })] }), helpFeature && (_jsxs(_Fragment, { children: [_jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: handleLearnMore, children: [_jsx(ExternalLink, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t("common.learnMore") })] })] }))] })] }));
}
//# sourceMappingURL=HeaderMenu.js.map